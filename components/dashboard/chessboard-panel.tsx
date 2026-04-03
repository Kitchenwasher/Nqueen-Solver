"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Binary,
  Cpu,
  CheckCircle2,
  Gauge,
  LayoutGrid,
  Layers3,
  PauseCircle,
  PlayCircle,
  SlidersHorizontal,
  Sparkles,
  RotateCcw,
  Search,
  ShieldCheck,
  SkipForward,
  TriangleAlert
} from "lucide-react";

import { SolverBoard } from "@/components/solver/solver-board";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SearchTreePanel } from "@/components/solver/search-tree-panel";
import { StatusPulse } from "@/components/effects/status-pulse";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ConstraintEditor } from "@/components/solver/constraint-editor";
import { AlgorithmSelector } from "@/components/solver/algorithm-selector";
import { StrategySelector } from "@/components/solver/strategy-selector";
import { ParallelControls } from "@/components/solver/parallel-controls";
import { HeatmapPanel } from "@/components/solver/heatmap-panel";
import { SolverControls } from "@/components/solver/solver-controls";
import { SolverPlaybackBar } from "@/components/solver/solver-playback-bar";
import { SolverStatusBar } from "@/components/solver/solver-status-bar";
import { useNQueenSolver } from "@/hooks/use-nqueen-solver";
import { useHardwareProfile } from "@/hooks/use-hardware-profile";
import { generateChallengeBoard, type ChallengeDifficulty, type ChallengeMode, type GeneratedChallenge } from "@/lib/challenges/generator";
import { getAttackedCells, getBoardValidation, getCellKey, getConflictingQueens } from "@/lib/chessboard";
import { loadSolverWorkspaceSnapshot, saveSolverWorkspaceSnapshot } from "@/lib/solver-workspace-store";
import { cn } from "@/lib/utils";
import { SUPPORTED_BOARD_SIZES, type BoardSize, type CellCoordinate, type HeatmapMode, type SolverAlgorithm } from "@/types/chessboard";
import type { AlgorithmPerformanceMap, SolverAnalytics, StrategyPerformanceMap } from "@/types/dashboard";

type ChessboardPanelProps = {
  className?: string;
  focusMode?: boolean;
  defaultAdvancedOpen?: boolean;
  surface?: "main" | "challenge";
  onAnalyticsChange?: (
    analytics: SolverAnalytics,
    performance: AlgorithmPerformanceMap,
    strategyPerformance: StrategyPerformanceMap
  ) => void;
};

const STATE_LEGEND = [
  { label: "Trying Move", swatch: "bg-sky-500/20 border-sky-300/50" },
  { label: "Valid Move", swatch: "bg-primary/20 border-primary/45" },
  { label: "Pre-placed", swatch: "bg-emerald-500/20 border-emerald-300/50" },
  { label: "Blocked", swatch: "bg-slate-700/40 border-slate-400/40" },
  { label: "Forbidden", swatch: "bg-orange-500/20 border-orange-300/50" },
  { label: "Invalid Move", swatch: "bg-rose-500/25 border-rose-300/55" },
  { label: "Backtracking", swatch: "bg-fuchsia-500/20 border-fuchsia-300/50" },
  { label: "Attacked", swatch: "bg-amber-400/20 border-amber-300/40" },
  { label: "Conflicting", swatch: "bg-rose-500/25 border-rose-300/50" }
] as const;

type ValidationOrigin = "live" | "manual";
type ConstraintEditMode = "play" | "preplace" | "blocked" | "forbidden" | "erase";

export function ChessboardPanel({
  className,
  focusMode = false,
  defaultAdvancedOpen = false,
  surface = "main",
  onAnalyticsChange
}: ChessboardPanelProps) {
  const [boardSize, setBoardSize] = useState<BoardSize>(8);
  const [queenCells, setQueenCells] = useState<string[]>([]);
  const [prePlacedQueenCells, setPrePlacedQueenCells] = useState<string[]>([]);
  const [blockedCells, setBlockedCells] = useState<string[]>([]);
  const [forbiddenCells, setForbiddenCells] = useState<string[]>([]);
  const [constraintEditMode, setConstraintEditMode] = useState<ConstraintEditMode>("play");
  const [challengeMode, setChallengeMode] = useState<ChallengeMode>("partially-filled");
  const [challengeDifficulty, setChallengeDifficulty] = useState<ChallengeDifficulty>("medium");
  const [activeChallenge, setActiveChallenge] = useState<GeneratedChallenge | null>(null);
  const [challengeStatus, setChallengeStatus] = useState<string>("No active challenge");
  const [isGeneratingChallenge, setIsGeneratingChallenge] = useState(false);
  const [activeCell, setActiveCell] = useState<CellCoordinate | null>(null);
  const [validationOrigin, setValidationOrigin] = useState<ValidationOrigin>("live");
  const [isSearchTreeVisible, setIsSearchTreeVisible] = useState(false);
  const [heatmapMode, setHeatmapMode] = useState<HeatmapMode>("off");
  const hydratedRef = useRef(false);
  const workspaceSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const analyticsPublishTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const solver = useNQueenSolver({
    boardSize,
    setQueenCells,
    setActiveCell,
    constraints: {
      blockedCells,
      forbiddenCells,
      prePlacedQueens: prePlacedQueenCells
    }
  });
  const { recommendation } = useHardwareProfile();
  const isChallengeLab = surface === "challenge";

  const prePlacedQueens = useMemo(() => new Set(prePlacedQueenCells), [prePlacedQueenCells]);
  const blockedSet = useMemo(() => new Set(blockedCells), [blockedCells]);
  const forbiddenSet = useMemo(() => new Set(forbiddenCells), [forbiddenCells]);
  const queens = useMemo(() => new Set([...queenCells, ...prePlacedQueenCells]), [prePlacedQueenCells, queenCells]);
  const attackedCells = useMemo(() => getAttackedCells(queens, boardSize), [boardSize, queens]);
  const conflictingQueens = useMemo(() => getConflictingQueens(queens), [queens]);
  const validation = useMemo(
    () => getBoardValidation(boardSize, queens, conflictingQueens),
    [boardSize, queens, conflictingQueens]
  );
  const heatmapSupported = solver.algorithm !== "parallel";

  useEffect(() => {
    if (!heatmapSupported && heatmapMode !== "off") {
      setHeatmapMode("off");
    }
  }, [heatmapMode, heatmapSupported]);

  /**
   * Derives heatmap counters from solver logs and stored solutions.
   * Parallel mode intentionally bypasses these maps for accuracy.
   */
  const heatmaps = useMemo(() => {
    if (!heatmapSupported || heatmapMode === "off") {
      return {
        exploration: {},
        conflict: {},
        solutionFrequency: {},
        maxExploration: 0,
        maxConflict: 0,
        maxSolutionFrequency: 0
      };
    }

    const exploration: Record<string, number> = {};
    const conflict: Record<string, number> = {};
    const solutionFrequency: Record<string, number> = {};

    for (const entry of solver.logs) {
      if (entry.row === null || entry.col === null) {
        continue;
      }

      const key = getCellKey(entry.row, entry.col);
      if (entry.eventType === "trying-move" || entry.eventType === "queen-placed") {
        exploration[key] = (exploration[key] ?? 0) + 1;
      }
      if (entry.eventType === "invalid-move") {
        conflict[key] = (conflict[key] ?? 0) + 1;
      }
    }

    for (const solution of solver.storedSolutions) {
      solution.forEach((col, row) => {
        if (col >= 0) {
          const key = getCellKey(row, col);
          solutionFrequency[key] = (solutionFrequency[key] ?? 0) + 1;
        }
      });
    }

    const maxExploration = Math.max(0, ...Object.values(exploration));
    const maxConflict = Math.max(0, ...Object.values(conflict));
    const maxSolutionFrequency = Math.max(0, ...Object.values(solutionFrequency));

    return {
      exploration,
      conflict,
      solutionFrequency,
      maxExploration,
      maxConflict,
      maxSolutionFrequency
    };
  }, [heatmapMode, heatmapSupported, solver.logs, solver.storedSolutions]);

  const activeHeatmapCounts = useMemo(() => {
    if (heatmapMode === "exploration") {
      return heatmaps.exploration;
    }
    if (heatmapMode === "conflict") {
      return heatmaps.conflict;
    }
    if (heatmapMode === "solution-frequency") {
      return heatmaps.solutionFrequency;
    }
    return {};
  }, [heatmapMode, heatmaps.conflict, heatmaps.exploration, heatmaps.solutionFrequency]);

  const activeHeatmapMax = useMemo(() => {
    if (heatmapMode === "exploration") {
      return heatmaps.maxExploration;
    }
    if (heatmapMode === "conflict") {
      return heatmaps.maxConflict;
    }
    if (heatmapMode === "solution-frequency") {
      return heatmaps.maxSolutionFrequency;
    }
    return 0;
  }, [heatmapMode, heatmaps.maxConflict, heatmaps.maxExploration, heatmaps.maxSolutionFrequency]);

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    const snapshot = loadSolverWorkspaceSnapshot();
    if (!snapshot) {
      hydratedRef.current = true;
      return;
    }

    setBoardSize(snapshot.boardSize);
    setQueenCells(snapshot.queenCells);
    setPrePlacedQueenCells(snapshot.prePlacedQueenCells);
    setBlockedCells(snapshot.blockedCells);
    setForbiddenCells(snapshot.forbiddenCells);
    setConstraintEditMode(snapshot.constraintEditMode);
    setChallengeMode(snapshot.challengeMode);
    setChallengeDifficulty(snapshot.challengeDifficulty);
    setActiveChallenge(snapshot.activeChallenge);
    setChallengeStatus(snapshot.challengeStatus);
    setIsSearchTreeVisible(snapshot.isSearchTreeVisible);
    setHeatmapMode(snapshot.heatmapMode);
    solver.setAlgorithm(snapshot.algorithm);
    solver.setMode(snapshot.mode);
    solver.setSpeedMs(snapshot.speedMs);
    solver.setSearchStrategy(snapshot.searchStrategy);
    solver.setSolvingObjective(snapshot.solvingObjective);
    solver.setSplitDepthMode(snapshot.splitDepthMode);
    solver.setManualSplitDepth(snapshot.manualSplitDepth);
    solver.setSymmetryEnabled(snapshot.symmetryEnabled);

    hydratedRef.current = true;
  }, []);
  /* eslint-enable react-hooks/exhaustive-deps */

  useEffect(() => {
    if (!hydratedRef.current) {
      return;
    }

    if (workspaceSaveTimerRef.current) {
      clearTimeout(workspaceSaveTimerRef.current);
      workspaceSaveTimerRef.current = null;
    }

    const delay = solver.isBusy ? 600 : 150;
    workspaceSaveTimerRef.current = setTimeout(() => {
      saveSolverWorkspaceSnapshot({
        version: 1,
        boardSize,
        queenCells,
        prePlacedQueenCells,
        blockedCells,
        forbiddenCells,
        constraintEditMode,
        challengeMode,
        challengeDifficulty,
        activeChallenge,
        challengeStatus,
        isSearchTreeVisible,
        heatmapMode,
        algorithm: solver.algorithm,
        mode: solver.mode,
        speedMs: solver.speedMs,
        searchStrategy: solver.searchStrategy,
        solvingObjective: solver.solvingObjective,
        splitDepthMode: solver.splitDepthMode,
        manualSplitDepth: solver.manualSplitDepth,
        symmetryEnabled: solver.symmetryEnabled
      });
      workspaceSaveTimerRef.current = null;
    }, delay);

    return () => {
      if (workspaceSaveTimerRef.current) {
        clearTimeout(workspaceSaveTimerRef.current);
        workspaceSaveTimerRef.current = null;
      }
    };
  }, [
    activeChallenge,
    blockedCells,
    boardSize,
    challengeDifficulty,
    challengeMode,
    challengeStatus,
    constraintEditMode,
    forbiddenCells,
    heatmapMode,
    isSearchTreeVisible,
    prePlacedQueenCells,
    queenCells,
    solver.algorithm,
    solver.manualSplitDepth,
    solver.mode,
    solver.searchStrategy,
    solver.solvingObjective,
    solver.speedMs,
    solver.splitDepthMode,
    solver.symmetryEnabled,
    solver.isBusy
  ]);

  useEffect(() => {
    if (!onAnalyticsChange) {
      return;
    }

    if (analyticsPublishTimerRef.current) {
      clearTimeout(analyticsPublishTimerRef.current);
      analyticsPublishTimerRef.current = null;
    }

    analyticsPublishTimerRef.current = setTimeout(() => {
      onAnalyticsChange(solver.analytics, solver.performanceByAlgorithm, solver.performanceByStrategy);
      analyticsPublishTimerRef.current = null;
    }, 80);

    return () => {
      if (analyticsPublishTimerRef.current) {
        clearTimeout(analyticsPublishTimerRef.current);
        analyticsPublishTimerRef.current = null;
      }
    };
  }, [onAnalyticsChange, solver.analytics, solver.performanceByAlgorithm, solver.performanceByStrategy]);

  const handleBoardSizeChange = useCallback(
    (value: BoardSize) => {
      solver.reset();
      setBoardSize(value);
      setQueenCells([]);
      setPrePlacedQueenCells([]);
      setBlockedCells([]);
      setForbiddenCells([]);
      setValidationOrigin("live");
    },
    [solver]
  );

  /**
   * Cell interaction router:
   * - normal play toggles queens
   * - edit modes mutate constraint sets
   * - busy solver locks interactions
   */
  const handleCellClick = useCallback(
    (cell: CellCoordinate) => {
      if (solver.isBusy) {
        return;
      }

      const clickedKey = getCellKey(cell.row, cell.col);
      setActiveCell(cell);
      setValidationOrigin("live");

      if (constraintEditMode === "play") {
        if (blockedSet.has(clickedKey) || forbiddenSet.has(clickedKey) || prePlacedQueens.has(clickedKey)) {
          return;
        }
        setQueenCells((previous) => {
          if (previous.includes(clickedKey)) {
            return previous.filter((queenKey) => queenKey !== clickedKey);
          }
          return [...previous, clickedKey];
        });
        return;
      }

      if (constraintEditMode === "erase") {
        setPrePlacedQueenCells((previous) => previous.filter((key) => key !== clickedKey));
        setBlockedCells((previous) => previous.filter((key) => key !== clickedKey));
        setForbiddenCells((previous) => previous.filter((key) => key !== clickedKey));
        return;
      }

      if (constraintEditMode === "preplace") {
        setBlockedCells((previous) => previous.filter((key) => key !== clickedKey));
        setForbiddenCells((previous) => previous.filter((key) => key !== clickedKey));
        setPrePlacedQueenCells((previous) => {
          if (previous.includes(clickedKey)) {
            return previous.filter((queenKey) => queenKey !== clickedKey);
          }
          return [...previous, clickedKey];
        });
        return;
      }

      if (constraintEditMode === "blocked") {
        setPrePlacedQueenCells((previous) => previous.filter((key) => key !== clickedKey));
        setForbiddenCells((previous) => previous.filter((key) => key !== clickedKey));
        setBlockedCells((previous) => {
          if (previous.includes(clickedKey)) {
            return previous.filter((key) => key !== clickedKey);
          }
          return [...previous, clickedKey];
        });
        return;
      }

      setPrePlacedQueenCells((previous) => previous.filter((key) => key !== clickedKey));
      setBlockedCells((previous) => previous.filter((key) => key !== clickedKey));
      setForbiddenCells((previous) => {
        if (previous.includes(clickedKey)) {
          return previous.filter((key) => key !== clickedKey);
        }
        return [...previous, clickedKey];
      });
    },
    [blockedSet, constraintEditMode, forbiddenSet, prePlacedQueens, solver.isBusy]
  );

  const handleClearBoard = useCallback(() => {
    if (solver.isBusy) {
      return;
    }

    setQueenCells([]);
    setPrePlacedQueenCells([]);
    setBlockedCells([]);
    setForbiddenCells([]);
    setActiveCell(null);
    setValidationOrigin("live");
  }, [solver.isBusy]);

  const handleReset = useCallback(() => {
    solver.reset();
    setValidationOrigin("live");
  }, [solver]);

  const handleValidateBoard = useCallback(() => {
    setValidationOrigin("manual");
  }, []);

  const handleFindFirstSolution = useCallback(() => {
    setValidationOrigin("live");
    void solver.findFirstSolution();
  }, [solver]);

  const handleFindAllSolutions = useCallback(() => {
    setValidationOrigin("live");
    void solver.findAllSolutions();
  }, [solver]);

  const handleRunObjective = useCallback(() => {
    setValidationOrigin("live");
    void solver.runSelectedObjective();
  }, [solver]);

  const handleAlgorithmChange = useCallback(
    (algorithm: SolverAlgorithm) => {
      if (solver.isBusy) {
        return;
      }

      solver.reset();
      solver.setAlgorithm(algorithm);
      if (algorithm === "parallel") {
        solver.setMode("auto");
      }
      setValidationOrigin("live");
    },
    [solver]
  );

  /**
   * One-click profile-based recommendation application.
   * Also aligns mode/split defaults for parallel recommendation.
   */
  const handleApplyRecommendedSolver = useCallback(() => {
    if (solver.isBusy) {
      return;
    }

    const recommended = recommendation.recommendedAlgorithm;
    solver.reset();
    solver.setAlgorithm(recommended);

    if (recommended === "parallel") {
      solver.setMode("auto");
      solver.setSplitDepthMode("auto");
    }

    setValidationOrigin("live");
  }, [recommendation.recommendedAlgorithm, solver]);

  const statusBadgeClasses =
    validation.status === "valid"
      ? "border-emerald-300/30 bg-emerald-400/15 text-emerald-200"
      : validation.status === "invalid"
        ? "border-rose-300/35 bg-rose-500/20 text-rose-100"
        : "border-amber-300/30 bg-amber-400/15 text-amber-100";

  const solverStatusClasses =
    solver.phase === "solving"
      ? "border-sky-300/30 bg-sky-500/15 text-sky-100"
      : solver.phase === "paused"
        ? "border-orange-300/35 bg-orange-500/15 text-orange-100"
        : solver.phase === "stepping"
          ? "border-indigo-300/30 bg-indigo-500/15 text-indigo-100"
          : solver.phase === "solved"
            ? "border-emerald-300/30 bg-emerald-500/15 text-emerald-100"
            : solver.phase === "failed"
              ? "border-rose-300/35 bg-rose-500/20 text-rose-100"
              : "border-border/60 bg-secondary/40 text-secondary-foreground";

  return (
    <TooltipProvider delayDuration={120}>
      <section id="solver-section" className={className}>
      <Card className="h-full">
        <CardHeader>
          <div className="flex items-center gap-2 text-primary">
            <LayoutGrid className="h-4 w-4" />
            <span className="mono text-xs uppercase tracking-[0.16em]">Board</span>
          </div>
          <CardTitle>Backtracking Visual Solver</CardTitle>
          <CardDescription>
            Step-by-step and auto-play visualization with live state transitions and solver logs.
          </CardDescription>
        </CardHeader>

        <CardContent
          className={cn(
            "grid gap-4",
            focusMode
              ? "grid-cols-1"
              : isChallengeLab
                ? "xl:grid-cols-[280px_minmax(0,1fr)_280px] xl:items-start 2xl:grid-cols-[300px_minmax(0,1fr)_300px]"
                : "xl:grid-cols-[320px_minmax(0,1fr)] xl:items-start"
          )}
        >
          <div
            className={cn(
              "flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between",
              !focusMode && "xl:col-start-2",
              isChallengeLab && !focusMode && "xl:col-end-4 lg:items-start"
            )}
          >
            <div className="inline-flex w-full items-center gap-2 xl:w-auto">
              <span className="text-sm text-muted-foreground">Board Size</span>
              <div className="w-[128px]">
                <Select value={String(boardSize)} onValueChange={(value) => handleBoardSizeChange(Number(value) as BoardSize)}>
                  <SelectTrigger id="board-size">
                    <SelectValue placeholder="Board Size" />
                  </SelectTrigger>
                  <SelectContent>
                    {SUPPORTED_BOARD_SIZES.map((size) => (
                      <SelectItem key={size} value={String(size)}>
                        {size} x {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <SolverStatusBar
              className={cn(
                "items-center lg:justify-end",
                isChallengeLab &&
                  "ml-auto w-full max-w-full justify-start pb-1 lg:justify-end"
              )}
            >
              <Badge className={cn("gap-1.5 capitalize", statusBadgeClasses)}>
                {validation.status === "valid" && <CheckCircle2 className="h-3.5 w-3.5" />}
                {validation.status === "invalid" && <TriangleAlert className="h-3.5 w-3.5" />}
                {validation.status === "in-progress" && <ShieldCheck className="h-3.5 w-3.5" />}
                {validation.status.replace("-", " ")}
              </Badge>
              <Badge className={cn("capitalize", solverStatusClasses, solver.phase === "solving" && "gap-1.5")}>
                {solver.phase === "solving" && <StatusPulse tone="cyan" />}
                {solver.phase}
              </Badge>
              {solver.algorithm === "parallel" && (
                <Badge variant="secondary" className="gap-1.5 border-sky-300/30 bg-sky-500/15 text-sky-100">
                  <Cpu className="h-3.5 w-3.5" />
                  Parallel Mode Active
                </Badge>
              )}
              <Badge variant="outline">{queens.size} Queens</Badge>
              <Badge variant="outline">{prePlacedQueenCells.length} Pre-placed</Badge>
              <Badge variant="outline">{blockedCells.length} Blocked</Badge>
              <Badge variant="outline">{forbiddenCells.length} Forbidden</Badge>
              <Badge variant="outline">{conflictingQueens.size} Conflicts</Badge>
              <Badge variant="outline">{Math.max(attackedCells.size - queens.size, 0)} Attacked Cells</Badge>
            </SolverStatusBar>
          </div>

          <motion.div
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className={cn(
              "rounded-xl border border-border/60 bg-background/30 p-2 sm:p-3",
              !focusMode && "xl:col-start-2",
              !focusMode && isChallengeLab && "xl:col-end-3",
              !focusMode && isChallengeLab && "xl:row-start-2",
              focusMode &&
                "border-primary/45 bg-slate-950/40 shadow-[0_0_0_1px_rgba(86,255,229,0.25),0_0_42px_rgba(51,255,222,0.12)]"
            )}
          >
            <SolverBoard
              boardSize={boardSize}
              focusMode={focusMode}
              queens={queens}
              prePlacedQueens={prePlacedQueens}
              blockedCells={blockedSet}
              forbiddenCells={forbiddenSet}
              attackedCells={attackedCells}
              conflictingQueens={conflictingQueens}
              activeCell={activeCell}
              exploredCell={solver.exploredCell}
              exploredState={solver.moveState}
              heatmapMode={heatmapSupported ? heatmapMode : "off"}
              heatmapCounts={activeHeatmapCounts}
              heatmapMax={activeHeatmapMax}
              isSolvingActive={solver.phase === "solving" || solver.phase === "stepping"}
              isInteractionLocked={solver.isBusy}
              onCellClick={handleCellClick}
            />
          </motion.div>

          <div
            className={cn(
              "grid gap-3 rounded-2xl border border-border/60 bg-gradient-to-b from-background/55 to-background/35 p-3 shadow-[0_24px_60px_rgba(2,8,32,0.35)]",
              focusMode ? "lg:grid-cols-[1fr_auto]" : "grid-cols-1",
              !focusMode && !isChallengeLab && "xl:col-start-1 xl:row-start-1 xl:row-span-6 xl:sticky xl:top-[96px]",
              !focusMode && isChallengeLab && "xl:col-start-1 xl:row-start-2 xl:row-span-6 xl:self-start",
              focusMode && "bg-slate-950/45"
            )}
          >
            <SolverControls>
              <Accordion
                type="multiple"
                defaultValue={isChallengeLab ? ["board", "algorithm", "mode", "strategy"] : ["board", "algorithm", "mode", "strategy", "visualization"]}
                className="w-full"
              >
                <AccordionItem value="board">
                  <AccordionTrigger className="py-2 text-xs uppercase tracking-[0.13em] text-muted-foreground">
                    <div className="flex items-center gap-2 text-left normal-case">
                      <LayoutGrid className="h-3.5 w-3.5 text-primary" />
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.13em]">A. Board Setup</p>
                        <p className="text-[11px] text-muted-foreground">Board dimensions and board actions</p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-2 pt-1">
                    <Select value={String(boardSize)} onValueChange={(value) => handleBoardSizeChange(Number(value) as BoardSize)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select board size" />
                      </SelectTrigger>
                      <SelectContent>
                        {SUPPORTED_BOARD_SIZES.map((size) => (
                          <SelectItem key={`setup-size-${size}`} value={String(size)}>
                            {size} x {size}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" className="gap-2" onClick={handleReset}>
                        <RotateCcw className="h-4 w-4" />
                        Reset
                      </Button>
                      <Button variant="outline" size="sm" className="gap-2" onClick={handleClearBoard} disabled={solver.isBusy}>
                        <RotateCcw className="h-4 w-4" />
                        Clear
                      </Button>
                      <Button variant="outline" size="sm" className="gap-2" onClick={handleValidateBoard} disabled={solver.isBusy}>
                        <ShieldCheck className="h-4 w-4" />
                        Validate
                      </Button>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="algorithm">
                  <AccordionTrigger className="py-2 text-xs uppercase tracking-[0.13em] text-muted-foreground">
                    <div className="flex items-center gap-2 text-left normal-case">
                      <Binary className="h-3.5 w-3.5 text-primary" />
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.13em]">B. Algorithm</p>
                        <p className="text-[11px] text-muted-foreground">Pick the solver engine</p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-2 pt-1">
                    <div className="mb-3 space-y-2">
                      <AlgorithmSelector
                        value={solver.algorithm}
                        onValueChange={(value) => handleAlgorithmChange(value as SolverAlgorithm)}
                        disabled={solver.isBusy}
                        options={[
                          { value: "classic", label: "Classic" },
                          { value: "optimized", label: "Optimized" },
                          { value: "bitmask", label: "Bitmask" },
                          { value: "parallel", label: "Parallel" }
                        ]}
                      />
                      <Button variant="secondary" size="sm" onClick={handleApplyRecommendedSolver} disabled={solver.isBusy}>
                        Recommended Solver
                      </Button>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="mode">
                  <AccordionTrigger className="py-2 text-xs uppercase tracking-[0.13em] text-muted-foreground">
                    <div className="flex items-center gap-2 text-left normal-case">
                      <SlidersHorizontal className="h-3.5 w-3.5 text-primary" />
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.13em]">C. Solve Mode</p>
                        <p className="text-[11px] text-muted-foreground">Playback behavior for solving</p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-2 pt-1">
                    <RadioGroup
                      value={solver.mode}
                      onValueChange={(value) => {
                        if (value === "auto" || value === "step") {
                          solver.setMode(value);
                        }
                      }}
                      className="space-y-2"
                    >
                      <label className="flex items-center gap-2 rounded-md border border-border/60 bg-background/30 px-3 py-2 text-sm">
                        <RadioGroupItem value="auto" />
                        Auto-play
                      </label>
                      <label
                        className={cn(
                          "flex items-center gap-2 rounded-md border border-border/60 bg-background/30 px-3 py-2 text-sm",
                          solver.algorithm === "parallel" && "opacity-50"
                        )}
                      >
                        <RadioGroupItem value="step" disabled={solver.algorithm === "parallel"} />
                        Step-by-step
                      </label>
                    </RadioGroup>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="symmetry">
                  <AccordionTrigger className="py-2 text-xs uppercase tracking-[0.13em] text-muted-foreground">
                    <div className="flex items-center gap-2 text-left normal-case">
                      <Sparkles className="h-3.5 w-3.5 text-primary" />
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.13em]">Symmetry</p>
                        <p className="text-[11px] text-muted-foreground">Mirror-aware pruning toggle</p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-2 pt-1">
                    <ToggleGroup
                      type="single"
                      value={solver.symmetryEnabled ? "on" : "off"}
                      onValueChange={(value) => {
                        if (value === "on") solver.setSymmetryEnabled(true);
                        if (value === "off") solver.setSymmetryEnabled(false);
                      }}
                      variant="outline"
                      size="sm"
                      className="flex flex-wrap justify-start"
                      disabled={solver.isBusy}
                    >
                      <ToggleGroupItem value="on">Symmetry ON</ToggleGroupItem>
                      <ToggleGroupItem value="off">Symmetry OFF</ToggleGroupItem>
                    </ToggleGroup>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="strategy">
                  <AccordionTrigger className="py-2 text-xs uppercase tracking-[0.13em] text-muted-foreground">
                    <div className="flex items-center gap-2 text-left normal-case">
                      <Search className="h-3.5 w-3.5 text-primary" />
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.13em]">D. Search Strategy</p>
                        <p className="text-[11px] text-muted-foreground">Branch ordering policy</p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-2 pt-1">
                    <StrategySelector
                      value={solver.searchStrategy}
                      onValueChange={(value) => {
                        if (value === "left-to-right" || value === "center-first" || value === "heuristic") {
                          solver.setSearchStrategy(value);
                        }
                      }}
                      disabled={solver.isBusy}
                      options={[
                        { value: "left-to-right", label: "Left to Right" },
                        { value: "center-first", label: "Center First" },
                        { value: "heuristic", label: "Heuristic" }
                      ]}
                    />
                    {(blockedCells.length > 0 || forbiddenCells.length > 0 || prePlacedQueenCells.length > 0) && solver.algorithm !== "classic" && (
                      <p className="text-xs text-muted-foreground">
                        Constraints are active. Solver execution will use Classic Backtracking for full compatibility.
                      </p>
                    )}

                    <Separator className="my-1" />
                    <p className="pt-1 text-xs uppercase tracking-[0.13em] text-muted-foreground">Solving Objective</p>
                    <ToggleGroup
                      type="single"
                      value={solver.solvingObjective}
                      onValueChange={(value) => {
                        if (value === "fastest-first" || value === "enumerate-all") {
                          solver.setSolvingObjective(value);
                        }
                      }}
                      variant="outline"
                      size="sm"
                      className="flex flex-wrap justify-start"
                      disabled={solver.isBusy}
                    >
                      <ToggleGroupItem value="fastest-first">Fastest First</ToggleGroupItem>
                      <ToggleGroupItem value="enumerate-all">Enumerate All</ToggleGroupItem>
                    </ToggleGroup>

                    <ParallelControls>
                      <p className="pt-1 text-xs uppercase tracking-[0.13em] text-muted-foreground">Parallel Split Depth</p>
                      <ToggleGroup
                        type="single"
                        value={solver.splitDepthMode}
                        onValueChange={(value) => {
                          if (value === "auto" || value === "manual") {
                            solver.setSplitDepthMode(value);
                          }
                        }}
                        variant="outline"
                        size="sm"
                        className="flex flex-wrap justify-start"
                        disabled={solver.isBusy || solver.algorithm !== "parallel"}
                      >
                        <ToggleGroupItem value="auto">Auto Split</ToggleGroupItem>
                        <ToggleGroupItem value="manual">Manual Split</ToggleGroupItem>
                      </ToggleGroup>
                      <Separator className="my-1" />

                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant={solver.manualSplitDepth === 0 ? "default" : "outline"}
                          size="sm"
                          onClick={() => solver.setManualSplitDepth(0)}
                          disabled={solver.isBusy || solver.algorithm !== "parallel" || solver.splitDepthMode !== "manual"}
                        >
                          Depth 0
                        </Button>
                        <Button
                          variant={solver.manualSplitDepth === 1 ? "default" : "outline"}
                          size="sm"
                          onClick={() => solver.setManualSplitDepth(1)}
                          disabled={solver.isBusy || solver.algorithm !== "parallel" || solver.splitDepthMode !== "manual"}
                        >
                          Depth 1
                        </Button>
                        <Button
                          variant={solver.manualSplitDepth === 2 ? "default" : "outline"}
                          size="sm"
                          onClick={() => solver.setManualSplitDepth(2)}
                          disabled={solver.isBusy || solver.algorithm !== "parallel" || solver.splitDepthMode !== "manual"}
                        >
                          Depth 2
                        </Button>
                      </div>
                    </ParallelControls>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="visualization">
                  <AccordionTrigger className="py-2 text-xs uppercase tracking-[0.13em] text-muted-foreground">
                    <div className="flex items-center gap-2 text-left normal-case">
                      <Layers3 className="h-3.5 w-3.5 text-primary" />
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.13em]">E. Visualization Tools</p>
                        <p className="text-[11px] text-muted-foreground">Search tree and heatmap controls</p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-2 pt-1">
                    <p className="pt-1 text-xs uppercase tracking-[0.13em] text-muted-foreground">Search Tree Visualizer</p>
                    <div className="flex flex-wrap gap-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant={isSearchTreeVisible ? "default" : "outline"}
                            size="sm"
                            onClick={() => setIsSearchTreeVisible(true)}
                          >
                            Tree ON
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Enable recursive search tree rendering.</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant={!isSearchTreeVisible ? "default" : "outline"}
                            size="sm"
                            onClick={() => setIsSearchTreeVisible(false)}
                          >
                            Tree OFF
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Hide the tree and keep board focus.</TooltipContent>
                      </Tooltip>
                    </div>

                    <HeatmapPanel>
                      <p className="pt-1 text-xs uppercase tracking-[0.13em] text-muted-foreground">Search Heatmap</p>
                      <div className="flex flex-wrap gap-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant={heatmapMode === "off" ? "default" : "outline"} size="sm" onClick={() => setHeatmapMode("off")}>
                              Off
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Disable heatmap overlays.</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant={heatmapMode === "exploration" ? "default" : "outline"}
                              size="sm"
                              onClick={() => setHeatmapMode("exploration")}
                              disabled={!heatmapSupported}
                            >
                              Exploration
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Show where search explores most.</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant={heatmapMode === "conflict" ? "default" : "outline"}
                              size="sm"
                              onClick={() => setHeatmapMode("conflict")}
                              disabled={!heatmapSupported}
                            >
                              Conflict
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Show conflict-heavy cells.</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant={heatmapMode === "solution-frequency" ? "default" : "outline"}
                              size="sm"
                              onClick={() => setHeatmapMode("solution-frequency")}
                              disabled={!heatmapSupported}
                            >
                              Solution Frequency
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Show cells used in successful solutions.</TooltipContent>
                        </Tooltip>
                      </div>
                      {!heatmapSupported && (
                        <p className="text-xs text-muted-foreground">
                          Heatmap is disabled in Parallel Solver mode for accuracy.
                        </p>
                      )}
                    </HeatmapPanel>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

            </SolverControls>

            <div className="space-y-2 rounded-xl border border-border/50 bg-background/35 p-3 lg:min-w-[280px]">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.13em] text-muted-foreground">
                <Gauge className="h-3.5 w-3.5" />
                <span>Speed ({solver.speedMs}ms)</span>
              </div>
              <input
                type="range"
                min={35}
                max={420}
                step={5}
                value={solver.speedMs}
                onChange={(event) => solver.setSpeedMs(Number(event.target.value))}
                disabled={solver.mode === "step"}
                className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-secondary accent-primary disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </div>

          {isChallengeLab && !focusMode && (
            <aside id="challenges-section" className="space-y-3 xl:col-start-3 xl:row-start-2 xl:row-span-6 xl:self-start">
              <Card className="border-border/60 bg-background/35">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2 text-primary">
                    <Layers3 className="h-3.5 w-3.5" />
                    <CardTitle className="text-sm">Constraint Editor</CardTitle>
                  </div>
                  <CardDescription className="text-xs">Set interaction mode for board edits and puzzle setup.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ConstraintEditor
                    value={constraintEditMode}
                    onValueChange={(value) => {
                      if (value === "play" || value === "preplace" || value === "blocked" || value === "forbidden" || value === "erase") {
                        setConstraintEditMode(value);
                      }
                    }}
                    disabled={solver.isBusy}
                  />
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden border-primary/30 bg-gradient-to-br from-primary/15 via-background/95 to-background/70 shadow-[0_24px_56px_rgba(3,10,34,0.48)]">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_14%,rgba(96,255,235,0.16),transparent_34%),radial-gradient(circle_at_88%_10%,rgba(86,160,255,0.14),transparent_42%),linear-gradient(135deg,rgba(96,255,235,0.04)_0%,transparent_45%,rgba(86,160,255,0.06)_100%)]" />
                <CardHeader className="relative pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-sm tracking-tight">Puzzle Control Room</CardTitle>
                      <CardDescription className="text-xs">Configure challenge mode, difficulty, and run puzzle actions.</CardDescription>
                    </div>
                    <Badge variant="outline" className="border-primary/40 bg-background/70 shadow-[0_0_0_1px_rgba(96,255,235,0.2)]">
                      {isGeneratingChallenge ? "Generating" : "Ready"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="relative space-y-3">
                  <div className="rounded-xl border border-border/60 bg-background/40 p-3">
                    <p className="mb-2 text-xs uppercase tracking-[0.13em] text-muted-foreground">Challenge Mode</p>
                    <ToggleGroup
                      type="single"
                      value={challengeMode}
                      onValueChange={(value) => {
                        if (
                          value === "partially-filled" ||
                          value === "constrained" ||
                          value === "unique-continuation" ||
                          value === "limited-clue"
                        ) {
                          setChallengeMode(value);
                        }
                      }}
                      variant="outline"
                      size="sm"
                      className="grid w-full grid-cols-2 gap-2"
                      disabled={solver.isBusy || isGeneratingChallenge}
                    >
                      <ToggleGroupItem value="partially-filled">Partial</ToggleGroupItem>
                      <ToggleGroupItem value="constrained">Constrained</ToggleGroupItem>
                      <ToggleGroupItem value="unique-continuation">Unique</ToggleGroupItem>
                      <ToggleGroupItem value="limited-clue">Clue</ToggleGroupItem>
                    </ToggleGroup>

                    <div className="mt-3 flex items-center justify-between">
                      <p className="text-xs uppercase tracking-[0.13em] text-muted-foreground">Difficulty</p>
                      <Badge variant="outline" className="border-primary/30 bg-background/50 text-[10px] capitalize">
                        {challengeDifficulty}
                      </Badge>
                    </div>
                    <RadioGroup
                      value={challengeDifficulty}
                      onValueChange={(value) => setChallengeDifficulty(value as ChallengeDifficulty)}
                      className="mt-2 grid grid-cols-3 gap-2"
                    >
                      <label className="flex items-center justify-center gap-1.5 rounded-md border border-emerald-300/30 bg-emerald-500/10 px-2 py-1.5 text-xs shadow-[inset_0_0_0_1px_rgba(16,185,129,0.15)]">
                        <RadioGroupItem value="easy" />
                        <span>Easy</span>
                      </label>
                      <label className="flex items-center justify-center gap-1.5 rounded-md border border-sky-300/30 bg-sky-500/10 px-2 py-1.5 text-xs shadow-[inset_0_0_0_1px_rgba(14,165,233,0.14)]">
                        <RadioGroupItem value="medium" />
                        <span>Medium</span>
                      </label>
                      <label className="flex items-center justify-center gap-1.5 rounded-md border border-violet-300/30 bg-violet-500/10 px-2 py-1.5 text-xs shadow-[inset_0_0_0_1px_rgba(139,92,246,0.14)]">
                        <RadioGroupItem value="hard" />
                        <span>Hard</span>
                      </label>
                    </RadioGroup>
                  </div>

                  <div className="rounded-xl border border-primary/30 bg-background/35 p-3">
                    <p className="text-xs font-semibold text-primary">Board Target: {boardSize} x {boardSize}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <Badge variant="secondary">Mode: {challengeMode.replace("-", " ")}</Badge>
                      <Badge variant="outline" className="border-primary/30 bg-background/50">
                        Difficulty: {challengeDifficulty}
                      </Badge>
                      <Badge variant="outline">Edit: {constraintEditMode}</Badge>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border/60 bg-background/35 p-3">
                    <div className="mb-2 flex flex-wrap gap-1.5">
                      <Badge variant="outline">Pre-placed {prePlacedQueenCells.length}</Badge>
                      <Badge variant="outline">Blocked {blockedCells.length}</Badge>
                      <Badge variant="outline">Forbidden {forbiddenCells.length}</Badge>
                    </div>
                    <Accordion
                      type="single"
                      collapsible
                      defaultValue={defaultAdvancedOpen ? "challenge-details" : undefined}
                      className="w-full"
                    >
                      <AccordionItem value="challenge-details" className="border-border/60">
                        <AccordionTrigger className="py-1.5 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                          Challenge Details
                        </AccordionTrigger>
                        <AccordionContent className="pt-1 text-xs text-muted-foreground">
                          {activeChallenge ? activeChallenge.description : "Generate a challenge to view puzzle metadata."}
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                    <div className="mt-3 grid grid-cols-1 gap-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            className="w-full justify-center gap-2 whitespace-normal px-3 text-sm border border-primary/40 bg-gradient-to-r from-cyan-500/90 via-sky-500/85 to-primary text-primary-foreground shadow-[0_0_0_1px_rgba(96,255,235,0.3),0_0_24px_rgba(96,255,235,0.18)] hover:from-cyan-400 hover:via-sky-400 hover:to-primary"
                            disabled={solver.isBusy || isGeneratingChallenge}
                            onClick={async () => {
                              setIsGeneratingChallenge(true);
                              setChallengeStatus("Generating challenge...");
                              try {
                                const challenge = await generateChallengeBoard({
                                  boardSize,
                                  mode: challengeMode,
                                  difficulty: challengeDifficulty
                                });
                                setActiveChallenge(challenge);
                                setPrePlacedQueenCells(challenge.prePlacedQueens);
                                setBlockedCells(challenge.blockedCells);
                                setForbiddenCells(challenge.forbiddenCells);
                                setQueenCells([]);
                                setConstraintEditMode("play");
                                setValidationOrigin("live");
                                setChallengeStatus(challenge.description);
                              } catch {
                                setChallengeStatus("Challenge generation failed for this setup. Try again.");
                              } finally {
                                setIsGeneratingChallenge(false);
                              }
                            }}
                          >
                            {isGeneratingChallenge ? "Generating..." : "Generate Challenge"}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Create a fresh puzzle with the selected mode and difficulty.</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full justify-center gap-2 whitespace-normal px-3 text-sm border-primary/25 bg-background/55 shadow-[inset_0_0_0_1px_rgba(96,255,235,0.08)]"
                            disabled={!activeChallenge || solver.isBusy || isGeneratingChallenge}
                            onClick={() => {
                              if (!activeChallenge) {
                                return;
                              }
                              setQueenCells(activeChallenge.solutionKeys.filter((key) => !activeChallenge.prePlacedQueens.includes(key)));
                              setChallengeStatus("Solution revealed.");
                            }}
                          >
                            Reveal Solution
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Fill remaining queen placements from the active challenge solution.</TooltipContent>
                      </Tooltip>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">{challengeStatus}</p>
                  </div>
                </CardContent>
              </Card>
            </aside>
          )}

          <SolverPlaybackBar className={cn(!focusMode && "xl:col-start-2", !focusMode && isChallengeLab && "xl:col-end-3")}>
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
              <Button className="gap-2" size="sm" onClick={handleFindFirstSolution} disabled={solver.isBusy}>
                <PlayCircle className="h-4 w-4" />
                Find First Solution
              </Button>
              <Button className="gap-2" size="sm" onClick={handleFindAllSolutions} disabled={solver.isBusy}>
                <PlayCircle className="h-4 w-4" />
                Find All Solutions
              </Button>
              <Button className="gap-2" size="sm" onClick={handleRunObjective} disabled={solver.isBusy}>
                <PlayCircle className="h-4 w-4" />
                Run Selected Objective
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="gap-2"
                onClick={solver.pause}
                disabled={solver.algorithm === "parallel" || solver.mode !== "auto" || solver.phase !== "solving"}
              >
                <PauseCircle className="h-4 w-4" />
                Pause
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="gap-2"
                onClick={solver.resume}
                disabled={solver.algorithm === "parallel" || solver.mode !== "auto" || solver.phase !== "paused"}
              >
                <PlayCircle className="h-4 w-4" />
                Resume
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="gap-2"
                onClick={solver.stepForward}
                disabled={solver.algorithm === "parallel" || solver.mode !== "step" || solver.phase !== "stepping"}
              >
                <SkipForward className="h-4 w-4" />
                Next Step
              </Button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" className="gap-2" onClick={handleReset}>
                <RotateCcw className="h-4 w-4" />
                Reset
              </Button>
              <Button variant="outline" size="sm" className="gap-2" onClick={handleClearBoard} disabled={solver.isBusy}>
                <RotateCcw className="h-4 w-4" />
                Clear Board
              </Button>
              <Button variant="outline" size="sm" className="gap-2" onClick={handleValidateBoard} disabled={solver.isBusy}>
                <ShieldCheck className="h-4 w-4" />
                Validate Board
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={solver.goToPreviousSolution}
                disabled={solver.isBusy || solver.currentSolutionIndex <= 0}
              >
                <ArrowLeft className="h-4 w-4" />
                Previous Solution
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={solver.goToNextSolution}
                disabled={
                  solver.isBusy ||
                  solver.currentSolutionIndex >= solver.totalStoredSolutions - 1 ||
                  solver.totalStoredSolutions === 0
                }
              >
                <ArrowRight className="h-4 w-4" />
                Next Solution
              </Button>
              </div>
            </div>
          </SolverPlaybackBar>

          <div className={cn("flex flex-wrap items-center gap-2", !focusMode && "xl:col-start-2", !focusMode && isChallengeLab && "xl:col-end-3")}>
            <Badge variant="secondary">
              Solution {solver.totalStoredSolutions === 0 ? 0 : solver.currentSolutionIndex + 1} / {solver.totalStoredSolutions}
            </Badge>
            {solver.allSolutionsCapped && (
              <Badge variant="outline">Storage capped for large board to keep the app responsive</Badge>
            )}
          </div>

          <motion.section
            layout
            transition={{ duration: 0.28, ease: "easeOut" }}
            className={cn(
              "rounded-xl border border-border/70 bg-card/60 p-3",
              !focusMode && "xl:col-start-2",
              !focusMode && isChallengeLab && "xl:col-end-3",
              focusMode && "bg-slate-950/45"
            )}
          >
            <Tabs defaultValue="log" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="log">Live Log</TabsTrigger>
                <TabsTrigger value="tree">Search Tree</TabsTrigger>
                <TabsTrigger value="heatmap">Heatmap</TabsTrigger>
              </TabsList>

              <TabsContent value="log" className="mt-3">
                <ScrollArea className="h-[230px] rounded-lg border border-border/60 bg-background/30 p-2.5 sm:h-[280px] md:h-[320px]">
                  <div className="space-y-2">
                    {solver.logs.length === 0 && (
                      <p className="text-xs text-muted-foreground">Run the solver to stream step-by-step log events.</p>
                    )}
                    {solver.logs.map((entry) => (
                      <motion.article
                        key={entry.id}
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className="rounded-md border border-border/50 bg-card/80 p-2.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-semibold text-primary">Step {entry.step}</p>
                          {entry.row !== null && entry.col !== null && (
                            <span className="mono text-[10px] text-muted-foreground">
                              R{entry.row + 1} C{entry.col + 1}
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-foreground">{entry.message}</p>
                      </motion.article>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="tree" className="mt-3">
                <SearchTreePanel visible={isSearchTreeVisible} logs={solver.logs} phase={solver.phase} boardSize={boardSize} />
              </TabsContent>

              <TabsContent value="heatmap" className="mt-3 space-y-3">
                <p className="text-xs text-muted-foreground">
                  {validation.message}
                  {validationOrigin === "manual" ? " (Validated)" : ""}
                </p>
                {!heatmapSupported && (
                  <p className="text-xs text-muted-foreground">Heatmap is disabled in Parallel Solver mode for accuracy.</p>
                )}
                <div className="flex flex-wrap gap-2.5 rounded-lg border border-border/60 bg-background/35 p-3">
                  {STATE_LEGEND.map((item) => (
                    <div key={item.label} className="inline-flex items-center gap-2">
                      <span className={cn("h-3.5 w-3.5 rounded-[4px] border", item.swatch)} />
                      <span className="text-xs text-muted-foreground">{item.label}</span>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </motion.section>
        </CardContent>
      </Card>
    </section>
    </TooltipProvider>
  );
}
