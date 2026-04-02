import type { SolverAlgorithm } from "@/types/chessboard";

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
  parallel?: {
    totalWorkers: number;
    activeWorkers: number;
    tasksCompleted: number;
    tasksRemaining: number;
  };
};

export type AlgorithmRunSummary = {
  elapsedMs: number;
  recursiveCalls: number;
  backtracks: number;
  solutionsFound: number;
  boardSize: number;
};

export type AlgorithmPerformanceMap = Partial<Record<SolverAlgorithm, AlgorithmRunSummary>>;
