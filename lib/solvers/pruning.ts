import { countSetBits } from "@/lib/solvers/branch-ordering";
import type { PruningStats } from "@/lib/solvers/types";

/**
 * Produces pruning analytics object from raw counters.
 */
export function createPruningStats(active: boolean, branchesPruned: number, deadStatesDetected: number, recursiveCalls: number): PruningStats {
  const total = recursiveCalls + branchesPruned;
  const estimatedWorkSaved = total > 0 ? branchesPruned / total : 0;

  return {
    active,
    branchesPruned,
    deadStatesDetected,
    estimatedWorkSaved
  };
}

/**
 * Fast feasibility check for future rows using bitmask occupancy.
 * If any future row has zero candidates, this branch is unsalvageable.
 */
export function hasFutureFeasibleRowsBitmask(
  row: number,
  boardSize: number,
  fullMask: number,
  columnsMask: number,
  diagonalMask: number,
  antiDiagonalMask: number
) {
  let diagonals = diagonalMask;
  let antiDiagonals = antiDiagonalMask;

  for (let futureRow = row; futureRow < boardSize; futureRow += 1) {
    const available = fullMask & ~(columnsMask | diagonals | antiDiagonals);
    if (available === 0) {
      return false;
    }

    diagonals = (diagonals << 1) & fullMask;
    antiDiagonals >>>= 1;
  }

  return true;
}

/**
 * Ensures remaining free columns can still cover remaining rows.
 */
export function hasRemainingColumnCapacityBitmask(boardSize: number, row: number, columnsMask: number, fullMask: number) {
  const remainingRows = boardSize - row;
  const freeColumns = countSetBits(fullMask & ~columnsMask);
  return freeColumns >= remainingRows;
}

/**
 * Set-based equivalent of future-feasibility pruning check.
 */
export function hasFutureFeasibleRowsSets(
  row: number,
  boardSize: number,
  columns: Set<number>,
  diagonals: Set<number>,
  antiDiagonals: Set<number>
) {
  for (let futureRow = row; futureRow < boardSize; futureRow += 1) {
    let hasCandidate = false;

    for (let col = 0; col < boardSize; col += 1) {
      if (columns.has(col)) {
        continue;
      }

      const diagonal = futureRow - col;
      const antiDiagonal = futureRow + col;
      if (!diagonals.has(diagonal) && !antiDiagonals.has(antiDiagonal)) {
        hasCandidate = true;
        break;
      }
    }

    if (!hasCandidate) {
      return false;
    }
  }

  return true;
}

/**
 * Set-based equivalent of remaining-column-capacity check.
 */
export function hasRemainingColumnCapacitySets(boardSize: number, row: number, columns: Set<number>) {
  const remainingRows = boardSize - row;
  const freeColumns = boardSize - columns.size;
  return freeColumns >= remainingRows;
}
