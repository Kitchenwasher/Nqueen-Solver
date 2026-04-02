"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from "react";

import {
  findAllNQueenSolutions,
  queensByRowToKeys,
  solveNQueenBacktracking,
  type SolverEventType
} from "@/lib/nqueen-solver";
import type { BoardSize, CellCoordinate, SolverAlgorithm, SolverMode, SolverMoveState } from "@/types/chessboard";
import type { AlgorithmPerformanceMap, AlgorithmRunSummary, SolverAnalytics } from "@/types/dashboard";

export type SolverPhase = "idle" | "solving" | "paused" | "stepping" | "enumerating" | "solved" | "failed";

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
const MAX_LOGS = 180;

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
  return algorithm === "optimized" ? "Optimized Solver" : "Classic Backtracking";
}

export function useNQueenSolver({ boardSize, setQueenCells, setActiveCell }: UseNQueenSolverOptions) {
  const [phase, setPhase] = useState<SolverPhase>("idle");
  const [algorithm, setAlgorithm] = useState<SolverAlgorithm>("classic");
  const [mode, setMode] = useState<SolverMode>("auto");
  const [speedMs, setSpeedMs] = useState(DEFAULT_SPEED_MS);
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

  const stopRef = useRef(false);
  const pauseRef = useRef(false);
  const runIdRef = useRef(0);
  const modeRef = useRef<SolverMode>("auto");
  const algorithmRef = useRef<SolverAlgorithm>("classic");
  const speedRef = useRef(DEFAULT_SPEED_MS);
  const stepBudgetRef = useRef(0);
  const stepWaiterRef = useRef<null | (() => void)>(null);
  const startedAtRef = useRef<number | null>(null);

  const isBusy = useMemo(() => ["solving", "paused", "stepping", "enumerating"].includes(phase), [phase]);
  const totalStoredSolutions = storedSolutions.length;

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
    startedAtRef.current = null;
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
    if (phase !== "solving" || modeRef.current !== "auto") {
      return;
    }

    pauseRef.current = true;
    setPhase("paused");
  }, [phase]);

  const resume = useCallback(() => {
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

  const findFirstSolution = useCallback(async () => {
    if (isBusy) {
      return;
    }

    const selectedAlgorithm = algorithmRef.current;
    const currentRunId = runIdRef.current + 1;
    runIdRef.current = currentRunId;
    stopRef.current = false;
    pauseRef.current = false;
    stepBudgetRef.current = modeRef.current === "step" ? 1 : 0;
    releaseStepWaiter();

    setPhase(modeRef.current === "step" ? "stepping" : "solving");
    clearVisualState();
    clearRuntimeMetrics();
    clearStoredSolutions();
    startedAtRef.current = Date.now();

    const result = await solveNQueenBacktracking({
      algorithm: selectedAlgorithm,
      boardSize,
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
    savePerformanceSnapshot(selectedAlgorithm, {
      elapsedMs: finalElapsed,
      recursiveCalls: result.recursiveCalls,
      backtracks: result.backtracks,
      solutionsFound: result.solutionsFound
    });

    setMoveState(result.solved ? "valid" : "backtracking");
    setPhase(result.solved ? "solved" : "failed");
  }, [
    boardSize,
    clearRuntimeMetrics,
    clearStoredSolutions,
    clearVisualState,
    isBusy,
    releaseStepWaiter,
    savePerformanceSnapshot,
    setActiveCell,
    setQueenCells
  ]);

  const findAllSolutions = useCallback(async () => {
    if (isBusy) {
      return;
    }

    const selectedAlgorithm = algorithmRef.current;
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

    const maxStoredSolutions = getStorageCap(boardSize);

    const result = await findAllNQueenSolutions({
      algorithm: selectedAlgorithm,
      boardSize,
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

    const finalElapsed = startedAtRef.current ? Date.now() - startedAtRef.current : 0;
    setElapsedMs(finalElapsed);
    savePerformanceSnapshot(selectedAlgorithm, {
      elapsedMs: finalElapsed,
      recursiveCalls: result.recursiveCalls,
      backtracks: result.backtracks,
      solutionsFound: result.solutionsFound
    });

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
    boardSize,
    clearRuntimeMetrics,
    clearStoredSolutions,
    clearVisualState,
    isBusy,
    releaseStepWaiter,
    savePerformanceSnapshot,
    setActiveCell,
    setQueenCells
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

    if (phase === "enumerating") {
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
  }, [algorithm]);

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
      solverStatus: phase
    }),
    [
      algorithm,
      backtracks,
      boardSize,
      currentColumn,
      currentRow,
      elapsedMs,
      phase,
      recursiveCalls,
      searchDepth,
      solutionsFound
    ]
  );

  return {
    phase,
    algorithm,
    mode,
    speedMs,
    logs,
    exploredCell,
    moveState,
    analytics,
    performanceByAlgorithm,
    isBusy,
    storedSolutions,
    totalStoredSolutions,
    currentSolutionIndex,
    allSolutionsCapped,
    setAlgorithm,
    setMode,
    setSpeedMs,
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
