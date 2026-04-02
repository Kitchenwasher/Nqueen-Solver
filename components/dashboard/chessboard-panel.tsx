"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Cpu,
  CheckCircle2,
  Gauge,
  LayoutGrid,
  PauseCircle,
  PlayCircle,
  RotateCcw,
  ShieldCheck,
  SkipForward,
  TriangleAlert
} from "lucide-react";

import { Chessboard } from "@/components/chessboard/chessboard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SearchTreeVisualizer } from "@/components/dashboard/search-tree-visualizer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNQueenSolver } from "@/hooks/use-nqueen-solver";
import { useHardwareProfile } from "@/hooks/use-hardware-profile";
import { generateChallengeBoard, type ChallengeDifficulty, type ChallengeMode, type GeneratedChallenge } from "@/lib/challenges/generator";
import { getAttackedCells, getBoardValidation, getCellKey, getConflictingQueens } from "@/lib/chessboard";
import { cn } from "@/lib/utils";
import { SUPPORTED_BOARD_SIZES, type BoardSize, type CellCoordinate, type HeatmapMode, type SolverAlgorithm } from "@/types/chessboard";
import type { AlgorithmPerformanceMap, SolverAnalytics, StrategyPerformanceMap } from "@/types/dashboard";

type ChessboardPanelProps = {
  className?: string;
  focusMode?: boolean;
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

export function ChessboardPanel({ className, focusMode = false, onAnalyticsChange }: ChessboardPanelProps) {
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
  }, [solver.logs, solver.storedSolutions]);

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

  useEffect(() => {
    onAnalyticsChange?.(solver.analytics, solver.performanceByAlgorithm, solver.performanceByStrategy);
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
    <section className={className}>
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

        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="inline-flex w-full items-center gap-2 xl:w-auto">
              <label htmlFor="board-size" className="text-sm text-muted-foreground">
                Board Size
              </label>
              <select
                id="board-size"
                value={boardSize}
                onChange={(event) => handleBoardSizeChange(Number(event.target.value) as BoardSize)}
                className="h-10 rounded-md border border-input bg-background/60 px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {SUPPORTED_BOARD_SIZES.map((size) => (
                  <option key={size} value={size}>
                    {size} x {size}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge className={cn("gap-1.5 capitalize", statusBadgeClasses)}>
                {validation.status === "valid" && <CheckCircle2 className="h-3.5 w-3.5" />}
                {validation.status === "invalid" && <TriangleAlert className="h-3.5 w-3.5" />}
                {validation.status === "in-progress" && <ShieldCheck className="h-3.5 w-3.5" />}
                {validation.status.replace("-", " ")}
              </Badge>
              <Badge className={cn("capitalize", solverStatusClasses)}>{solver.phase}</Badge>
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
              {solver.exploredCell && (
                <Badge variant="secondary">
                  Exploring R{solver.exploredCell.row + 1} C{solver.exploredCell.col + 1}
                </Badge>
              )}
            </div>
          </div>

          <motion.div
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className={cn(
              "rounded-xl border border-border/60 bg-background/30 p-2 sm:p-3",
              focusMode &&
                "border-primary/45 bg-slate-950/40 shadow-[0_0_0_1px_rgba(86,255,229,0.25),0_0_42px_rgba(51,255,222,0.12)]"
            )}
          >
            <Chessboard
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
              "grid gap-3 rounded-lg border border-border/60 bg-background/35 p-3 lg:grid-cols-[1fr_auto]",
              focusMode && "bg-slate-950/35"
            )}
          >
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.13em] text-muted-foreground">Algorithm</p>
              <div className="mb-3 flex flex-wrap gap-2">
                <Button
                  variant={solver.algorithm === "classic" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleAlgorithmChange("classic")}
                  disabled={solver.isBusy}
                >
                  Classic Backtracking
                </Button>
                <Button
                  variant={solver.algorithm === "optimized" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleAlgorithmChange("optimized")}
                  disabled={solver.isBusy}
                >
                  Optimized Solver
                </Button>
                <Button
                  variant={solver.algorithm === "bitmask" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleAlgorithmChange("bitmask")}
                  disabled={solver.isBusy}
                >
                  Bitmask Solver
                </Button>
                <Button
                  variant={solver.algorithm === "parallel" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleAlgorithmChange("parallel")}
                  disabled={solver.isBusy}
                >
                  Parallel Solver
                </Button>
                <Button variant="secondary" size="sm" onClick={handleApplyRecommendedSolver} disabled={solver.isBusy}>
                  Apply Recommended Solver
                </Button>
              </div>

              <p className="text-xs uppercase tracking-[0.13em] text-muted-foreground">Mode</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={solver.mode === "auto" ? "default" : "outline"}
                  size="sm"
                  onClick={() => solver.setMode("auto")}
                >
                  Auto-play
                </Button>
                <Button
                  variant={solver.mode === "step" ? "default" : "outline"}
                  size="sm"
                  onClick={() => solver.setMode("step")}
                  disabled={solver.algorithm === "parallel"}
                >
                  Step-by-step
                </Button>
              </div>

              <p className="pt-1 text-xs uppercase tracking-[0.13em] text-muted-foreground">Symmetry Optimization</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={solver.symmetryEnabled ? "default" : "outline"}
                  size="sm"
                  onClick={() => solver.setSymmetryEnabled(true)}
                  disabled={solver.isBusy}
                >
                  Symmetry ON
                </Button>
                <Button
                  variant={!solver.symmetryEnabled ? "default" : "outline"}
                  size="sm"
                  onClick={() => solver.setSymmetryEnabled(false)}
                  disabled={solver.isBusy}
                >
                  Symmetry OFF
                </Button>
              </div>

              <p className="pt-1 text-xs uppercase tracking-[0.13em] text-muted-foreground">Search Strategy</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={solver.searchStrategy === "left-to-right" ? "default" : "outline"}
                  size="sm"
                  onClick={() => solver.setSearchStrategy("left-to-right")}
                  disabled={solver.isBusy}
                >
                  Left to Right
                </Button>
                <Button
                  variant={solver.searchStrategy === "center-first" ? "default" : "outline"}
                  size="sm"
                  onClick={() => solver.setSearchStrategy("center-first")}
                  disabled={solver.isBusy}
                >
                  Center First
                </Button>
                <Button
                  variant={solver.searchStrategy === "heuristic" ? "default" : "outline"}
                  size="sm"
                  onClick={() => solver.setSearchStrategy("heuristic")}
                  disabled={solver.isBusy}
                >
                  Heuristic Search
                </Button>
              </div>
              {(blockedCells.length > 0 || forbiddenCells.length > 0 || prePlacedQueenCells.length > 0) && solver.algorithm !== "classic" && (
                <p className="text-xs text-muted-foreground">
                  Constraints are active. Solver execution will use Classic Backtracking for full compatibility.
                </p>
              )}

              <p className="pt-1 text-xs uppercase tracking-[0.13em] text-muted-foreground">Constraint Editor</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={constraintEditMode === "play" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setConstraintEditMode("play")}
                  disabled={solver.isBusy}
                >
                  Play Queens
                </Button>
                <Button
                  variant={constraintEditMode === "preplace" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setConstraintEditMode("preplace")}
                  disabled={solver.isBusy}
                >
                  Pre-place Queens
                </Button>
                <Button
                  variant={constraintEditMode === "blocked" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setConstraintEditMode("blocked")}
                  disabled={solver.isBusy}
                >
                  Block Cells
                </Button>
                <Button
                  variant={constraintEditMode === "forbidden" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setConstraintEditMode("forbidden")}
                  disabled={solver.isBusy}
                >
                  Forbid Cells
                </Button>
                <Button
                  variant={constraintEditMode === "erase" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setConstraintEditMode("erase")}
                  disabled={solver.isBusy}
                >
                  Erase Cell
                </Button>
              </div>

              <p className="pt-1 text-xs uppercase tracking-[0.13em] text-muted-foreground">Challenge Generator</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={challengeMode === "partially-filled" ? "default" : "outline"}
                  size="sm"
                  disabled={solver.isBusy || isGeneratingChallenge}
                  onClick={() => setChallengeMode("partially-filled")}
                >
                  Partial Fill
                </Button>
                <Button
                  variant={challengeMode === "constrained" ? "default" : "outline"}
                  size="sm"
                  disabled={solver.isBusy || isGeneratingChallenge}
                  onClick={() => setChallengeMode("constrained")}
                >
                  Constrained
                </Button>
                <Button
                  variant={challengeMode === "unique-continuation" ? "default" : "outline"}
                  size="sm"
                  disabled={solver.isBusy || isGeneratingChallenge}
                  onClick={() => setChallengeMode("unique-continuation")}
                >
                  Unique Continuation
                </Button>
                <Button
                  variant={challengeMode === "limited-clue" ? "default" : "outline"}
                  size="sm"
                  disabled={solver.isBusy || isGeneratingChallenge}
                  onClick={() => setChallengeMode("limited-clue")}
                >
                  Limited Clue
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant={challengeDifficulty === "easy" ? "default" : "outline"}
                  size="sm"
                  disabled={solver.isBusy || isGeneratingChallenge}
                  onClick={() => setChallengeDifficulty("easy")}
                >
                  Easy
                </Button>
                <Button
                  variant={challengeDifficulty === "medium" ? "default" : "outline"}
                  size="sm"
                  disabled={solver.isBusy || isGeneratingChallenge}
                  onClick={() => setChallengeDifficulty("medium")}
                >
                  Medium
                </Button>
                <Button
                  variant={challengeDifficulty === "hard" ? "default" : "outline"}
                  size="sm"
                  disabled={solver.isBusy || isGeneratingChallenge}
                  onClick={() => setChallengeDifficulty("hard")}
                >
                  Hard
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
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
                <Button
                  variant="outline"
                  size="sm"
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
              </div>
              <p className="text-xs text-muted-foreground">{challengeStatus}</p>

              <p className="pt-1 text-xs uppercase tracking-[0.13em] text-muted-foreground">Solving Objective</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={solver.solvingObjective === "fastest-first" ? "default" : "outline"}
                  size="sm"
                  onClick={() => solver.setSolvingObjective("fastest-first")}
                  disabled={solver.isBusy}
                >
                  Fastest First Solution
                </Button>
                <Button
                  variant={solver.solvingObjective === "enumerate-all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => solver.setSolvingObjective("enumerate-all")}
                  disabled={solver.isBusy}
                >
                  Enumerate All Solutions
                </Button>
              </div>

              <p className="pt-1 text-xs uppercase tracking-[0.13em] text-muted-foreground">Parallel Split Depth</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={solver.splitDepthMode === "auto" ? "default" : "outline"}
                  size="sm"
                  onClick={() => solver.setSplitDepthMode("auto")}
                  disabled={solver.isBusy || solver.algorithm !== "parallel"}
                >
                  Auto Split
                </Button>
                <Button
                  variant={solver.splitDepthMode === "manual" ? "default" : "outline"}
                  size="sm"
                  onClick={() => solver.setSplitDepthMode("manual")}
                  disabled={solver.isBusy || solver.algorithm !== "parallel"}
                >
                  Manual Split
                </Button>
              </div>

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

              <p className="pt-1 text-xs uppercase tracking-[0.13em] text-muted-foreground">Search Tree Visualizer</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={isSearchTreeVisible ? "default" : "outline"}
                  size="sm"
                  onClick={() => setIsSearchTreeVisible(true)}
                >
                  Tree ON
                </Button>
                <Button
                  variant={!isSearchTreeVisible ? "default" : "outline"}
                  size="sm"
                  onClick={() => setIsSearchTreeVisible(false)}
                >
                  Tree OFF
                </Button>
              </div>

              <p className="pt-1 text-xs uppercase tracking-[0.13em] text-muted-foreground">Search Heatmap</p>
              <div className="flex flex-wrap gap-2">
                <Button variant={heatmapMode === "off" ? "default" : "outline"} size="sm" onClick={() => setHeatmapMode("off")}>
                  Off
                </Button>
                <Button
                  variant={heatmapMode === "exploration" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setHeatmapMode("exploration")}
                  disabled={!heatmapSupported}
                >
                  Exploration
                </Button>
                <Button
                  variant={heatmapMode === "conflict" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setHeatmapMode("conflict")}
                  disabled={!heatmapSupported}
                >
                  Conflict
                </Button>
                <Button
                  variant={heatmapMode === "solution-frequency" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setHeatmapMode("solution-frequency")}
                  disabled={!heatmapSupported}
                >
                  Solution Frequency
                </Button>
              </div>
              {!heatmapSupported && (
                <p className="text-xs text-muted-foreground">
                  Heatmap is disabled in Parallel Solver mode for accuracy.
                </p>
              )}
            </div>

            <div className="space-y-2 lg:min-w-[280px]">
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

          <div className="rounded-lg border border-border/60 bg-background/35 p-2.5">
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

          <div className="flex flex-wrap items-center gap-2">
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
            className={cn("rounded-xl border border-border/70 bg-card/60 p-3", focusMode && "bg-slate-950/45")}
          >
            <p className="mb-2 text-sm font-medium">Live Solver Log</p>
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
          </motion.section>

          {!focusMode && isSearchTreeVisible && <SearchTreeVisualizer logs={solver.logs} phase={solver.phase} boardSize={boardSize} />}

          {!focusMode && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {validation.message}
                {validationOrigin === "manual" ? " (Validated)" : ""}
              </span>
            </div>
          )}

          {!focusMode && (
            <div className="flex flex-wrap gap-2.5 rounded-lg border border-border/60 bg-background/35 p-3">
              {STATE_LEGEND.map((item) => (
                <div key={item.label} className="inline-flex items-center gap-2">
                  <span className={cn("h-3.5 w-3.5 rounded-[4px] border", item.swatch)} />
                  <span className="text-xs text-muted-foreground">{item.label}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
