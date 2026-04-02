import type { CellCoordinate, SolverMoveState } from "@/types/chessboard";

import type {
  FindAllOptions,
  FindAllResult,
  SolveFirstOptions,
  SolveFirstResult,
  SolverEventType,
  SolverStats
} from "@/lib/solvers/types";
import { countSetBits, orderBitsByStrategy } from "@/lib/solvers/branch-ordering";
import {
  createPruningStats,
  hasFutureFeasibleRowsBitmask,
  hasRemainingColumnCapacityBitmask
} from "@/lib/solvers/pruning";
import { createSymmetryStats, getRootBranches, mirrorSolution } from "@/lib/solvers/symmetry";

function bitToColumn(bit: number) {
  return 31 - Math.clz32(bit);
}

/**
 * Shared frame emitter for bitmask first-solution mode.
 * Emits a snapshot copy of `queensByRow` for visualization consumers.
 */
function createFrameEmitter(
  onFrame: SolveFirstOptions["onFrame"],
  waitForPacing: SolveFirstOptions["waitForPacing"],
  queensByRow: number[],
  stats: SolverStats
) {
  return async (
    eventType: SolverEventType,
    moveState: SolverMoveState,
    activeCell: CellCoordinate | null,
    message: string,
    searchDepth: number
  ) => {
    if (onFrame) {
      stats.step += 1;
      onFrame({
        eventType,
        moveState,
        activeCell,
        message,
        step: stats.step,
        queensByRow: [...queensByRow],
        recursiveCalls: stats.recursiveCalls,
        backtracks: stats.backtracks,
        solutionsFound: stats.solutionsFound,
        searchDepth
      });
    }
    if (waitForPacing) {
      await waitForPacing();
    }
  };
}

/**
 * Bitmask-based first-solution solver.
 *
 * State encoding:
 * - `columnsMask`: occupied columns
 * - `diagonalMask`: occupied major diagonals for current row
 * - `antiDiagonalMask`: occupied minor diagonals for current row
 */
export async function solveBitmaskFirst({
  boardSize,
  symmetryEnabled = false,
  searchStrategy = "left-to-right",
  onFrame,
  shouldStop,
  waitForPacing
}: SolveFirstOptions): Promise<SolveFirstResult> {
  const queensByRow = Array.from({ length: boardSize }, () => -1);
  const stats: SolverStats = { step: 0, recursiveCalls: 0, backtracks: 0, solutionsFound: 0 };
  const emitFrame = createFrameEmitter(onFrame, waitForPacing, queensByRow, stats);
  const fullMask = (1 << boardSize) - 1;
  let branchesPruned = 0;
  let deadStatesDetected = 0;

  async function backtrack(
    row: number,
    columnsMask: number,
    diagonalMask: number,
    antiDiagonalMask: number,
    rootCandidatesMask: number
  ): Promise<boolean> {
    stats.recursiveCalls += 1;

    if (shouldStop()) {
      return false;
    }

    if (row === boardSize) {
      stats.solutionsFound += 1;
      await emitFrame("solution-found", "valid", null, "Solution found.", boardSize);
      return true;
    }

    if (!hasRemainingColumnCapacityBitmask(boardSize, row, columnsMask, fullMask)) {
      branchesPruned += 1;
      deadStatesDetected += 1;
      await emitFrame("invalid-move", "invalid", null, "Pruned dead state: insufficient free columns.", row);
      return false;
    }

    if (!hasFutureFeasibleRowsBitmask(row, boardSize, fullMask, columnsMask, diagonalMask, antiDiagonalMask)) {
      branchesPruned += 1;
      deadStatesDetected += 1;
      await emitFrame("invalid-move", "invalid", null, "Pruned dead state: future rows blocked.", row);
      return false;
    }

    let available = fullMask & ~(columnsMask | diagonalMask | antiDiagonalMask);
    if (row === 0) {
      available &= rootCandidatesMask;
    }

    const orderedBits = orderBitsByStrategy(available, boardSize, searchStrategy, (bit) => {
      const nextColumns = columnsMask | bit;
      const nextDiagonals = ((diagonalMask | bit) << 1) & fullMask;
      const nextAntiDiagonals = (antiDiagonalMask | bit) >>> 1;
      const nextAvailable = fullMask & ~(nextColumns | nextDiagonals | nextAntiDiagonals);
      return countSetBits(nextAvailable);
    });

    for (const bit of orderedBits) {
      if (shouldStop()) {
        return false;
      }

      const col = bitToColumn(bit);
      const activeCell = { row, col };

      await emitFrame("trying-move", "trying", activeCell, `Trying row ${row + 1}, column ${col + 1}.`, row + 1);

      queensByRow[row] = col;
      await emitFrame("queen-placed", "valid", activeCell, "Queen placed.", row + 1);

      const solved = await backtrack(
        row + 1,
        columnsMask | bit,
        ((diagonalMask | bit) << 1) & fullMask,
        (antiDiagonalMask | bit) >>> 1,
        rootCandidatesMask
      );

      if (solved) {
        return true;
      }

      queensByRow[row] = -1;
      stats.backtracks += 1;
      await emitFrame("backtracking", "backtracking", activeCell, "Backtracking.", row + 1);
    }

    return false;
  }

  const rootCandidatesMask = getRootBranches(boardSize, symmetryEnabled).reduce((mask, branch) => {
    return mask | (1 << branch.col);
  }, 0);

  const solved = await backtrack(0, 0, 0, 0, rootCandidatesMask);
  return {
    solved,
    queensByRow,
    recursiveCalls: stats.recursiveCalls,
    backtracks: stats.backtracks,
    solutionsFound: stats.solutionsFound,
    symmetry: createSymmetryStats(boardSize, symmetryEnabled),
    pruning: createPruningStats(true, branchesPruned, deadStatesDetected, stats.recursiveCalls)
  };
}

/**
 * Bitmask-based all-solutions solver.
 * Supports:
 * - symmetry mirroring at root
 * - capped solution storage
 * - count-only execution for benchmark/stress runs
 */
export async function findAllBitmask({
  boardSize,
  symmetryEnabled = false,
  searchStrategy = "left-to-right",
  shouldStop,
  maxStoredSolutions,
  countOnly = false,
  yieldEveryNodes = 500,
  onProgress
}: FindAllOptions): Promise<FindAllResult> {
  const queensByRow = Array.from({ length: boardSize }, () => -1);
  const solutions: number[][] = [];
  let recursiveCalls = 0;
  let backtracks = 0;
  let solutionsFound = 0;
  let nodeCounter = 0;
  let capped = false;
  let branchesPruned = 0;
  let deadStatesDetected = 0;

  const fullMask = (1 << boardSize) - 1;

  const emitProgress = (latestRow: number | null, latestCol: number | null, searchDepth: number) => {
    onProgress?.({
      recursiveCalls,
      backtracks,
      solutionsFound,
      latestRow,
      latestCol,
      searchDepth,
      storedSolutionsCount: solutions.length,
      capped
    });
  };

  async function maybeYield() {
    nodeCounter += 1;
    if (nodeCounter % yieldEveryNodes === 0) {
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
    }
  }

  function recordSolution(mirrorFactor: 1 | 2, shouldMirror: boolean) {
    solutionsFound += mirrorFactor;

    if (!countOnly && solutions.length < maxStoredSolutions) {
      solutions.push([...queensByRow]);
    } else if (!countOnly) {
      capped = true;
      return;
    }

    if (!countOnly && shouldMirror && mirrorFactor === 2 && !capped) {
      if (solutions.length < maxStoredSolutions) {
        solutions.push(mirrorSolution(queensByRow, boardSize));
      } else {
        capped = true;
      }
    }
  }

  async function dfs(
    row: number,
    columnsMask: number,
    diagonalMask: number,
    antiDiagonalMask: number,
    mirrorFactor: 1 | 2,
    shouldMirror: boolean
  ): Promise<void> {
    recursiveCalls += 1;

    if (shouldStop() || (capped && !countOnly)) {
      return;
    }

    if (row === boardSize) {
      recordSolution(mirrorFactor, shouldMirror);
      emitProgress(null, null, boardSize);
      await maybeYield();
      return;
    }

    if (!hasRemainingColumnCapacityBitmask(boardSize, row, columnsMask, fullMask)) {
      branchesPruned += 1;
      deadStatesDetected += 1;
      return;
    }

    if (!hasFutureFeasibleRowsBitmask(row, boardSize, fullMask, columnsMask, diagonalMask, antiDiagonalMask)) {
      branchesPruned += 1;
      deadStatesDetected += 1;
      return;
    }

    const available = fullMask & ~(columnsMask | diagonalMask | antiDiagonalMask);

    const orderedBits = orderBitsByStrategy(available, boardSize, searchStrategy, (bit) => {
      const nextColumns = columnsMask | bit;
      const nextDiagonals = ((diagonalMask | bit) << 1) & fullMask;
      const nextAntiDiagonals = (antiDiagonalMask | bit) >>> 1;
      const nextAvailable = fullMask & ~(nextColumns | nextDiagonals | nextAntiDiagonals);
      return countSetBits(nextAvailable);
    });

    for (const bit of orderedBits) {
      if (shouldStop() || (capped && !countOnly)) {
        return;
      }

      const col = bitToColumn(bit);

      queensByRow[row] = col;
      emitProgress(row, col, row + 1);
      await dfs(
        row + 1,
        columnsMask | bit,
        ((diagonalMask | bit) << 1) & fullMask,
        (antiDiagonalMask | bit) >>> 1,
        mirrorFactor,
        shouldMirror
      );

      if (shouldStop() || (capped && !countOnly)) {
        queensByRow[row] = -1;
        return;
      }

      queensByRow[row] = -1;
      backtracks += 1;
      emitProgress(row, col, row + 1);
      await maybeYield();
    }
  }

  const rootBranches = getRootBranches(boardSize, symmetryEnabled);
  const rootBranchesMask = rootBranches.reduce((mask, branch) => mask | (1 << branch.col), 0);
  const available = fullMask & rootBranchesMask;

  const orderedRootBits = orderBitsByStrategy(available, boardSize, searchStrategy, (bit) => {
    const nextColumns = bit;
    const nextDiagonals = (bit << 1) & fullMask;
    const nextAntiDiagonals = bit >>> 1;
    const nextAvailable = fullMask & ~(nextColumns | nextDiagonals | nextAntiDiagonals);
    return countSetBits(nextAvailable);
  });

  for (const bit of orderedRootBits) {
    if (shouldStop() || (capped && !countOnly)) {
      break;
    }

    const col = bitToColumn(bit);
    const branch = rootBranches.find((entry) => entry.col === col);

    if (!branch) {
      continue;
    }

    queensByRow[0] = col;
    emitProgress(0, col, 1);
    await dfs(1, bit, (bit << 1) & fullMask, bit >>> 1, branch.mirrorFactor, !branch.isMiddle);
    queensByRow[0] = -1;
    backtracks += 1;
    emitProgress(0, col, 1);
    await maybeYield();
  }

  return {
    solutions,
    recursiveCalls,
    backtracks,
    solutionsFound,
    capped,
    symmetry: createSymmetryStats(boardSize, symmetryEnabled),
    pruning: createPruningStats(true, branchesPruned, deadStatesDetected, recursiveCalls)
  };
}
