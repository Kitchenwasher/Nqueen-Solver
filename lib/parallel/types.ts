export type ParallelSolveTask = {
  id: string;
  n: number;
  startRow: number;
  colsMask: number;
  diagMask: number;
  antiDiagMask: number;
  placements: number[];
  findAll: boolean;
  maxStoredSolutions: number;
};

export type ParallelSolveTaskResult = {
  taskId: string;
  recursiveCalls: number;
  backtracks: number;
  solutionsFound: number;
  storedSolutions: number[][];
  capped: boolean;
};

export type ParallelWorkerResult = ParallelSolveTaskResult & {
  workerId: number;
};

export type ParallelWorkerPoolProgress = {
  activeWorkers: number;
  tasksCompleted: number;
  tasksTotal: number;
  tasksRemaining: number;
};
