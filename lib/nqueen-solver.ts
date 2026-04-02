import type { CellCoordinate, SolverAlgorithm, SolverMoveState } from "@/types/chessboard";

export type SolverEventType =
  | "trying-move"
  | "invalid-move"
  | "queen-placed"
  | "backtracking"
  | "solution-found"
  | "worker-update";

export type SolverFrame = {
  eventType: SolverEventType;
  moveState: SolverMoveState;
  activeCell: CellCoordinate | null;
  queensByRow: number[];
  step: number;
  message: string;
  recursiveCalls: number;
  backtracks: number;
  solutionsFound: number;
  searchDepth: number;
};

export type SolveNQueenOptions = {
  algorithm: SolverAlgorithm;
  boardSize: number;
  onFrame: (frame: SolverFrame) => void;
  shouldStop: () => boolean;
  waitForPacing: () => Promise<void>;
};

export type FindAllNQueenOptions = {
  algorithm: SolverAlgorithm;
  boardSize: number;
  shouldStop: () => boolean;
  maxStoredSolutions: number;
  yieldEveryNodes?: number;
  onProgress?: (progress: {
    recursiveCalls: number;
    backtracks: number;
    solutionsFound: number;
    latestRow: number | null;
    latestCol: number | null;
    searchDepth: number;
    storedSolutionsCount: number;
    capped: boolean;
  }) => void;
};

type SolverStats = {
  step: number;
  recursiveCalls: number;
  backtracks: number;
  solutionsFound: number;
};

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

export function queensByRowToKeys(queensByRow: number[]) {
  const keys: string[] = [];

  queensByRow.forEach((col, row) => {
    if (col >= 0) {
      keys.push(`${row}:${col}`);
    }
  });

  return keys;
}

function createFrameEmitter(
  onFrame: (frame: SolverFrame) => void,
  waitForPacing: () => Promise<void>,
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
    await waitForPacing();
  };
}

async function solveClassicFirst({
  boardSize,
  onFrame,
  shouldStop,
  waitForPacing
}: Omit<SolveNQueenOptions, "algorithm">) {
  const queensByRow = Array.from({ length: boardSize }, () => -1);
  const stats: SolverStats = { step: 0, recursiveCalls: 0, backtracks: 0, solutionsFound: 0 };
  const emitFrame = createFrameEmitter(onFrame, waitForPacing, queensByRow, stats);

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

    for (let col = 0; col < boardSize; col += 1) {
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
    solutionsFound: stats.solutionsFound
  };
}

async function solveOptimizedFirst({
  boardSize,
  onFrame,
  shouldStop,
  waitForPacing
}: Omit<SolveNQueenOptions, "algorithm">) {
  const queensByRow = Array.from({ length: boardSize }, () => -1);
  const stats: SolverStats = { step: 0, recursiveCalls: 0, backtracks: 0, solutionsFound: 0 };
  const emitFrame = createFrameEmitter(onFrame, waitForPacing, queensByRow, stats);

  const columns = new Set<number>();
  const diagonals = new Set<number>();
  const antiDiagonals = new Set<number>();

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

    for (let col = 0; col < boardSize; col += 1) {
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
    solutionsFound: stats.solutionsFound
  };
}

async function findAllClassic({
  boardSize,
  shouldStop,
  maxStoredSolutions,
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

    if (shouldStop() || capped) {
      return;
    }

    if (row === boardSize) {
      solutionsFound += 1;
      if (solutions.length < maxStoredSolutions) {
        solutions.push([...queensByRow]);
      } else {
        capped = true;
      }
      emitProgress(null, null, boardSize);
      await maybeYield();
      return;
    }

    for (let col = 0; col < boardSize; col += 1) {
      if (shouldStop() || capped) {
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

      if (shouldStop() || capped) {
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
  return { solutions, recursiveCalls, backtracks, solutionsFound, capped };
}

async function findAllOptimized({
  boardSize,
  shouldStop,
  maxStoredSolutions,
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

    if (shouldStop() || capped) {
      return;
    }

    if (row === boardSize) {
      solutionsFound += 1;
      if (solutions.length < maxStoredSolutions) {
        solutions.push([...queensByRow]);
      } else {
        capped = true;
      }
      emitProgress(null, null, boardSize);
      await maybeYield();
      return;
    }

    for (let col = 0; col < boardSize; col += 1) {
      if (shouldStop() || capped) {
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

      if (shouldStop() || capped) {
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

  await dfs(0);
  return { solutions, recursiveCalls, backtracks, solutionsFound, capped };
}

export async function solveNQueenBacktracking({ algorithm, ...rest }: SolveNQueenOptions) {
  if (algorithm === "optimized") {
    return solveOptimizedFirst(rest);
  }
  return solveClassicFirst(rest);
}

export async function findAllNQueenSolutions({ algorithm, ...rest }: FindAllNQueenOptions) {
  if (algorithm === "optimized") {
    return findAllOptimized(rest);
  }
  return findAllClassic(rest);
}
