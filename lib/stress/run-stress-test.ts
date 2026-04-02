import { solveNQueenBacktracking, findAllNQueenSolutions } from "@/lib/nqueen-solver";
import { runParallelNQueenSolver } from "@/lib/parallel/parallel-solver";
import type { StressProgress, StressStepResult, StressTestConfig, StressTestResult } from "@/lib/stress/types";

function createStopError() {
  const error = new Error("Stress test stopped");
  error.name = "StressTestStopped";
  return error;
}

/**
 * Executes a time-bounded board-size sweep and reports stress-performance aggregates.
 */
export async function runStressTest(
  config: StressTestConfig,
  options?: {
    shouldStop?: () => boolean;
    onProgress?: (progress: StressProgress) => void;
  }
): Promise<StressTestResult> {
  const startedAt = performance.now();
  const deadline = startedAt + Math.max(config.timeLimitMs, 250);
  const shouldStopFromCaller = options?.shouldStop ?? (() => false);

  let totalNodesExplored = 0;
  let totalSolutionsFound = 0;
  let peakWorkerUsage = 0;
  let maxSolvedN: number | null = null;
  let reachedTimeLimit = false;
  const steps: StressStepResult[] = [];

  for (let n = config.minBoardSize; n <= config.maxBoardSize; n += 1) {
    if (shouldStopFromCaller()) {
      throw createStopError();
    }

    let timedOutInStep = false;
    const shouldStop = () => {
      if (shouldStopFromCaller()) {
        return true;
      }
      const timeoutReached = performance.now() >= deadline;
      if (timeoutReached) {
        timedOutInStep = true;
      }
      return timeoutReached;
    };

    let recursiveCalls = 0;
    let backtracks = 0;
    let solutionsFound = 0;
    let branchesPruned = 0;
    let workersUsed = 0;
    let peakActiveWorkers = 0;
    let solved = false;
    const stepStart = performance.now();

    if (config.algorithm === "parallel") {
      const parallelResult = await runParallelNQueenSolver({
        n,
        findAll: config.solveTarget === "all",
        symmetryEnabled: config.symmetryEnabled,
        searchStrategy: config.searchStrategy,
        splitDepthMode: config.splitDepthMode ?? "auto",
        manualSplitDepth: config.manualSplitDepth ?? 1,
        preferredWorkerCount: config.parallelWorkerCount,
        maxStoredSolutions: config.solveTarget === "all" ? 0 : 1,
        shouldStop,
        onProgress: (progress) => {
          peakActiveWorkers = Math.max(peakActiveWorkers, progress.activeWorkers);
          peakWorkerUsage = Math.max(peakWorkerUsage, progress.activeWorkers);
        }
      });

      recursiveCalls = parallelResult.recursiveCalls;
      backtracks = parallelResult.backtracks;
      solutionsFound = parallelResult.solutionsFound;
      branchesPruned = parallelResult.pruning.branchesPruned;
      workersUsed = parallelResult.workerCount;
      solved =
        config.solveTarget === "first"
          ? parallelResult.solutionsFound > 0 && !timedOutInStep
          : !timedOutInStep && parallelResult.solutionsFound > 0;
    } else if (config.solveTarget === "first") {
      const first = await solveNQueenBacktracking({
        algorithm: config.algorithm,
        boardSize: n,
        symmetryEnabled: config.symmetryEnabled,
        searchStrategy: config.searchStrategy,
        shouldStop,
        onFrame: undefined,
        waitForPacing: undefined
      });

      recursiveCalls = first.recursiveCalls;
      backtracks = first.backtracks;
      solutionsFound = first.solutionsFound;
      branchesPruned = first.pruning.branchesPruned;
      solved = first.solved && !timedOutInStep;
    } else {
      const all = await findAllNQueenSolutions({
        algorithm: config.algorithm,
        boardSize: n,
        symmetryEnabled: config.symmetryEnabled,
        searchStrategy: config.searchStrategy,
        shouldStop,
        maxStoredSolutions: 0,
        countOnly: true,
        yieldEveryNodes: n >= 12 ? 250 : 500
      });

      recursiveCalls = all.recursiveCalls;
      backtracks = all.backtracks;
      solutionsFound = all.solutionsFound;
      branchesPruned = all.pruning.branchesPruned;
      solved = !timedOutInStep && all.solutionsFound > 0;
    }

    const stepElapsed = performance.now() - stepStart;
    const stepResult: StressStepResult = {
      boardSize: n,
      solved,
      timedOut: timedOutInStep,
      elapsedMs: stepElapsed,
      recursiveCalls,
      backtracks,
      solutionsFound,
      branchesPruned,
      workersUsed,
      peakActiveWorkers
    };
    steps.push(stepResult);

    totalNodesExplored += recursiveCalls;
    totalSolutionsFound += solutionsFound;

    if (solved) {
      maxSolvedN = n;
    }

    const elapsed = performance.now() - startedAt;
    const remaining = Math.max(deadline - performance.now(), 0);
    options?.onProgress?.({
      currentBoardSize: n,
      elapsedMs: elapsed,
      remainingMs: remaining,
      totalNodesExplored,
      totalSolutionsFound,
      peakWorkerUsage
    });

    if (performance.now() >= deadline || timedOutInStep) {
      reachedTimeLimit = true;
      break;
    }
  }

  const totalElapsedMs = performance.now() - startedAt;
  const totalSeconds = Math.max(totalElapsedMs / 1000, 0.001);

  return {
    maxSolvedN,
    totalNodesExplored,
    totalElapsedMs,
    peakWorkerUsage,
    totalSolutionsFound,
    averageNodesPerSecond: totalNodesExplored / totalSeconds,
    averageMsPerBoard: steps.length > 0 ? totalElapsedMs / steps.length : 0,
    steps,
    reachedTimeLimit
  };
}
