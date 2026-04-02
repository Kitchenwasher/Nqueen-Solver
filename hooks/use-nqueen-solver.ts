"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from "react";

import { runParallelNQueenSolver } from "@/lib/parallel/parallel-solver";
import { getSearchStrategyLabel } from "@/lib/solvers/branch-ordering";
import { createPruningStats } from "@/lib/solvers/pruning";
import { createSymmetryStats } from "@/lib/solvers/symmetry";
import type { PruningStats, SymmetryStats } from "@/lib/solvers/types";
import {
  findAllNQueenSolutions,
  queensByRowToKeys,
  solveNQueenBacktracking,
  type SolverEventType
} from "@/lib/nqueen-solver";
import type { BoardSize, CellCoordinate, SearchStrategy, SolverAlgorithm, SolverMode, SolverMoveState } from "@/types/chessboard";
import type {
  AlgorithmPerformanceMap,
  AlgorithmRunSummary,
  SolverAnalytics,
  StrategyPerformanceMap
} from "@/types/dashboard";

export type SolverPhase = "idle" | "solving" | "paused" | "stepping" | "enumerating" | "solved" | "failed";
export type ParallelSplitDepthMode = "auto" | "manual";

export type SolverLogEntry = {
  id: string;
  step: number;
  eventType: SolverEventType;
  message: string;
  row: number | null;
  col: number | null;
};

type UseNQueenSolverOptions = {
  boardSize: BoardSize;
  setQueenCells: Dispatch<SetStateAction<string[]>>;
  setActiveCell: Dispatch<SetStateAction<CellCoordinate | null>>;
};

const DEFAULT_SPEED_MS = 130;
const MAX_LOGS = 200;
const DEFAULT_SYMMETRY_STATS: SymmetryStats = {
  active: false,
  rootBranchesTotal: 0,
  rootBranchesExplored: 0,
  branchesSkipped: 0,
  estimatedSearchReduction: 0,
  effectiveSpeedup: 1
};
const DEFAULT_PRUNING_STATS: PruningStats = {
  active: false,
  branchesPruned: 0,
  deadStatesDetected: 0,
  estimatedWorkSaved: 0
};

function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

function getStorageCap(boardSize: number) {
  if (boardSize >= 16) {
    return 4000;
  }
  if (boardSize >= 12) {
    return 20000;
  }
  return 100000;
}

function getAlgorithmLabel(algorithm: SolverAlgorithm) {
  if (algorithm === "bitmask") {
    return "Bitmask Solver";
  }
  if (algorithm === "optimized") {
    return "Optimized Solver";
  }
  if (algorithm === "parallel") {
    return "Parallel Solver";
  }
  return "Classic Backtracking";
}

export function useNQueenSolver({ boardSize, setQueenCells, setActiveCell }: UseNQueenSolverOptions) {
  const [phase, setPhase] = useState<SolverPhase>("idle");
  const [algorithm, setAlgorithm] = useState<SolverAlgorithm>("classic");
  const [mode, setMode] = useState<SolverMode>("auto");
  const [speedMs, setSpeedMs] = useState(DEFAULT_SPEED_MS);
  const [symmetryEnabled, setSymmetryEnabled] = useState(true);
  const [searchStrategy, setSearchStrategy] = useState<SearchStrategy>("left-to-right");
  const [splitDepthMode, setSplitDepthMode] = useState<ParallelSplitDepthMode>("auto");
  const [manualSplitDepth, setManualSplitDepth] = useState<0 | 1 | 2>(1);
  const [logs, setLogs] = useState<SolverLogEntry[]>([]);
  const [exploredCell, setExploredCell] = useState<CellCoordinate | null>(null);
  const [moveState, setMoveState] = useState<SolverMoveState>(null);
  const [recursiveCalls, setRecursiveCalls] = useState(0);
  const [backtracks, setBacktracks] = useState(0);
  const [solutionsFound, setSolutionsFound] = useState(0);
  const [currentRow, setCurrentRow] = useState<number | null>(null);
  const [currentColumn, setCurrentColumn] = useState<number | null>(null);
  const [searchDepth, setSearchDepth] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [storedSolutions, setStoredSolutions] = useState<number[][]>([]);
  const [currentSolutionIndex, setCurrentSolutionIndex] = useState(0);
  const [allSolutionsCapped, setAllSolutionsCapped] = useState(false);
  const [performanceByAlgorithm, setPerformanceByAlgorithm] = useState<AlgorithmPerformanceMap>({});
  const [performanceByStrategy, setPerformanceByStrategy] = useState<StrategyPerformanceMap>({});
  const [parallelTotalWorkers, setParallelTotalWorkers] = useState(0);
  const [parallelActiveWorkers, setParallelActiveWorkers] = useState(0);
  const [parallelTasksCompleted, setParallelTasksCompleted] = useState(0);
  const [parallelTasksTotal, setParallelTasksTotal] = useState(0);
  const [parallelSplitDepthUsed, setParallelSplitDepthUsed] = useState(0);
  const [parallelLoadBalancingEffectiveness, setParallelLoadBalancingEffectiveness] = useState(0);
  const [symmetryStats, setSymmetryStats] = useState<SymmetryStats>(DEFAULT_SYMMETRY_STATS);
  const [pruningStats, setPruningStats] = useState<PruningStats>(DEFAULT_PRUNING_STATS);

  const stopRef = useRef(false);
  const pauseRef = useRef(false);
  const runIdRef = useRef(0);
  const modeRef = useRef<SolverMode>("auto");
  const algorithmRef = useRef<SolverAlgorithm>("classic");
  const speedRef = useRef(DEFAULT_SPEED_MS);
  const stepBudgetRef = useRef(0);
  const stepWaiterRef = useRef<null | (() => void)>(null);
  const startedAtRef = useRef<number | null>(null);
  const logStepRef = useRef(0);

  const isBusy = useMemo(() => ["solving", "paused", "stepping", "enumerating"].includes(phase), [phase]);
  const totalStoredSolutions = storedSolutions.length;

  const appendLog = useCallback(
    (eventType: SolverEventType, message: string, row: number | null, col: number | null) => {
      logStepRef.current += 1;
      const step = logStepRef.current;
      const runId = runIdRef.current;

      setLogs((previous) => {
        const next: SolverLogEntry = {
          id: `${runId}-${step}-${eventType}`,
          step,
          eventType,
          message,
          row,
          col
        };
        return [next, ...previous].slice(0, MAX_LOGS);
      });
    },
    []
  );

  const releaseStepWaiter = useCallback(() => {
    if (stepWaiterRef.current) {
      const resolver = stepWaiterRef.current;
      stepWaiterRef.current = null;
      resolver();
    }
  }, []);

  const clearVisualState = useCallback(() => {
    setQueenCells([]);
    setActiveCell(null);
    setExploredCell(null);
    setMoveState(null);
  }, [setActiveCell, setQueenCells]);

  const clearRuntimeMetrics = useCallback(() => {
    setLogs([]);
    setRecursiveCalls(0);
    setBacktracks(0);
    setSolutionsFound(0);
    setCurrentRow(null);
    setCurrentColumn(null);
    setSearchDepth(0);
    setElapsedMs(0);
    setParallelTotalWorkers(0);
    setParallelActiveWorkers(0);
    setParallelTasksCompleted(0);
    setParallelTasksTotal(0);
    setParallelSplitDepthUsed(0);
    setParallelLoadBalancingEffectiveness(0);
    setSymmetryStats(DEFAULT_SYMMETRY_STATS);
    setPruningStats(DEFAULT_PRUNING_STATS);
    startedAtRef.current = null;
    logStepRef.current = 0;
  }, []);

  const clearStoredSolutions = useCallback(() => {
    setStoredSolutions([]);
    setCurrentSolutionIndex(0);
    setAllSolutionsCapped(false);
  }, []);

  const savePerformanceSnapshot = useCallback(
    (solverAlgorithm: SolverAlgorithm, summary: Omit<AlgorithmRunSummary, "boardSize">) => {
      const snapshot: AlgorithmRunSummary = {
        ...summary,
        boardSize
      };
      setPerformanceByAlgorithm((previous) => ({
        ...previous,
        [solverAlgorithm]: snapshot
      }));
    },
    [boardSize]
  );

  const saveStrategySnapshot = useCallback(
    (solverAlgorithm: SolverAlgorithm, strategy: SearchStrategy, runKind: "first" | "all", elapsedMs: number) => {
      setPerformanceByStrategy((previous) => {
        const existingByAlgorithm = previous[solverAlgorithm] ?? {};
        const existingByStrategy = existingByAlgorithm[strategy] ?? { boardSize };
        const next = {
          ...existingByStrategy,
          boardSize,
          ...(runKind === "first" ? { firstSolutionElapsedMs: elapsedMs } : { allSolutionsElapsedMs: elapsedMs })
        };

        return {
          ...previous,
          [solverAlgorithm]: {
            ...existingByAlgorithm,
            [strategy]: next
          }
        };
      });
    },
    [boardSize]
  );

  const reset = useCallback(() => {
    runIdRef.current += 1;
    stopRef.current = true;
    pauseRef.current = false;
    stepBudgetRef.current = 0;
    releaseStepWaiter();

    setPhase("idle");
    clearVisualState();
    clearRuntimeMetrics();
    clearStoredSolutions();
  }, [clearRuntimeMetrics, clearStoredSolutions, clearVisualState, releaseStepWaiter]);

  const pause = useCallback(() => {
    if (algorithmRef.current === "parallel") {
      return;
    }
    if (phase !== "solving" || modeRef.current !== "auto") {
      return;
    }
    pauseRef.current = true;
    setPhase("paused");
  }, [phase]);

  const resume = useCallback(() => {
    if (algorithmRef.current === "parallel") {
      return;
    }
    if (phase !== "paused" || modeRef.current !== "auto") {
      return;
    }
    pauseRef.current = false;
    setPhase("solving");
  }, [phase]);

  const stepForward = useCallback(() => {
    if (phase !== "stepping") {
      return;
    }
    stepBudgetRef.current += 1;
    releaseStepWaiter();
  }, [phase, releaseStepWaiter]);

  const runParallelMode = useCallback(
    async (selectedAlgorithm: SolverAlgorithm, findAll: boolean, currentRunId: number) => {
      if (selectedAlgorithm !== "parallel") {
        return null;
      }

      const result = await runParallelNQueenSolver({
        n: boardSize,
        findAll,
        symmetryEnabled,
        searchStrategy,
        splitDepthMode,
        manualSplitDepth,
        maxStoredSolutions: findAll ? getStorageCap(boardSize) : 1,
        shouldStop: () => stopRef.current || runIdRef.current !== currentRunId,
        onLog: (message) => {
          if (runIdRef.current !== currentRunId) {
            return;
          }
          appendLog("worker-update", message, null, null);
        },
        onProgress: (progress) => {
          if (runIdRef.current !== currentRunId) {
            return;
          }

          setParallelTotalWorkers(progress.totalWorkers);
          setParallelActiveWorkers(progress.activeWorkers);
          setParallelTasksCompleted(progress.tasksCompleted);
          setParallelTasksTotal(progress.tasksTotal);
          setParallelSplitDepthUsed(progress.splitDepthUsed);
          setParallelLoadBalancingEffectiveness(progress.loadBalancingEffectiveness);
          setRecursiveCalls(progress.recursiveCalls);
          setBacktracks(progress.backtracks);
          setSolutionsFound(progress.solutionsFound);
          setSearchDepth(progress.searchDepth);
          setCurrentRow(progress.latestRow !== null ? progress.latestRow + 1 : null);
          setCurrentColumn(progress.latestCol !== null ? progress.latestCol + 1 : null);
          setAllSolutionsCapped(progress.capped);

          if (startedAtRef.current) {
            setElapsedMs(Date.now() - startedAtRef.current);
          }
        }
      });

      return result;
    },
    [appendLog, boardSize, manualSplitDepth, searchStrategy, splitDepthMode, symmetryEnabled]
  );

  const findFirstSolution = useCallback(async () => {
    if (isBusy) {
      return;
    }

    const selectedAlgorithm = algorithmRef.current;
    const symmetryActiveForRun =
      symmetryEnabled && (selectedAlgorithm === "optimized" || selectedAlgorithm === "bitmask" || selectedAlgorithm === "parallel");
    const pruningActiveForRun = selectedAlgorithm === "optimized" || selectedAlgorithm === "bitmask" || selectedAlgorithm === "parallel";
    const currentRunId = runIdRef.current + 1;
    runIdRef.current = currentRunId;
    stopRef.current = false;
    pauseRef.current = false;
    stepBudgetRef.current = modeRef.current === "step" ? 1 : 0;
    releaseStepWaiter();

    setPhase(selectedAlgorithm === "parallel" ? "solving" : modeRef.current === "step" ? "stepping" : "solving");
    clearVisualState();
    clearRuntimeMetrics();
    clearStoredSolutions();
    startedAtRef.current = Date.now();
    setSymmetryStats(createSymmetryStats(boardSize, symmetryActiveForRun));
    setPruningStats(createPruningStats(pruningActiveForRun, 0, 0, 0));

    if (selectedAlgorithm === "parallel") {
      const parallelResult = await runParallelMode(selectedAlgorithm, false, currentRunId);
      if (!parallelResult || runIdRef.current !== currentRunId || stopRef.current) {
        return;
      }

      const finalElapsed = startedAtRef.current ? Date.now() - startedAtRef.current : 0;
      setElapsedMs(finalElapsed);
      setRecursiveCalls(parallelResult.recursiveCalls);
      setBacktracks(parallelResult.backtracks);
      setSolutionsFound(parallelResult.solutionsFound);
      setParallelTotalWorkers(parallelResult.workerCount);
      setParallelTasksCompleted(parallelResult.tasksTotal);
      setParallelTasksTotal(parallelResult.tasksTotal);
      setParallelSplitDepthUsed(parallelResult.splitDepthUsed);
      setParallelLoadBalancingEffectiveness(parallelResult.loadBalancingEffectiveness);
      setSymmetryStats(parallelResult.symmetry);
      setPruningStats(parallelResult.pruning);

      if (parallelResult.solutions.length > 0) {
        setStoredSolutions([parallelResult.solutions[0]]);
        setQueenCells(queensByRowToKeys(parallelResult.solutions[0]));
        setMoveState("valid");
        appendLog("solution-found", "Solution found using parallel workers.", null, null);
        setPhase("solved");
      } else {
        setMoveState("backtracking");
        setPhase("failed");
      }

      savePerformanceSnapshot(selectedAlgorithm, {
        elapsedMs: finalElapsed,
        recursiveCalls: parallelResult.recursiveCalls,
        backtracks: parallelResult.backtracks,
        solutionsFound: parallelResult.solutionsFound,
        symmetryEnabled: symmetryActiveForRun
      });
      saveStrategySnapshot(selectedAlgorithm, searchStrategy, "first", finalElapsed);
      return;
    }

    const result = await solveNQueenBacktracking({
      algorithm: selectedAlgorithm,
      boardSize,
      symmetryEnabled,
      searchStrategy,
      shouldStop: () => stopRef.current || runIdRef.current !== currentRunId,
      waitForPacing: async () => {
        if (modeRef.current === "auto") {
          while (pauseRef.current && !stopRef.current && runIdRef.current === currentRunId) {
            await sleep(70);
          }
          if (!stopRef.current && runIdRef.current === currentRunId) {
            await sleep(speedRef.current);
          }
          return;
        }

        while (!stopRef.current && runIdRef.current === currentRunId && stepBudgetRef.current <= 0) {
          await new Promise<void>((resolve) => {
            stepWaiterRef.current = resolve;
          });
        }

        if (stepBudgetRef.current > 0) {
          stepBudgetRef.current -= 1;
        }
      },
      onFrame: ({
        queensByRow,
        activeCell,
        moveState: currentMoveState,
        eventType,
        message,
        step,
        recursiveCalls: frameRecursiveCalls,
        backtracks: frameBacktracks,
        solutionsFound: frameSolutionsFound,
        searchDepth: frameSearchDepth
      }) => {
        if (runIdRef.current !== currentRunId) {
          return;
        }

        setQueenCells(queensByRowToKeys(queensByRow));
        setActiveCell(activeCell);
        setExploredCell(activeCell);
        setMoveState(currentMoveState);
        setRecursiveCalls(frameRecursiveCalls);
        setBacktracks(frameBacktracks);
        setSolutionsFound(frameSolutionsFound);
        setCurrentRow(activeCell ? activeCell.row + 1 : null);
        setCurrentColumn(activeCell ? activeCell.col + 1 : null);
        setSearchDepth(frameSearchDepth);
        if (startedAtRef.current) {
          setElapsedMs(Date.now() - startedAtRef.current);
        }
        setLogs((previous) => {
          const next: SolverLogEntry = {
            id: `${currentRunId}-${step}`,
            step,
            eventType,
            message,
            row: activeCell?.row ?? null,
            col: activeCell?.col ?? null
          };
          return [next, ...previous].slice(0, MAX_LOGS);
        });
      }
    });

    if (runIdRef.current !== currentRunId || stopRef.current) {
      return;
    }

    if (result.solved) {
      setStoredSolutions([result.queensByRow]);
      setCurrentSolutionIndex(0);
      setAllSolutionsCapped(false);
    }

    const finalElapsed = startedAtRef.current ? Date.now() - startedAtRef.current : 0;
    setElapsedMs(finalElapsed);
    setRecursiveCalls(result.recursiveCalls);
    setBacktracks(result.backtracks);
    setSolutionsFound(result.solutionsFound);
    setSymmetryStats(result.symmetry);
    setPruningStats(result.pruning);
    savePerformanceSnapshot(selectedAlgorithm, {
      elapsedMs: finalElapsed,
      recursiveCalls: result.recursiveCalls,
      backtracks: result.backtracks,
      solutionsFound: result.solutionsFound,
      symmetryEnabled: symmetryActiveForRun
    });
    saveStrategySnapshot(selectedAlgorithm, searchStrategy, "first", finalElapsed);

    setMoveState(result.solved ? "valid" : "backtracking");
    setPhase(result.solved ? "solved" : "failed");
  }, [
    appendLog,
    boardSize,
    clearRuntimeMetrics,
    clearStoredSolutions,
    clearVisualState,
    isBusy,
    releaseStepWaiter,
    runParallelMode,
    saveStrategySnapshot,
    savePerformanceSnapshot,
    setActiveCell,
    setQueenCells,
    searchStrategy,
    symmetryEnabled
  ]);

  const findAllSolutions = useCallback(async () => {
    if (isBusy) {
      return;
    }

    const selectedAlgorithm = algorithmRef.current;
    const symmetryActiveForRun =
      symmetryEnabled && (selectedAlgorithm === "optimized" || selectedAlgorithm === "bitmask" || selectedAlgorithm === "parallel");
    const pruningActiveForRun = selectedAlgorithm === "optimized" || selectedAlgorithm === "bitmask" || selectedAlgorithm === "parallel";
    const currentRunId = runIdRef.current + 1;
    runIdRef.current = currentRunId;
    stopRef.current = false;
    pauseRef.current = false;
    stepBudgetRef.current = 0;
    releaseStepWaiter();

    setPhase("enumerating");
    clearVisualState();
    clearRuntimeMetrics();
    clearStoredSolutions();
    startedAtRef.current = Date.now();
    setSymmetryStats(createSymmetryStats(boardSize, symmetryActiveForRun));
    setPruningStats(createPruningStats(pruningActiveForRun, 0, 0, 0));

    if (selectedAlgorithm === "parallel") {
      const parallelResult = await runParallelMode(selectedAlgorithm, true, currentRunId);
      if (!parallelResult || runIdRef.current !== currentRunId || stopRef.current) {
        return;
      }

      const finalElapsed = startedAtRef.current ? Date.now() - startedAtRef.current : 0;
      setElapsedMs(finalElapsed);
      setRecursiveCalls(parallelResult.recursiveCalls);
      setBacktracks(parallelResult.backtracks);
      setSolutionsFound(parallelResult.solutionsFound);
      setStoredSolutions(parallelResult.solutions);
      setCurrentSolutionIndex(0);
      setAllSolutionsCapped(parallelResult.capped);
      setParallelTotalWorkers(parallelResult.workerCount);
      setParallelTasksCompleted(parallelResult.tasksTotal);
      setParallelTasksTotal(parallelResult.tasksTotal);
      setParallelSplitDepthUsed(parallelResult.splitDepthUsed);
      setParallelLoadBalancingEffectiveness(parallelResult.loadBalancingEffectiveness);
      setMoveState(parallelResult.solutions.length > 0 ? "valid" : null);
      setExploredCell(null);
      setSymmetryStats(parallelResult.symmetry);
      setPruningStats(parallelResult.pruning);

      savePerformanceSnapshot(selectedAlgorithm, {
        elapsedMs: finalElapsed,
        recursiveCalls: parallelResult.recursiveCalls,
        backtracks: parallelResult.backtracks,
        solutionsFound: parallelResult.solutionsFound,
        symmetryEnabled: symmetryActiveForRun
      });
      saveStrategySnapshot(selectedAlgorithm, searchStrategy, "all", finalElapsed);

      if (parallelResult.solutions.length > 0) {
        setQueenCells(queensByRowToKeys(parallelResult.solutions[0]));
        setActiveCell(null);
        appendLog(
          "solution-found",
          parallelResult.capped
            ? `Stored ${parallelResult.solutions.length} solutions (capped).`
            : `Stored all ${parallelResult.solutions.length} solutions.`,
          null,
          null
        );
        setPhase("solved");
      } else {
        setPhase("failed");
      }
      return;
    }

    const maxStoredSolutions = getStorageCap(boardSize);
    const result = await findAllNQueenSolutions({
      algorithm: selectedAlgorithm,
      boardSize,
      symmetryEnabled,
      searchStrategy,
      maxStoredSolutions,
      shouldStop: () => stopRef.current || runIdRef.current !== currentRunId,
      yieldEveryNodes: boardSize >= 12 ? 250 : 500,
      onProgress: ({
        recursiveCalls: calls,
        backtracks: backtrackCount,
        solutionsFound: found,
        latestRow,
        latestCol,
        searchDepth: depth,
        capped
      }) => {
        if (runIdRef.current !== currentRunId) {
          return;
        }

        setRecursiveCalls(calls);
        setBacktracks(backtrackCount);
        setSolutionsFound(found);
        setCurrentRow(latestRow !== null ? latestRow + 1 : null);
        setCurrentColumn(latestCol !== null ? latestCol + 1 : null);
        setSearchDepth(depth);
        setAllSolutionsCapped(capped);
        if (startedAtRef.current) {
          setElapsedMs(Date.now() - startedAtRef.current);
        }
      }
    });

    if (runIdRef.current !== currentRunId || stopRef.current) {
      return;
    }

    setRecursiveCalls(result.recursiveCalls);
    setBacktracks(result.backtracks);
    setSolutionsFound(result.solutionsFound);
    setStoredSolutions(result.solutions);
    setCurrentSolutionIndex(0);
    setAllSolutionsCapped(result.capped);
    setMoveState(result.solutions.length > 0 ? "valid" : null);
    setExploredCell(null);
    setSymmetryStats(result.symmetry);
    setPruningStats(result.pruning);

    const finalElapsed = startedAtRef.current ? Date.now() - startedAtRef.current : 0;
    setElapsedMs(finalElapsed);
    savePerformanceSnapshot(selectedAlgorithm, {
      elapsedMs: finalElapsed,
      recursiveCalls: result.recursiveCalls,
      backtracks: result.backtracks,
      solutionsFound: result.solutionsFound,
      symmetryEnabled: symmetryActiveForRun
    });
    saveStrategySnapshot(selectedAlgorithm, searchStrategy, "all", finalElapsed);

    if (result.solutions.length > 0) {
      setQueenCells(queensByRowToKeys(result.solutions[0]));
      setActiveCell(null);
      setLogs((previous) => {
        const summary: SolverLogEntry = {
          id: `${currentRunId}-all-summary`,
          step: result.recursiveCalls,
          eventType: "solution-found",
          message: result.capped
            ? `Stored ${result.solutions.length} solutions (capped).`
            : `Stored all ${result.solutions.length} solutions.`,
          row: null,
          col: null
        };
        return [summary, ...previous].slice(0, MAX_LOGS);
      });
      setPhase("solved");
    } else {
      setPhase("failed");
    }
  }, [
    appendLog,
    boardSize,
    clearRuntimeMetrics,
    clearStoredSolutions,
    clearVisualState,
    isBusy,
    releaseStepWaiter,
    runParallelMode,
    saveStrategySnapshot,
    savePerformanceSnapshot,
    setActiveCell,
    setQueenCells,
    searchStrategy,
    symmetryEnabled
  ]);

  const goToNextSolution = useCallback(() => {
    if (isBusy || totalStoredSolutions === 0) {
      return;
    }

    setCurrentSolutionIndex((previous) => {
      const nextIndex = Math.min(previous + 1, totalStoredSolutions - 1);
      setQueenCells(queensByRowToKeys(storedSolutions[nextIndex]));
      setActiveCell(null);
      return nextIndex;
    });
  }, [isBusy, setActiveCell, setQueenCells, storedSolutions, totalStoredSolutions]);

  const goToPreviousSolution = useCallback(() => {
    if (isBusy || totalStoredSolutions === 0) {
      return;
    }

    setCurrentSolutionIndex((previous) => {
      const nextIndex = Math.max(previous - 1, 0);
      setQueenCells(queensByRowToKeys(storedSolutions[nextIndex]));
      setActiveCell(null);
      return nextIndex;
    });
  }, [isBusy, setActiveCell, setQueenCells, storedSolutions, totalStoredSolutions]);

  useEffect(() => {
    modeRef.current = mode;

    if (!isBusy) {
      return;
    }

    if (phase === "enumerating" || algorithmRef.current === "parallel") {
      return;
    }

    if (mode === "auto") {
      if (phase === "stepping") {
        setPhase("solving");
      }
      return;
    }

    if (phase === "solving" || phase === "paused") {
      setPhase("stepping");
      pauseRef.current = false;
    }
  }, [isBusy, mode, phase]);

  useEffect(() => {
    speedRef.current = speedMs;
  }, [speedMs]);

  useEffect(() => {
    algorithmRef.current = algorithm;
    if (algorithm === "parallel" && mode !== "auto") {
      setMode("auto");
    }
  }, [algorithm, mode]);

  useEffect(() => {
    if (startedAtRef.current === null) {
      return;
    }

    if (["idle", "solved", "failed"].includes(phase)) {
      if (startedAtRef.current) {
        setElapsedMs(Date.now() - startedAtRef.current);
      }
      return;
    }

    const timer = setInterval(() => {
      if (startedAtRef.current) {
        setElapsedMs(Date.now() - startedAtRef.current);
      }
    }, 120);

    return () => {
      clearInterval(timer);
    };
  }, [phase]);

  useEffect(() => {
    return () => {
      stopRef.current = true;
      pauseRef.current = false;
      releaseStepWaiter();
      runIdRef.current += 1;
    };
  }, [releaseStepWaiter]);

  const analytics: SolverAnalytics = useMemo(
    () => ({
      algorithm: getAlgorithmLabel(algorithm),
      selectedAlgorithm: algorithm,
      recursiveCalls,
      backtracks,
      solutionsFound,
      elapsedMs,
      currentRow,
      currentColumn,
      searchDepth,
      boardSize,
      solverStatus: phase,
      searchStrategy: getSearchStrategyLabel(searchStrategy),
      selectedSearchStrategy: searchStrategy,
      symmetry: {
        enabled: symmetryStats.active,
        branchesSkipped: symmetryStats.branchesSkipped,
        estimatedSearchReduction: symmetryStats.estimatedSearchReduction,
        effectiveSpeedup: symmetryStats.effectiveSpeedup
      },
      pruning: {
        branchesPruned: pruningStats.branchesPruned,
        deadStatesDetected: pruningStats.deadStatesDetected,
        estimatedWorkSaved: pruningStats.estimatedWorkSaved
      },
      parallel:
        algorithm === "parallel"
          ? {
              totalWorkers: parallelTotalWorkers,
              activeWorkers: parallelActiveWorkers,
              tasksCompleted: parallelTasksCompleted,
              tasksRemaining: Math.max(parallelTasksTotal - parallelTasksCompleted, 0),
              splitDepthUsed: parallelSplitDepthUsed,
              taskCountGenerated: parallelTasksTotal,
              loadBalancingEffectiveness: parallelLoadBalancingEffectiveness
            }
          : undefined
    }),
    [
      algorithm,
      backtracks,
      boardSize,
      currentColumn,
      currentRow,
      elapsedMs,
      parallelActiveWorkers,
      parallelTasksCompleted,
      parallelTasksTotal,
      parallelTotalWorkers,
      parallelSplitDepthUsed,
      parallelLoadBalancingEffectiveness,
      phase,
      recursiveCalls,
      searchStrategy,
      searchDepth,
      symmetryEnabled,
      pruningStats.branchesPruned,
      pruningStats.deadStatesDetected,
      pruningStats.estimatedWorkSaved,
      symmetryStats.branchesSkipped,
      symmetryStats.effectiveSpeedup,
      symmetryStats.estimatedSearchReduction,
      solutionsFound
    ]
  );

  return {
    phase,
    algorithm,
    mode,
    speedMs,
    searchStrategy,
    splitDepthMode,
    manualSplitDepth,
    symmetryEnabled,
    logs,
    exploredCell,
    moveState,
    analytics,
    performanceByAlgorithm,
    performanceByStrategy,
    isBusy,
    storedSolutions,
    totalStoredSolutions,
    currentSolutionIndex,
    allSolutionsCapped,
    setAlgorithm,
    setMode,
    setSpeedMs,
    setSearchStrategy,
    setSplitDepthMode,
    setManualSplitDepth,
    setSymmetryEnabled,
    findFirstSolution,
    findAllSolutions,
    goToNextSolution,
    goToPreviousSolution,
    pause,
    resume,
    reset,
    stepForward
  };
}
