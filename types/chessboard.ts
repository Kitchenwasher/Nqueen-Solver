export const SUPPORTED_BOARD_SIZES = [4, 6, 8, 10, 12, 16] as const;

export type BoardSize = (typeof SUPPORTED_BOARD_SIZES)[number];

export type CellCoordinate = {
  row: number;
  col: number;
};

export type CellVisualState =
  | "empty"
  | "queen"
  | "attacked"
  | "conflicting"
  | "trying"
  | "invalid"
  | "backtracking";

export type BoardValidationStatus = "valid" | "invalid" | "in-progress";

export type SolverMoveState = "trying" | "valid" | "invalid" | "backtracking" | null;

export type SolverMode = "auto" | "step";

export type SolverAlgorithm = "classic" | "optimized" | "parallel";
