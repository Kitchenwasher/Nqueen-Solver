import type { CellCoordinate } from "@/types/chessboard";
import type { BoardValidationStatus } from "@/types/chessboard";

export function getCellKey(row: number, col: number) {
  return `${row}:${col}`;
}

export function parseCellKey(cellKey: string): CellCoordinate {
  const [row, col] = cellKey.split(":").map(Number);
  return { row, col };
}

export function placementsToKeys(placements: CellCoordinate[]) {
  return placements.map((placement) => getCellKey(placement.row, placement.col));
}

export function getAttackedCells(queenKeys: Set<string>, boardSize: number) {
  const attacked = new Set<string>();

  for (const queenKey of queenKeys) {
    const { row, col } = parseCellKey(queenKey);

    for (let currentCol = 0; currentCol < boardSize; currentCol += 1) {
      if (currentCol !== col) {
        attacked.add(getCellKey(row, currentCol));
      }
    }

    for (let currentRow = 0; currentRow < boardSize; currentRow += 1) {
      if (currentRow !== row) {
        attacked.add(getCellKey(currentRow, col));
      }
    }

    for (let delta = 1; delta < boardSize; delta += 1) {
      const forwardDown = row + delta;
      const forwardUp = row - delta;
      const right = col + delta;
      const left = col - delta;

      if (forwardDown < boardSize && right < boardSize) {
        attacked.add(getCellKey(forwardDown, right));
      }
      if (forwardDown < boardSize && left >= 0) {
        attacked.add(getCellKey(forwardDown, left));
      }
      if (forwardUp >= 0 && right < boardSize) {
        attacked.add(getCellKey(forwardUp, right));
      }
      if (forwardUp >= 0 && left >= 0) {
        attacked.add(getCellKey(forwardUp, left));
      }
    }
  }

  return attacked;
}

export function getConflictingQueens(queenKeys: Set<string>) {
  const conflicting = new Set<string>();
  const queens = Array.from(queenKeys).map(parseCellKey);

  for (let i = 0; i < queens.length; i += 1) {
    for (let j = i + 1; j < queens.length; j += 1) {
      const first = queens[i];
      const second = queens[j];
      const sameRow = first.row === second.row;
      const sameColumn = first.col === second.col;
      const sameDiagonal = Math.abs(first.row - second.row) === Math.abs(first.col - second.col);

      if (sameRow || sameColumn || sameDiagonal) {
        conflicting.add(getCellKey(first.row, first.col));
        conflicting.add(getCellKey(second.row, second.col));
      }
    }
  }

  return conflicting;
}

export type BoardValidation = {
  status: BoardValidationStatus;
  message: string;
};

export function getBoardValidation(boardSize: number, queenKeys: Set<string>, conflictingQueens: Set<string>): BoardValidation {
  if (conflictingQueens.size > 0) {
    return {
      status: "invalid",
      message: "Conflicts detected. Two or more queens are attacking each other."
    };
  }

  if (queenKeys.size === boardSize) {
    return {
      status: "valid",
      message: "Board is valid. Every row can contain one non-attacking queen."
    };
  }

  return {
    status: "in-progress",
    message: "Placement is in progress. Add queens until the board is fully populated."
  };
}
