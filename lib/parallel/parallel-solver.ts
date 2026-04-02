import { ParallelWorkerPool } from "@/lib/parallel/worker-pool";
import type { SearchStrategy } from "@/types/chessboard";
import { createPruningStats } from "@/lib/solvers/pruning";
import { createSymmetryStats, getRootBranches, mirrorSolution } from "@/lib/solvers/symmetry";
import type { ParallelSolveTask, ParallelWorkerPoolProgress, ParallelWorkerResult } from "@/lib/parallel/types";
import type { PruningStats, SymmetryStats } from "@/lib/solvers/types";

type ParallelProgress = ParallelWorkerPoolProgress & {
  totalWorkers: number;
  recursiveCalls: number;
  backtracks: number;
  solutionsFound: number;
  latestRow: number | null;
  latestCol: number | null;
  searchDepth: number;
  storedSolutionsCount: number;
  capped: boolean;
};

type RunParallelOptions = {
  n: number;
  findAll: boolean;
  symmetryEnabled?: boolean;
  searchStrategy?: SearchStrategy;
  maxStoredSolutions: number;
  shouldStop: () => boolean;
  onLog?: (message: string) => void;
  onProgress?: (progress: ParallelProgress) => void;
};

function bitToCol(bit: number) {
  return Math.log2(bit) | 0;
}

function safeWorkerCount(taskCount: number) {
  const hardware = typeof navigator !== "undefined" ? navigator.hardwareConcurrency ?? 4 : 4;
  return Math.max(1, Math.min(Math.max(hardware - 2, 1), 16, taskCount));
}

function taskLabel(task: ParallelSolveTask) {
  const row0 = task.placements[0];
  const row1 = task.placements[1];
  if (typeof row1 === "number" && row1 >= 0) {
    return `row0-col${row0 + 1}, row1-col${row1 + 1}`;
  }
  return `row0-col${row0 + 1}`;
}

function generateParallelTasks(
  n: number,
  findAll: boolean,
  maxStoredSolutions: number,
  symmetryEnabled: boolean
): ParallelSolveTask[] {
  const fullMask = (1 << n) - 1;
  const tasks: ParallelSolveTask[] = [];
  const splitDepth = n >= 12 ? 2 : 1;
  let id = 0;
  const rootBranches = getRootBranches(n, symmetryEnabled);

  let row0Available = rootBranches.reduce((mask, branch) => mask | (1 << branch.col), 0) & fullMask;
  while (row0Available !== 0) {
    const row0Bit = row0Available & -row0Available;
    row0Available -= row0Bit;
    const row0Col = bitToCol(row0Bit);
    const rootBranch = rootBranches.find((branch) => branch.col === row0Col);

    if (!rootBranch) {
      continue;
    }

    const colsAfterRow0 = row0Bit;
    const diagAfterRow0 = (row0Bit << 1) & fullMask;
    const antiAfterRow0 = row0Bit >> 1;

    if (splitDepth === 1) {
      id += 1;
      tasks.push({
        id: `task-${id}`,
        n,
        startRow: 1,
        colsMask: colsAfterRow0,
        diagMask: diagAfterRow0,
        antiDiagMask: antiAfterRow0,
        placements: [row0Col, ...Array.from({ length: n - 1 }, () => -1)],
        mirrorFactor: rootBranch.mirrorFactor,
        mirrorStoredSolutions: !rootBranch.isMiddle,
        findAll,
        maxStoredSolutions
      });
      continue;
    }

    let row1Available = fullMask & ~(colsAfterRow0 | diagAfterRow0 | antiAfterRow0);
    while (row1Available !== 0) {
      const row1Bit = row1Available & -row1Available;
      row1Available -= row1Bit;
      const row1Col = bitToCol(row1Bit);

      id += 1;
      tasks.push({
        id: `task-${id}`,
        n,
        startRow: 2,
        colsMask: colsAfterRow0 | row1Bit,
        diagMask: ((diagAfterRow0 | row1Bit) << 1) & fullMask,
        antiDiagMask: (antiAfterRow0 | row1Bit) >> 1,
        placements: [row0Col, row1Col, ...Array.from({ length: n - 2 }, () => -1)],
        mirrorFactor: rootBranch.mirrorFactor,
        mirrorStoredSolutions: !rootBranch.isMiddle,
        findAll,
        maxStoredSolutions
      });
    }
  }

  return tasks;
}

export async function runParallelNQueenSolver({
  n,
  findAll,
  symmetryEnabled = false,
  searchStrategy = "left-to-right",
  maxStoredSolutions,
  shouldStop,
  onLog,
  onProgress
}: RunParallelOptions) {
  void searchStrategy;
  const tasks = generateParallelTasks(n, findAll, maxStoredSolutions, symmetryEnabled);
  const workerCount = safeWorkerCount(tasks.length);
  const pool = new ParallelWorkerPool(workerCount);

  let recursiveCalls = 0;
  let backtracks = 0;
  let solutionsFound = 0;
  let branchesPruned = 0;
  let deadStatesDetected = 0;
  let capped = false;
  let earlyFound = false;
  const storedSolutions: number[][] = [];
  const taskMeta = new Map(tasks.map((task) => [task.id, task]));
  const symmetry: SymmetryStats = createSymmetryStats(n, symmetryEnabled);
  let pruning: PruningStats = createPruningStats(true, 0, 0, 0);

  onLog?.(`Initializing worker pool with ${workerCount} workers.`);
  onLog?.(`Generating parallel tasks: ${tasks.length} branches.`);

  const report = (
    progress: ParallelWorkerPoolProgress,
    latestRow: number | null,
    latestCol: number | null,
    searchDepth: number
  ) => {
    onProgress?.({
      ...progress,
      totalWorkers: workerCount,
      recursiveCalls,
      backtracks,
      solutionsFound,
      latestRow,
      latestCol,
      searchDepth,
      storedSolutionsCount: storedSolutions.length,
      capped
    });
  };

  const results = await pool.run(tasks, {
    shouldStop: () => shouldStop() || earlyFound,
    onTaskStart: (task, workerId) => {
      onLog?.(`Worker ${workerId} solving branch ${taskLabel(task)}.`);
    },
    onTaskComplete: (result: ParallelWorkerResult) => {
      const metadata = taskMeta.get(result.taskId);
      const mirrorFactor = metadata?.mirrorFactor ?? 1;
      const shouldMirrorStored = metadata?.mirrorStoredSolutions ?? false;

      recursiveCalls += result.recursiveCalls;
      backtracks += result.backtracks;
      solutionsFound += result.solutionsFound * mirrorFactor;
      branchesPruned += result.branchesPruned;
      deadStatesDetected += result.deadStatesDetected;
      capped = capped || result.capped;
      pruning = createPruningStats(true, branchesPruned, deadStatesDetected, recursiveCalls);

      if (result.storedSolutions.length > 0 && storedSolutions.length < maxStoredSolutions) {
        for (const solution of result.storedSolutions) {
          if (storedSolutions.length >= maxStoredSolutions) {
            capped = true;
            break;
          }

          storedSolutions.push(solution);

          if (findAll && shouldMirrorStored && mirrorFactor === 2) {
            if (storedSolutions.length >= maxStoredSolutions) {
              capped = true;
              break;
            }
            storedSolutions.push(mirrorSolution(solution, n));
          }
        }
      }

      onLog?.(`Worker ${result.workerId} completed task (${result.solutionsFound} solutions).`);

      if (!findAll && result.solutionsFound > 0) {
        earlyFound = true;
        onLog?.(`Solution found in worker ${result.workerId}. Stopping remaining tasks.`);
      }
    },
    onProgress: (progress) => {
      report(progress, null, null, n);
    }
  });

  onLog?.("All workers completed.");

  if (!findAll && results.length > 0 && storedSolutions.length === 0) {
    const first = results.find((item) => item.storedSolutions.length > 0);
    if (first) {
      storedSolutions.push(first.storedSolutions[0]);
    }
  }

  return {
    workerCount,
    tasksTotal: tasks.length,
    recursiveCalls,
    backtracks,
    solutionsFound,
    solutions: storedSolutions,
    capped,
    symmetry,
    pruning
  };
}
