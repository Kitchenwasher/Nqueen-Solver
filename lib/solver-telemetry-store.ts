"use client";

import { useEffect, useRef, useState } from "react";

import type { AlgorithmPerformanceMap, SolverAnalytics, StrategyPerformanceMap } from "@/types/dashboard";

type SolverTelemetryState = {
  analytics: SolverAnalytics;
  performance: AlgorithmPerformanceMap;
  strategyPerformance: StrategyPerformanceMap;
};
type EqualityFn<T> = (left: T, right: T) => boolean;

const STORAGE_KEY = "queenmind-solver-telemetry";

const initialAnalytics: SolverAnalytics = {
  algorithm: "Classic Backtracking",
  selectedAlgorithm: "classic",
  recursiveCalls: 0,
  backtracks: 0,
  solutionsFound: 0,
  elapsedMs: 0,
  currentRow: null,
  currentColumn: null,
  searchDepth: 0,
  boardSize: 8,
  solverStatus: "idle",
  searchStrategy: "Left to Right",
  selectedSearchStrategy: "left-to-right",
  solvingObjective: "Fastest First Solution",
  selectedSolvingObjective: "fastest-first",
  timeToFirstSolutionMs: null,
  timeToAllSolutionsMs: null,
  firstSolutionPath: null,
  symmetry: {
    enabled: false,
    branchesSkipped: 0,
    estimatedSearchReduction: 0,
    effectiveSpeedup: 1
  },
  pruning: {
    branchesPruned: 0,
    deadStatesDetected: 0,
    estimatedWorkSaved: 0
  }
};

const defaultState: SolverTelemetryState = {
  analytics: initialAnalytics,
  performance: {},
  strategyPerformance: {}
};

let state: SolverTelemetryState = defaultState;
let persistTimer: ReturnType<typeof setTimeout> | null = null;

const listeners = new Set<() => void>();

function readPersistedState(): SolverTelemetryState | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as SolverTelemetryState;
    if (!parsed || !parsed.analytics) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function persistState(next: SolverTelemetryState) {
  if (typeof window === "undefined") {
    return;
  }

  if (persistTimer) {
    clearTimeout(persistTimer);
    persistTimer = null;
  }

  persistTimer = setTimeout(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Ignore persistence failures and keep in-memory telemetry.
    } finally {
      persistTimer = null;
    }
  }, 200);
}

export function initializeSolverTelemetryStore() {
  const persisted = readPersistedState();
  if (persisted) {
    state = persisted;
  }
}

export function getSolverTelemetrySnapshot(): SolverTelemetryState {
  return state;
}

export function subscribeSolverTelemetry(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function setSolverTelemetrySnapshot(next: SolverTelemetryState) {
  if (
    state.analytics === next.analytics &&
    state.performance === next.performance &&
    state.strategyPerformance === next.strategyPerformance
  ) {
    return;
  }

  state = next;
  persistState(next);
  for (const listener of listeners) {
    listener();
  }
}

/**
 * Selector-style subscription hook to avoid broad rerenders from full-store snapshots.
 */
export function useSolverTelemetrySelector<T>(
  selector: (snapshot: SolverTelemetryState) => T,
  equalityFn: EqualityFn<T> = Object.is
) {
  const selectorRef = useRef(selector);
  const equalityRef = useRef(equalityFn);
  selectorRef.current = selector;
  equalityRef.current = equalityFn;

  const [selected, setSelected] = useState<T>(() => selector(state));

  useEffect(() => {
    return subscribeSolverTelemetry(() => {
      const next = selectorRef.current(state);
      setSelected((previous) => (equalityRef.current(previous, next) ? previous : next));
    });
  }, []);

  return selected;
}
