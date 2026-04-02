"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNQueenSolver } from "@/hooks/use-nqueen-solver";
import { getAttackedCells, getBoardValidation, getCellKey, getConflictingQueens } from "@/lib/chessboard";
import { cn } from "@/lib/utils";
import { SUPPORTED_BOARD_SIZES, type BoardSize, type CellCoordinate } from "@/types/chessboard";
import type { AlgorithmPerformanceMap, SolverAnalytics } from "@/types/dashboard";

type ChessboardPanelProps = {
  className?: string;
  onAnalyticsChange?: (analytics: SolverAnalytics, performance: AlgorithmPerformanceMap) => void;
};

const STATE_LEGEND = [
  { label: "Trying Move", swatch: "bg-sky-500/20 border-sky-300/50" },
  { label: "Valid Move", swatch: "bg-primary/20 border-primary/45" },
  { label: "Invalid Move", swatch: "bg-rose-500/25 border-rose-300/55" },
  { label: "Backtracking", swatch: "bg-fuchsia-500/20 border-fuchsia-300/50" },
  { label: "Attacked", swatch: "bg-amber-400/20 border-amber-300/40" },
  { label: "Conflicting", swatch: "bg-rose-500/25 border-rose-300/50" }
] as const;

type ValidationOrigin = "live" | "manual";

export function ChessboardPanel({ className, onAnalyticsChange }: ChessboardPanelProps) {
  const [boardSize, setBoardSize] = useState<BoardSize>(8);
  const [queenCells, setQueenCells] = useState<string[]>([]);
  const [activeCell, setActiveCell] = useState<CellCoordinate | null>(null);
  const [validationOrigin, setValidationOrigin] = useState<ValidationOrigin>("live");

  const solver = useNQueenSolver({
    boardSize,
    setQueenCells,
    setActiveCell
  });

  const queens = useMemo(() => new Set(queenCells), [queenCells]);
  const attackedCells = useMemo(() => getAttackedCells(queens, boardSize), [boardSize, queens]);
  const conflictingQueens = useMemo(() => getConflictingQueens(queens), [queens]);
  const validation = useMemo(
    () => getBoardValidation(boardSize, queens, conflictingQueens),
    [boardSize, queens, conflictingQueens]
  );

  useEffect(() => {
    onAnalyticsChange?.(solver.analytics, solver.performanceByAlgorithm);
  }, [onAnalyticsChange, solver.analytics, solver.performanceByAlgorithm]);

  const handleBoardSizeChange = useCallback(
    (value: BoardSize) => {
      solver.reset();
      setBoardSize(value);
      setValidationOrigin("live");
    },
    [solver]
  );

  const handleCellClick = useCallback(
    (cell: CellCoordinate) => {
      if (solver.isBusy) {
        return;
      }

      const clickedKey = getCellKey(cell.row, cell.col);
      setActiveCell(cell);
      setValidationOrigin("live");

      setQueenCells((previous) => {
        if (previous.includes(clickedKey)) {
          return previous.filter((queenKey) => queenKey !== clickedKey);
        }
        return [...previous, clickedKey];
      });
    },
    [solver.isBusy]
  );

  const handleClearBoard = useCallback(() => {
    if (solver.isBusy) {
      return;
    }

    setQueenCells([]);
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

  const handleAlgorithmChange = useCallback(
    (algorithm: "classic" | "optimized") => {
      if (solver.isBusy) {
        return;
      }

      solver.reset();
      solver.setAlgorithm(algorithm);
      setValidationOrigin("live");
    },
    [solver]
  );

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
              <Badge variant="outline">{queens.size} Queens</Badge>
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
            className="rounded-xl border border-border/60 bg-background/30 p-2 sm:p-3"
          >
            <Chessboard
              boardSize={boardSize}
              queens={queens}
              attackedCells={attackedCells}
              conflictingQueens={conflictingQueens}
              activeCell={activeCell}
              exploredCell={solver.exploredCell}
              exploredState={solver.moveState}
              isSolvingActive={solver.phase === "solving" || solver.phase === "stepping"}
              isInteractionLocked={solver.isBusy}
              onCellClick={handleCellClick}
            />
          </motion.div>

          <div className="grid gap-3 rounded-lg border border-border/60 bg-background/35 p-3 lg:grid-cols-[1fr_auto]">
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
                >
                  Step-by-step
                </Button>
              </div>
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
              <Button
                variant="secondary"
                size="sm"
                className="gap-2"
                onClick={solver.pause}
                disabled={solver.mode !== "auto" || solver.phase !== "solving"}
              >
                <PauseCircle className="h-4 w-4" />
                Pause
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="gap-2"
                onClick={solver.resume}
                disabled={solver.mode !== "auto" || solver.phase !== "paused"}
              >
                <PlayCircle className="h-4 w-4" />
                Resume
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="gap-2"
                onClick={solver.stepForward}
                disabled={solver.mode !== "step" || solver.phase !== "stepping"}
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
            className="rounded-xl border border-border/70 bg-card/60 p-3"
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

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {validation.message}
              {validationOrigin === "manual" ? " (Validated)" : ""}
            </span>
          </div>

          <div className="flex flex-wrap gap-2.5 rounded-lg border border-border/60 bg-background/35 p-3">
            {STATE_LEGEND.map((item) => (
              <div key={item.label} className="inline-flex items-center gap-2">
                <span className={cn("h-3.5 w-3.5 rounded-[4px] border", item.swatch)} />
                <span className="text-xs text-muted-foreground">{item.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
