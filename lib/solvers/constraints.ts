import { getCellKey, parseCellKey } from "@/lib/chessboard";

export type SolverConstraints = {
  blockedCells?: string[];
  forbiddenCells?: string[];
  prePlacedQueens?: string[];
};

export type NormalizedConstraints = {
  blockedByRow: number[];
  forbiddenByRow: number[];
  fixedQueensByRow: number[];
  hasConstraints: boolean;
  constraintCount: number;
};

/**
 * Creates an empty constraint model for given board size.
 */
export function createEmptyConstraints(boardSize: number): NormalizedConstraints {
  return {
    blockedByRow: Array.from({ length: boardSize }, () => 0),
    forbiddenByRow: Array.from({ length: boardSize }, () => 0),
    fixedQueensByRow: Array.from({ length: boardSize }, () => -1),
    hasConstraints: false,
    constraintCount: 0
  };
}

/**
 * Normalizes sparse UI constraint arrays into row-indexed bitmasks.
 * This format is fast for solver checks and supports validation.
 */
export function normalizeConstraints(boardSize: number, constraints?: SolverConstraints): NormalizedConstraints {
  if (!constraints) {
    return createEmptyConstraints(boardSize);
  }

  const blockedByRow = Array.from({ length: boardSize }, () => 0);
  const forbiddenByRow = Array.from({ length: boardSize }, () => 0);
  const fixedQueensByRow = Array.from({ length: boardSize }, () => -1);

  const blocked = constraints.blockedCells ?? [];
  const forbidden = constraints.forbiddenCells ?? [];
  const prePlaced = constraints.prePlacedQueens ?? [];

  blocked.forEach((key) => {
    const { row, col } = parseCellKey(key);
    if (row >= 0 && row < boardSize && col >= 0 && col < boardSize) {
      blockedByRow[row] |= 1 << col;
    }
  });

  forbidden.forEach((key) => {
    const { row, col } = parseCellKey(key);
    if (row >= 0 && row < boardSize && col >= 0 && col < boardSize) {
      forbiddenByRow[row] |= 1 << col;
    }
  });

  prePlaced.forEach((key) => {
    const { row, col } = parseCellKey(key);
    if (row >= 0 && row < boardSize && col >= 0 && col < boardSize) {
      fixedQueensByRow[row] = col;
    }
  });

  const constraintCount = blocked.length + forbidden.length + prePlaced.length;

  return {
    blockedByRow,
    forbiddenByRow,
    fixedQueensByRow,
    hasConstraints: constraintCount > 0,
    constraintCount
  };
}

/**
 * Combined blocked+forbidden mask for a specific row.
 */
export function rowDisallowedMask(constraints: NormalizedConstraints, row: number) {
  return (constraints.blockedByRow[row] ?? 0) | (constraints.forbiddenByRow[row] ?? 0);
}

/**
 * True when a row/column is blocked by either blocked or forbidden constraints.
 */
export function isCellDisallowed(constraints: NormalizedConstraints, row: number, col: number) {
  const mask = rowDisallowedMask(constraints, row);
  return (mask & (1 << col)) !== 0;
}

/**
 * Validates pre-placed queens:
 * - must not be on disallowed cells
 * - must not conflict with each other
 */
export function validateConstraints(boardSize: number, constraints: NormalizedConstraints) {
  const columns = new Set<number>();
  const diagonals = new Set<number>();
  const antiDiagonals = new Set<number>();

  for (let row = 0; row < boardSize; row += 1) {
    const col = constraints.fixedQueensByRow[row];
    if (col < 0) {
      continue;
    }

    if (isCellDisallowed(constraints, row, col)) {
      return {
        valid: false,
        reason: `Pre-placed queen at ${getCellKey(row, col)} is in blocked/forbidden cell.`
      };
    }

    if (columns.has(col) || diagonals.has(row - col) || antiDiagonals.has(row + col)) {
      return {
        valid: false,
        reason: `Pre-placed queens are conflicting at row ${row + 1}.`
      };
    }

    columns.add(col);
    diagonals.add(row - col);
    antiDiagonals.add(row + col);
  }

  return { valid: true, reason: null as string | null };
}

/**
 * Symmetry optimization is disabled whenever constraints are present
 * because mirrored branches are no longer guaranteed equivalent.
 */
export function shouldDisableSymmetry(baseEnabled: boolean, constraints: NormalizedConstraints) {
  if (!baseEnabled) {
    return true;
  }
  return constraints.hasConstraints;
}
