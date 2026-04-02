import { runParallelNQueenSolver } from "@/lib/parallel/parallel-solver";
import { findAllNQueenSolutions, solveNQueenBacktracking } from "@/lib/nqueen-solver";
import type { BenchmarkCaseResult, BenchmarkConfig, BenchmarkProgress, BenchmarkRunMetrics } from "@/lib/benchmark/types";

function average(values: number[]) {
  if (values.length === 0) {
    return 0;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function createStopError() {
  const error = new Error("Benchmark stopped");
  error.name = "BenchmarkStopped";
  return error;
}

/**
 * Executes one benchmark case (board size + algorithm + mode) and returns raw metrics.
 */
async function runSingleCase(
  config: BenchmarkConfig,
  boardSize: number,
  algorithm: BenchmarkConfig["algorithms"][number],
  shouldStop: () => boolean
): Promise<BenchmarkRunMetrics> {
  const startedAt = performance.now();

  if (algorithm === "parallel") {
    const parallelResult = await runParallelNQueenSolver({
      n: boardSize,
      findAll: config.mode === "all",
      symmetryEnabled: config.symmetryEnabled,
      searchStrategy: config.searchStrategy,
      splitDepthMode: config.splitDepthMode ?? "auto",
      manualSplitDepth: config.manualSplitDepth ?? 1,
      maxStoredSolutions: config.mode === "all" ? 0 : 1,
      shouldStop
    });

    return {
      elapsedMs: performance.now() - startedAt,
      recursiveCalls: parallelResult.recursiveCalls,
      backtracks: parallelResult.backtracks,
      branchesPruned: parallelResult.pruning.branchesPruned,
      solutionsFound: parallelResult.solutionsFound
    };
  }

  if (config.mode === "first") {
    const firstResult = await solveNQueenBacktracking({
      algorithm,
      boardSize,
      symmetryEnabled: config.symmetryEnabled,
      searchStrategy: config.searchStrategy,
      shouldStop,
      onFrame: undefined,
      waitForPacing: undefined
    });

    return {
      elapsedMs: performance.now() - startedAt,
      recursiveCalls: firstResult.recursiveCalls,
      backtracks: firstResult.backtracks,
      branchesPruned: firstResult.pruning.branchesPruned,
      solutionsFound: firstResult.solutionsFound
    };
  }

  const allResult = await findAllNQueenSolutions({
    algorithm,
    boardSize,
    symmetryEnabled: config.symmetryEnabled,
    searchStrategy: config.searchStrategy,
    shouldStop,
    maxStoredSolutions: 0,
    countOnly: true,
    yieldEveryNodes: boardSize >= 12 ? 250 : 500
  });

  return {
    elapsedMs: performance.now() - startedAt,
    recursiveCalls: allResult.recursiveCalls,
    backtracks: allResult.backtracks,
    branchesPruned: allResult.pruning.branchesPruned,
    solutionsFound: allResult.solutionsFound
  };
}

/**
 * Runs full benchmark matrix across selected board sizes/algorithms/runs.
 */
export async function runBenchmark(
  config: BenchmarkConfig,
  options?: {
    shouldStop?: () => boolean;
    onProgress?: (progress: BenchmarkProgress) => void;
  }
) {
  const shouldStop = options?.shouldStop ?? (() => false);
  const totalRuns = config.boardSizes.length * config.algorithms.length * config.runs;
  const results: BenchmarkCaseResult[] = [];
  let completedRuns = 0;

  for (const boardSize of config.boardSizes) {
    for (const algorithm of config.algorithms) {
      const runMetrics: BenchmarkRunMetrics[] = [];

      for (let run = 1; run <= config.runs; run += 1) {
        if (shouldStop()) {
          throw createStopError();
        }

        options?.onProgress?.({
          completedRuns,
          totalRuns,
          currentBoardSize: boardSize,
          currentAlgorithm: algorithm,
          currentRun: run
        });

        const metrics = await runSingleCase(config, boardSize, algorithm, shouldStop);
        runMetrics.push(metrics);
        completedRuns += 1;
      }

      results.push({
        boardSize,
        algorithm,
        mode: config.mode,
        runs: config.runs,
        averageElapsedMs: average(runMetrics.map((item) => item.elapsedMs)),
        bestElapsedMs: Math.min(...runMetrics.map((item) => item.elapsedMs)),
        averageRecursiveCalls: average(runMetrics.map((item) => item.recursiveCalls)),
        averageBacktracks: average(runMetrics.map((item) => item.backtracks)),
        averageBranchesPruned: average(runMetrics.map((item) => item.branchesPruned)),
        averageSolutionsFound: average(runMetrics.map((item) => item.solutionsFound)),
        firstRunElapsedMs: runMetrics[0]?.elapsedMs ?? 0,
        runMetrics
      });
    }
  }

  return results;
}
