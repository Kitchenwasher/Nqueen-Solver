import type { SearchStrategy, SolverAlgorithm, SolvingObjective } from "@/types/chessboard";

export type SolverAnalytics = {
  algorithm: string;
  selectedAlgorithm: SolverAlgorithm;
  recursiveCalls: number;
  backtracks: number;
  solutionsFound: number;
  elapsedMs: number;
  currentRow: number | null;
  currentColumn: number | null;
  searchDepth: number;
  boardSize: number;
  solverStatus: string;
  searchStrategy: string;
  selectedSearchStrategy: SearchStrategy;
  solvingObjective: string;
  selectedSolvingObjective: SolvingObjective;
  timeToFirstSolutionMs: number | null;
  timeToAllSolutionsMs: number | null;
  firstSolutionPath: string | null;
  symmetry: {
    enabled: boolean;
    branchesSkipped: number;
    estimatedSearchReduction: number;
    effectiveSpeedup: number;
  };
  pruning: {
    branchesPruned: number;
    deadStatesDetected: number;
    estimatedWorkSaved: number;
  };
  constraints?: {
    totalCount: number;
    blockedCount: number;
    forbiddenCount: number;
    prePlacedCount: number;
    constrainedBranchesPruned: number;
    solvability: "unknown" | "solvable" | "unsolvable";
  };
  parallel?: {
    totalWorkers: number;
    activeWorkers: number;
    tasksCompleted: number;
    tasksRemaining: number;
    splitDepthUsed: number;
    taskCountGenerated: number;
    loadBalancingEffectiveness: number;
  };
};

export type AlgorithmRunSummary = {
  elapsedMs: number;
  recursiveCalls: number;
  backtracks: number;
  solutionsFound: number;
  boardSize: number;
  symmetryEnabled: boolean;
};

export type AlgorithmPerformanceMap = Partial<Record<SolverAlgorithm, AlgorithmRunSummary>>;

export type StrategyRunSummary = {
  boardSize: number;
  firstSolutionElapsedMs?: number;
  allSolutionsElapsedMs?: number;
};

export type StrategyPerformanceMap = Partial<
  Record<SolverAlgorithm, Partial<Record<SearchStrategy, StrategyRunSummary>>>
>;
