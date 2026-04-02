import type { SearchStrategy, SolverAlgorithm } from "@/types/chessboard";

export type BenchmarkMode = "first" | "all";

export type BenchmarkConfig = {
  boardSizes: number[];
  algorithms: SolverAlgorithm[];
  runs: number;
  mode: BenchmarkMode;
  symmetryEnabled: boolean;
  searchStrategy: SearchStrategy;
  splitDepthMode?: "auto" | "manual";
  manualSplitDepth?: 0 | 1 | 2;
};

export type BenchmarkRunMetrics = {
  elapsedMs: number;
  recursiveCalls: number;
  backtracks: number;
  branchesPruned: number;
  solutionsFound: number;
};

export type BenchmarkCaseResult = {
  boardSize: number;
  algorithm: SolverAlgorithm;
  mode: BenchmarkMode;
  runs: number;
  averageElapsedMs: number;
  bestElapsedMs: number;
  averageRecursiveCalls: number;
  averageBacktracks: number;
  averageBranchesPruned: number;
  averageSolutionsFound: number;
  firstRunElapsedMs: number;
  runMetrics: BenchmarkRunMetrics[];
};

export type BenchmarkProgress = {
  completedRuns: number;
  totalRuns: number;
  currentBoardSize: number;
  currentAlgorithm: SolverAlgorithm;
  currentRun: number;
};
