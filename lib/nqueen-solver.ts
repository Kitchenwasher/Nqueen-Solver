import type { CellCoordinate, SolverAlgorithm, SolverMoveState } from "@/types/chessboard";
import { orderColumnsByStrategy } from "@/lib/solvers/branch-ordering";
import { findAllBitmask, solveBitmaskFirst } from "@/lib/solvers/bitmaskSolver";
import {
  normalizeConstraints,
  rowDisallowedMask,
  shouldDisableSymmetry,
  validateConstraints
} from "@/lib/solvers/constraints";
import {
  createPruningStats,
  hasFutureFeasibleRowsSets,
  hasRemainingColumnCapacitySets
} from "@/lib/solvers/pruning";
import { createSymmetryStats, getRootBranches, mirrorSolution } from "@/lib/solvers/symmetry";
import type {
  FindAllOptions,
  SolveFirstOptions,
  SolverEventType,
  SolverFrame,
  SolverStats
} from "@/lib/solvers/types";

export type { SolverEventType, SolverFrame } from "@/lib/solvers/types";

export type SolveNQueenOptions = SolveFirstOptions & {
  algorithm: SolverAlgorithm;
};

export type FindAllNQueenOptions = FindAllOptions & {
  algorithm: SolverAlgorithm;
};

/**
 * Baseline safety check for classic solver paths.
 * Scans previously assigned rows to ensure no column/diagonal conflict.
 */
export function isSafePosition(queensByRow: number[], row: number, col: number) {
  for (let previousRow = 0; previousRow < row; previousRow += 1) {
    const placedCol = queensByRow[previousRow];

    if (placedCol === -1) {
      continue;
    }

    const sameColumn = placedCol === col;
    const sameDiagonal = Math.abs(previousRow - row) === Math.abs(placedCol - col);

    if (sameColumn || sameDiagonal) {
      return false;
    }
  }

  return true;
}

/**
 * Converts queens-by-row representation into board cell keys (`row:col`).
 */
export function queensByRowToKeys(queensByRow: number[]) {
  const keys: string[] = [];

  queensByRow.forEach((col, row) => {
    if (col >= 0) {
      keys.push(`${row}:${col}`);
    }
  });

  return keys;
}

/**
 * Produces a frame emitter shared by classic/optimized first-solution solvers.
 * It emits visualization frames and applies optional pacing delays.
 */
function createFrameEmitter(
  onFrame: ((frame: SolverFrame) => void) | undefined,
  waitForPacing: (() => Promise<void>) | undefined,
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
 * Classic recursive backtracking:
 * - row-by-row placement
 * - explicit safety scans
 * - constraint-compatible path
 */
async function solveClassicFirst({
  boardSize,
  searchStrategy = "left-to-right",
  constraints,
  onFrame,
  shouldStop,
  waitForPacing
}: Omit<SolveNQueenOptions, "algorithm">) {
  const queensByRow = Array.from({ length: boardSize }, () => -1);
  const stats: SolverStats = { step: 0, recursiveCalls: 0, backtracks: 0, solutionsFound: 0 };
  const emitFrame = createFrameEmitter(onFrame, waitForPacing, queensByRow, stats);
  const normalizedConstraints = normalizeConstraints(boardSize, constraints);
  const constraintValidation = validateConstraints(boardSize, normalizedConstraints);

  if (!constraintValidation.valid) {
    return {
      solved: false,
      queensByRow,
      recursiveCalls: 0,
      backtracks: 0,
      solutionsFound: 0,
      symmetry: createSymmetryStats(boardSize, false),
      pruning: createPruningStats(false, 0, 1, 1)
    };
  }

  async function backtrack(row: number): Promise<boolean> {
    stats.recursiveCalls += 1;

    if (shouldStop()) {
      return false;
    }

    if (row === boardSize) {
      stats.solutionsFound += 1;
      await emitFrame("solution-found", "valid", null, "Solution found.", boardSize);
      return true;
    }

    const fixedCol = normalizedConstraints.fixedQueensByRow[row];
    if (fixedCol >= 0) {
      const activeCell = { row, col: fixedCol };
      await emitFrame("trying-move", "trying", activeCell, `Trying fixed queen row ${row + 1}, column ${fixedCol + 1}.`, row + 1);
      if (!isSafePosition(queensByRow, row, fixedCol)) {
        await emitFrame("invalid-move", "invalid", activeCell, "Fixed queen conflicts with current path.", row + 1);
        return false;
      }
      queensByRow[row] = fixedCol;
      await emitFrame("queen-placed", "valid", activeCell, "Fixed queen placed.", row + 1);
      const solvedFixed = await backtrack(row + 1);
      if (solvedFixed) {
        return true;
      }
      queensByRow[row] = -1;
      stats.backtracks += 1;
      await emitFrame("backtracking", "backtracking", activeCell, "Backtracking from fixed queen.", row + 1);
      return false;
    }

    const disallowedMask = rowDisallowedMask(normalizedConstraints, row);
    const candidateColumns = Array.from({ length: boardSize }, (_, col) => col).filter((col) => (disallowedMask & (1 << col)) === 0);

    const columns = orderColumnsByStrategy(
      candidateColumns,
      boardSize,
      searchStrategy,
      (col) => {
        queensByRow[row] = col;
        let score = 0;

        if (row + 1 < boardSize) {
          for (let nextCol = 0; nextCol < boardSize; nextCol += 1) {
            if (isSafePosition(queensByRow, row + 1, nextCol)) {
              score += 1;
            }
          }
        }

        queensByRow[row] = -1;
        return score;
      }
    );

    for (const col of columns) {
      if (shouldStop()) {
        return false;
      }

      const activeCell = { row, col };
      await emitFrame("trying-move", "trying", activeCell, `Trying row ${row + 1}, column ${col + 1}.`, row + 1);

      if (!isSafePosition(queensByRow, row, col)) {
        await emitFrame("invalid-move", "invalid", activeCell, "Conflict found.", row + 1);
        continue;
      }

      queensByRow[row] = col;
      await emitFrame("queen-placed", "valid", activeCell, "Queen placed.", row + 1);

      const solved = await backtrack(row + 1);
      if (solved) {
        return true;
      }

      queensByRow[row] = -1;
      stats.backtracks += 1;
      await emitFrame("backtracking", "backtracking", activeCell, "Backtracking.", row + 1);
    }

    return false;
  }

  const solved = await backtrack(0);
  return {
    solved,
    queensByRow,
    recursiveCalls: stats.recursiveCalls,
    backtracks: stats.backtracks,
    solutionsFound: stats.solutionsFound,
    symmetry: createSymmetryStats(boardSize, false),
    pruning: createPruningStats(false, 0, 0, stats.recursiveCalls)
  };
}

/**
 * Optimized recursive backtracking:
 * - set-based occupancy checks (columns/diagonals/anti-diagonals)
 * - early dead-state pruning
 * - optional root symmetry reduction
 */
async function solveOptimizedFirst({
  boardSize,
  symmetryEnabled = false,
  searchStrategy = "left-to-right",
  constraints,
  onFrame,
  shouldStop,
  waitForPacing
}: Omit<SolveNQueenOptions, "algorithm">) {
  const queensByRow = Array.from({ length: boardSize }, () => -1);
  const stats: SolverStats = { step: 0, recursiveCalls: 0, backtracks: 0, solutionsFound: 0 };
  const emitFrame = createFrameEmitter(onFrame, waitForPacing, queensByRow, stats);
  const normalizedConstraints = normalizeConstraints(boardSize, constraints);
  const constraintValidation = validateConstraints(boardSize, normalizedConstraints);
  const symmetryAllowed = symmetryEnabled && !shouldDisableSymmetry(symmetryEnabled, normalizedConstraints);

  if (!constraintValidation.valid) {
    return {
      solved: false,
      queensByRow,
      recursiveCalls: 0,
      backtracks: 0,
      solutionsFound: 0,
      symmetry: createSymmetryStats(boardSize, false),
      pruning: createPruningStats(true, 0, 1, 1)
    };
  }

  const columns = new Set<number>();
  const diagonals = new Set<number>();
  const antiDiagonals = new Set<number>();
  let branchesPruned = 0;
  let deadStatesDetected = 0;

  async function backtrack(row: number): Promise<boolean> {
    stats.recursiveCalls += 1;

    if (shouldStop()) {
      return false;
    }

    if (row === boardSize) {
      stats.solutionsFound += 1;
      await emitFrame("solution-found", "valid", null, "Solution found.", boardSize);
      return true;
    }

    if (!hasRemainingColumnCapacitySets(boardSize, row, columns)) {
      branchesPruned += 1;
      deadStatesDetected += 1;
      await emitFrame("invalid-move", "invalid", null, "Pruned dead state: insufficient free columns.", row);
      return false;
    }

    if (!hasFutureFeasibleRowsSets(row, boardSize, columns, diagonals, antiDiagonals)) {
      branchesPruned += 1;
      deadStatesDetected += 1;
      await emitFrame("invalid-move", "invalid", null, "Pruned dead state: future rows blocked.", row);
      return false;
    }

    const disallowedMask = rowDisallowedMask(normalizedConstraints, row);

      if (row === 0) {
        const rootBranches = getRootBranches(boardSize, symmetryAllowed).filter((branch) => (disallowedMask & (1 << branch.col)) === 0);
        const orderedRootBranches = orderColumnsByStrategy(
          rootBranches.map((branch) => branch.col),
        boardSize,
        searchStrategy,
        (col) => {
          const diagonal = row - col;
          const antiDiagonal = row + col;
          let score = 0;

          columns.add(col);
          diagonals.add(diagonal);
          antiDiagonals.add(antiDiagonal);

          if (row + 1 < boardSize) {
            const nextRow = row + 1;
            for (let nextCol = 0; nextCol < boardSize; nextCol += 1) {
              const nextDiagonal = nextRow - nextCol;
              const nextAntiDiagonal = nextRow + nextCol;
              if (!columns.has(nextCol) && !diagonals.has(nextDiagonal) && !antiDiagonals.has(nextAntiDiagonal)) {
                score += 1;
              }
            }
          }

          columns.delete(col);
          diagonals.delete(diagonal);
          antiDiagonals.delete(antiDiagonal);
          return score;
        }
      );

      for (const col of orderedRootBranches) {
        if (shouldStop()) {
          return false;
        }

        const diagonal = row - col;
        const antiDiagonal = row + col;
        const activeCell = { row, col };
        await emitFrame("trying-move", "trying", activeCell, `Trying row ${row + 1}, column ${col + 1}.`, row + 1);

        if (columns.has(col) || diagonals.has(diagonal) || antiDiagonals.has(antiDiagonal)) {
          await emitFrame("invalid-move", "invalid", activeCell, "Conflict found.", row + 1);
          continue;
        }

        columns.add(col);
        diagonals.add(diagonal);
        antiDiagonals.add(antiDiagonal);
        queensByRow[row] = col;
        await emitFrame("queen-placed", "valid", activeCell, "Queen placed.", row + 1);

        const solved = await backtrack(row + 1);
        if (solved) {
          return true;
        }

        columns.delete(col);
        diagonals.delete(diagonal);
        antiDiagonals.delete(antiDiagonal);
        queensByRow[row] = -1;
        stats.backtracks += 1;
        await emitFrame("backtracking", "backtracking", activeCell, "Backtracking.", row + 1);
      }

      return false;
    }

      const columnsToTry = orderColumnsByStrategy(
        Array.from({ length: boardSize }, (_, col) => col).filter((col) => (disallowedMask & (1 << col)) === 0),
        boardSize,
        searchStrategy,
      (col) => {
        const diagonal = row - col;
        const antiDiagonal = row + col;

        if (columns.has(col) || diagonals.has(diagonal) || antiDiagonals.has(antiDiagonal)) {
          return -1;
        }

        columns.add(col);
        diagonals.add(diagonal);
        antiDiagonals.add(antiDiagonal);

        let score = 0;
        if (row + 1 < boardSize) {
          const nextRow = row + 1;
          for (let nextCol = 0; nextCol < boardSize; nextCol += 1) {
            const nextDiagonal = nextRow - nextCol;
            const nextAntiDiagonal = nextRow + nextCol;
            if (!columns.has(nextCol) && !diagonals.has(nextDiagonal) && !antiDiagonals.has(nextAntiDiagonal)) {
              score += 1;
            }
          }
        }

        columns.delete(col);
        diagonals.delete(diagonal);
        antiDiagonals.delete(antiDiagonal);
        return score;
      }
    );

    for (const col of columnsToTry) {
      if (shouldStop()) {
        return false;
      }

      const diagonal = row - col;
      const antiDiagonal = row + col;
      const activeCell = { row, col };
      await emitFrame("trying-move", "trying", activeCell, `Trying row ${row + 1}, column ${col + 1}.`, row + 1);

      if (columns.has(col) || diagonals.has(diagonal) || antiDiagonals.has(antiDiagonal)) {
        await emitFrame("invalid-move", "invalid", activeCell, "Conflict found.", row + 1);
        continue;
      }

      columns.add(col);
      diagonals.add(diagonal);
      antiDiagonals.add(antiDiagonal);
      queensByRow[row] = col;
      await emitFrame("queen-placed", "valid", activeCell, "Queen placed.", row + 1);

      const solved = await backtrack(row + 1);
      if (solved) {
        return true;
      }

      columns.delete(col);
      diagonals.delete(diagonal);
      antiDiagonals.delete(antiDiagonal);
      queensByRow[row] = -1;
      stats.backtracks += 1;
      await emitFrame("backtracking", "backtracking", activeCell, "Backtracking.", row + 1);
    }

    return false;
  }

  const solved = await backtrack(0);
  return {
    solved,
    queensByRow,
    recursiveCalls: stats.recursiveCalls,
    backtracks: stats.backtracks,
    solutionsFound: stats.solutionsFound,
    symmetry: createSymmetryStats(boardSize, symmetryAllowed),
    pruning: createPruningStats(true, branchesPruned, deadStatesDetected, stats.recursiveCalls)
  };
}

/**
 * Enumerates all solutions using classic safety checks.
 * Supports progress callbacks and optional count-only mode.
 */
async function findAllClassic({
  boardSize,
  searchStrategy = "left-to-right",
  constraints,
  shouldStop,
  maxStoredSolutions,
  countOnly = false,
  yieldEveryNodes = 500,
  onProgress
}: Omit<FindAllNQueenOptions, "algorithm">) {
  const queensByRow = Array.from({ length: boardSize }, () => -1);
  const normalizedConstraints = normalizeConstraints(boardSize, constraints);
  const constraintValidation = validateConstraints(boardSize, normalizedConstraints);
  const solutions: number[][] = [];
  let recursiveCalls = 0;
  let backtracks = 0;
  let solutionsFound = 0;
  let nodeCounter = 0;
  let capped = false;
  let branchesPruned = 0;
  let deadStatesDetected = 0;

  if (!constraintValidation.valid) {
    return {
      solutions,
      recursiveCalls: 0,
      backtracks: 0,
      solutionsFound: 0,
      capped: false,
      symmetry: createSymmetryStats(boardSize, false),
      pruning: createPruningStats(false, 0, 1, 1)
    };
  }

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

  async function dfs(row: number): Promise<void> {
    recursiveCalls += 1;

    if (shouldStop() || (capped && !countOnly)) {
      return;
    }

    if (row === boardSize) {
      solutionsFound += 1;
      if (!countOnly && solutions.length < maxStoredSolutions) {
        solutions.push([...queensByRow]);
      } else if (!countOnly) {
        capped = true;
      }
      emitProgress(null, null, boardSize);
      await maybeYield();
      return;
    }

    const fixedCol = normalizedConstraints.fixedQueensByRow[row];
    if (fixedCol >= 0) {
      emitProgress(row, fixedCol, row + 1);
      await maybeYield();

      if (!isSafePosition(queensByRow, row, fixedCol)) {
        branchesPruned += 1;
        deadStatesDetected += 1;
        return;
      }

      queensByRow[row] = fixedCol;
      emitProgress(row, fixedCol, row + 1);
      await dfs(row + 1);
      queensByRow[row] = -1;
      backtracks += 1;
      emitProgress(row, fixedCol, row + 1);
      await maybeYield();
      return;
    }

    const disallowedMask = rowDisallowedMask(normalizedConstraints, row);

    const columns = orderColumnsByStrategy(
      Array.from({ length: boardSize }, (_, col) => col).filter((col) => (disallowedMask & (1 << col)) === 0),
      boardSize,
      searchStrategy,
      (col) => {
        queensByRow[row] = col;
        let score = 0;

        if (row + 1 < boardSize) {
          for (let nextCol = 0; nextCol < boardSize; nextCol += 1) {
            if (isSafePosition(queensByRow, row + 1, nextCol)) {
              score += 1;
            }
          }
        }

        queensByRow[row] = -1;
        return score;
      }
    );

    for (const col of columns) {
      if (shouldStop() || (capped && !countOnly)) {
        return;
      }

      emitProgress(row, col, row + 1);
      await maybeYield();

      if (!isSafePosition(queensByRow, row, col)) {
        continue;
      }

      queensByRow[row] = col;
      emitProgress(row, col, row + 1);
      await dfs(row + 1);

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

  await dfs(0);
  return {
    solutions,
    recursiveCalls,
    backtracks,
    solutionsFound,
    capped,
    symmetry: createSymmetryStats(boardSize, false),
    pruning: createPruningStats(false, branchesPruned, deadStatesDetected, recursiveCalls)
  };
}

/**
 * Enumerates all solutions with optimized occupancy sets and optional symmetry.
 * Can mirror root branches to avoid redundant exploration.
 */
async function findAllOptimized({
  boardSize,
  symmetryEnabled = false,
  searchStrategy = "left-to-right",
  shouldStop,
  maxStoredSolutions,
  countOnly = false,
  yieldEveryNodes = 500,
  onProgress
}: Omit<FindAllNQueenOptions, "algorithm">) {
  const queensByRow = Array.from({ length: boardSize }, () => -1);
  const solutions: number[][] = [];
  let recursiveCalls = 0;
  let backtracks = 0;
  let solutionsFound = 0;
  let nodeCounter = 0;
  let capped = false;
  let branchesPruned = 0;
  let deadStatesDetected = 0;

  const columns = new Set<number>();
  const diagonals = new Set<number>();
  const antiDiagonals = new Set<number>();

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

  async function dfs(row: number): Promise<void> {
    recursiveCalls += 1;

    if (shouldStop() || (capped && !countOnly)) {
      return;
    }

    if (row === boardSize) {
      solutionsFound += 1;
      if (!countOnly && solutions.length < maxStoredSolutions) {
        solutions.push([...queensByRow]);
      } else if (!countOnly) {
        capped = true;
      }
      emitProgress(null, null, boardSize);
      await maybeYield();
      return;
    }

    if (!hasRemainingColumnCapacitySets(boardSize, row, columns)) {
      branchesPruned += 1;
      deadStatesDetected += 1;
      return;
    }

    if (!hasFutureFeasibleRowsSets(row, boardSize, columns, diagonals, antiDiagonals)) {
      branchesPruned += 1;
      deadStatesDetected += 1;
      return;
    }

    const columnsToTry = orderColumnsByStrategy(
      Array.from({ length: boardSize }, (_, col) => col),
      boardSize,
      searchStrategy,
      (col) => {
        const diagonal = row - col;
        const antiDiagonal = row + col;

        if (columns.has(col) || diagonals.has(diagonal) || antiDiagonals.has(antiDiagonal)) {
          return -1;
        }

        columns.add(col);
        diagonals.add(diagonal);
        antiDiagonals.add(antiDiagonal);

        let score = 0;
        if (row + 1 < boardSize) {
          const nextRow = row + 1;
          for (let nextCol = 0; nextCol < boardSize; nextCol += 1) {
            const nextDiagonal = nextRow - nextCol;
            const nextAntiDiagonal = nextRow + nextCol;
            if (!columns.has(nextCol) && !diagonals.has(nextDiagonal) && !antiDiagonals.has(nextAntiDiagonal)) {
              score += 1;
            }
          }
        }

        columns.delete(col);
        diagonals.delete(diagonal);
        antiDiagonals.delete(antiDiagonal);
        return score;
      }
    );

    for (const col of columnsToTry) {
      if (shouldStop() || (capped && !countOnly)) {
        return;
      }

      const diagonal = row - col;
      const antiDiagonal = row + col;
      emitProgress(row, col, row + 1);
      await maybeYield();

      if (columns.has(col) || diagonals.has(diagonal) || antiDiagonals.has(antiDiagonal)) {
        continue;
      }

      columns.add(col);
      diagonals.add(diagonal);
      antiDiagonals.add(antiDiagonal);
      queensByRow[row] = col;
      emitProgress(row, col, row + 1);
      await dfs(row + 1);

      if (shouldStop() || (capped && !countOnly)) {
        columns.delete(col);
        diagonals.delete(diagonal);
        antiDiagonals.delete(antiDiagonal);
        queensByRow[row] = -1;
        return;
      }

      columns.delete(col);
      diagonals.delete(diagonal);
      antiDiagonals.delete(antiDiagonal);
      queensByRow[row] = -1;
      backtracks += 1;
      emitProgress(row, col, row + 1);
      await maybeYield();
    }
  }

  async function dfsWithMirror(row: number, mirrorFactor: 1 | 2, shouldMirror: boolean): Promise<void> {
    recursiveCalls += 1;

    if (shouldStop() || (capped && !countOnly)) {
      return;
    }

    if (row === boardSize) {
      solutionsFound += mirrorFactor;
      if (!countOnly && solutions.length < maxStoredSolutions) {
        solutions.push([...queensByRow]);
      } else if (!countOnly) {
        capped = true;
      }

      if (!countOnly && !capped && shouldMirror && mirrorFactor === 2) {
        if (solutions.length < maxStoredSolutions) {
          solutions.push(mirrorSolution(queensByRow, boardSize));
        } else {
          capped = true;
        }
      }

      emitProgress(null, null, boardSize);
      await maybeYield();
      return;
    }

    if (!hasRemainingColumnCapacitySets(boardSize, row, columns)) {
      branchesPruned += 1;
      deadStatesDetected += 1;
      return;
    }

    if (!hasFutureFeasibleRowsSets(row, boardSize, columns, diagonals, antiDiagonals)) {
      branchesPruned += 1;
      deadStatesDetected += 1;
      return;
    }

    const columnsToTry = orderColumnsByStrategy(
      Array.from({ length: boardSize }, (_, col) => col),
      boardSize,
      searchStrategy,
      (col) => {
        const diagonal = row - col;
        const antiDiagonal = row + col;

        if (columns.has(col) || diagonals.has(diagonal) || antiDiagonals.has(antiDiagonal)) {
          return -1;
        }

        columns.add(col);
        diagonals.add(diagonal);
        antiDiagonals.add(antiDiagonal);

        let score = 0;
        if (row + 1 < boardSize) {
          const nextRow = row + 1;
          for (let nextCol = 0; nextCol < boardSize; nextCol += 1) {
            const nextDiagonal = nextRow - nextCol;
            const nextAntiDiagonal = nextRow + nextCol;
            if (!columns.has(nextCol) && !diagonals.has(nextDiagonal) && !antiDiagonals.has(nextAntiDiagonal)) {
              score += 1;
            }
          }
        }

        columns.delete(col);
        diagonals.delete(diagonal);
        antiDiagonals.delete(antiDiagonal);
        return score;
      }
    );

    for (const col of columnsToTry) {
      if (shouldStop() || (capped && !countOnly)) {
        return;
      }

      const diagonal = row - col;
      const antiDiagonal = row + col;
      emitProgress(row, col, row + 1);
      await maybeYield();

      if (columns.has(col) || diagonals.has(diagonal) || antiDiagonals.has(antiDiagonal)) {
        continue;
      }

      columns.add(col);
      diagonals.add(diagonal);
      antiDiagonals.add(antiDiagonal);
      queensByRow[row] = col;
      emitProgress(row, col, row + 1);
      await dfsWithMirror(row + 1, mirrorFactor, shouldMirror);

      if (shouldStop() || (capped && !countOnly)) {
        columns.delete(col);
        diagonals.delete(diagonal);
        antiDiagonals.delete(antiDiagonal);
        queensByRow[row] = -1;
        return;
      }

      columns.delete(col);
      diagonals.delete(diagonal);
      antiDiagonals.delete(antiDiagonal);
      queensByRow[row] = -1;
      backtracks += 1;
      emitProgress(row, col, row + 1);
      await maybeYield();
    }
  }

  if (!symmetryEnabled) {
    await dfs(0);
  } else {
    const rootBranches = getRootBranches(boardSize, true);
    const orderedRootBranches = orderColumnsByStrategy(
      rootBranches.map((branch) => branch.col),
      boardSize,
      searchStrategy,
      (col) => {
        const diagonal = -col;
        const antiDiagonal = col;
        let score = 0;

        columns.add(col);
        diagonals.add(diagonal);
        antiDiagonals.add(antiDiagonal);

        if (boardSize > 1) {
          const nextRow = 1;
          for (let nextCol = 0; nextCol < boardSize; nextCol += 1) {
            const nextDiagonal = nextRow - nextCol;
            const nextAntiDiagonal = nextRow + nextCol;
            if (!columns.has(nextCol) && !diagonals.has(nextDiagonal) && !antiDiagonals.has(nextAntiDiagonal)) {
              score += 1;
            }
          }
        }

        columns.delete(col);
        diagonals.delete(diagonal);
        antiDiagonals.delete(antiDiagonal);
        return score;
      }
    );

    for (const col of orderedRootBranches) {
      if (shouldStop() || (capped && !countOnly)) {
        break;
      }

      const row = 0;
      const branch = rootBranches.find((entry) => entry.col === col);
      if (!branch) {
        continue;
      }
      const diagonal = row - col;
      const antiDiagonal = row + col;
      emitProgress(row, col, row + 1);
      await maybeYield();

      columns.add(col);
      diagonals.add(diagonal);
      antiDiagonals.add(antiDiagonal);
      queensByRow[row] = col;
      emitProgress(row, col, row + 1);
      await dfsWithMirror(1, branch.mirrorFactor, !branch.isMiddle);

      columns.delete(col);
      diagonals.delete(diagonal);
      antiDiagonals.delete(antiDiagonal);
      queensByRow[row] = -1;
      backtracks += 1;
      emitProgress(row, col, row + 1);
      await maybeYield();
    }
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

/**
 * Dispatches first-solution solve to selected algorithm implementation.
 */
export async function solveNQueenBacktracking({ algorithm, ...rest }: SolveNQueenOptions) {
  if (algorithm === "bitmask") {
    return solveBitmaskFirst(rest);
  }
  if (algorithm === "optimized") {
    return solveOptimizedFirst(rest);
  }
  return solveClassicFirst(rest);
}

/**
 * Dispatches all-solutions solve to selected algorithm implementation.
 */
export async function findAllNQueenSolutions({ algorithm, ...rest }: FindAllNQueenOptions) {
  if (algorithm === "bitmask") {
    return findAllBitmask(rest);
  }
  if (algorithm === "optimized") {
    return findAllOptimized(rest);
  }
  return findAllClassic(rest);
}
