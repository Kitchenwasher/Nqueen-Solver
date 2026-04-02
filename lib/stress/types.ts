import type { SearchStrategy, SolverAlgorithm } from "@/types/chessboard";

export type StressSolveTarget = "first" | "all";

export type StressTestConfig = {
  algorithm: SolverAlgorithm;
  minBoardSize: number;
  maxBoardSize: number;
  solveTarget: StressSolveTarget;
  timeLimitMs: number;
  symmetryEnabled: boolean;
  searchStrategy: SearchStrategy;
  splitDepthMode?: "auto" | "manual";
  manualSplitDepth?: 0 | 1 | 2;
  parallelWorkerCount?: number;
};

export type StressStepResult = {
  boardSize: number;
  solved: boolean;
  timedOut: boolean;
  elapsedMs: number;
  recursiveCalls: number;
  backtracks: number;
  solutionsFound: number;
  branchesPruned: number;
  workersUsed: number;
  peakActiveWorkers: number;
};

export type StressTestResult = {
  maxSolvedN: number | null;
  totalNodesExplored: number;
  totalElapsedMs: number;
  peakWorkerUsage: number;
  totalSolutionsFound: number;
  averageNodesPerSecond: number;
  averageMsPerBoard: number;
  steps: StressStepResult[];
  reachedTimeLimit: boolean;
};

export type StressProgress = {
  currentBoardSize: number;
  elapsedMs: number;
  remainingMs: number;
  totalNodesExplored: number;
  totalSolutionsFound: number;
  peakWorkerUsage: number;
};
