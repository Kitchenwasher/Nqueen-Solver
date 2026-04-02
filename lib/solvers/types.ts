import type { CellCoordinate, SearchStrategy, SolverMoveState } from "@/types/chessboard";

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

export type SolverStats = {
  step: number;
  recursiveCalls: number;
  backtracks: number;
  solutionsFound: number;
};

export type SolveFirstOptions = {
  boardSize: number;
  symmetryEnabled?: boolean;
  searchStrategy?: SearchStrategy;
  onFrame: (frame: SolverFrame) => void;
  shouldStop: () => boolean;
  waitForPacing: () => Promise<void>;
};

export type SymmetryStats = {
  active: boolean;
  rootBranchesTotal: number;
  rootBranchesExplored: number;
  branchesSkipped: number;
  estimatedSearchReduction: number;
  effectiveSpeedup: number;
};

export type PruningStats = {
  active: boolean;
  branchesPruned: number;
  deadStatesDetected: number;
  estimatedWorkSaved: number;
};

export type SolveFirstResult = {
  solved: boolean;
  queensByRow: number[];
  recursiveCalls: number;
  backtracks: number;
  solutionsFound: number;
  symmetry: SymmetryStats;
  pruning: PruningStats;
};

export type FindAllProgress = {
  recursiveCalls: number;
  backtracks: number;
  solutionsFound: number;
  latestRow: number | null;
  latestCol: number | null;
  searchDepth: number;
  storedSolutionsCount: number;
  capped: boolean;
};

export type FindAllOptions = {
  boardSize: number;
  symmetryEnabled?: boolean;
  searchStrategy?: SearchStrategy;
  shouldStop: () => boolean;
  maxStoredSolutions: number;
  yieldEveryNodes?: number;
  onProgress?: (progress: FindAllProgress) => void;
};

export type FindAllResult = {
  solutions: number[][];
  recursiveCalls: number;
  backtracks: number;
  solutionsFound: number;
  capped: boolean;
  symmetry: SymmetryStats;
  pruning: PruningStats;
};
