"use client";

import type { ChallengeDifficulty, ChallengeMode, GeneratedChallenge } from "@/lib/challenges/generator";
import type { BoardSize, HeatmapMode, SearchStrategy, SolverAlgorithm, SolverMode, SolvingObjective } from "@/types/chessboard";
import type { ParallelSplitDepthMode } from "@/hooks/use-nqueen-solver";

export type ConstraintEditMode = "play" | "preplace" | "blocked" | "forbidden" | "erase";

type SolverWorkspaceSnapshot = {
  version: 1;
  boardSize: BoardSize;
  queenCells: string[];
  prePlacedQueenCells: string[];
  blockedCells: string[];
  forbiddenCells: string[];
  constraintEditMode: ConstraintEditMode;
  challengeMode: ChallengeMode;
  challengeDifficulty: ChallengeDifficulty;
  activeChallenge: GeneratedChallenge | null;
  challengeStatus: string;
  isSearchTreeVisible: boolean;
  heatmapMode: HeatmapMode;
  algorithm: SolverAlgorithm;
  mode: SolverMode;
  speedMs: number;
  searchStrategy: SearchStrategy;
  solvingObjective: SolvingObjective;
  splitDepthMode: ParallelSplitDepthMode;
  manualSplitDepth: 0 | 1 | 2;
  symmetryEnabled: boolean;
};

const STORAGE_KEY = "queenmind-solver-workspace-v1";

export function loadSolverWorkspaceSnapshot(): SolverWorkspaceSnapshot | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as SolverWorkspaceSnapshot;
    if (!parsed || parsed.version !== 1) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveSolverWorkspaceSnapshot(snapshot: SolverWorkspaceSnapshot) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    // no-op: keep app functional even if storage is unavailable
  }
}

