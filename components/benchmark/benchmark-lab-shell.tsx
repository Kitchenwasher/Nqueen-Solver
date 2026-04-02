"use client";

import { useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { BarChart3, Flame, FlaskConical, PlayCircle, Square } from "lucide-react";

import { TopNavbar } from "@/components/dashboard/top-navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { runBenchmark } from "@/lib/benchmark/run-benchmark";
import type { BenchmarkCaseResult, BenchmarkMode } from "@/lib/benchmark/types";
import { runStressTest } from "@/lib/stress/run-stress-test";
import type { StressSolveTarget, StressTestResult } from "@/lib/stress/types";
import { SUPPORTED_BOARD_SIZES, type BoardSize, type SearchStrategy, type SolverAlgorithm } from "@/types/chessboard";

const ALGORITHMS: SolverAlgorithm[] = ["classic", "optimized", "bitmask", "parallel"];
const ALGORITHM_LABELS: Record<SolverAlgorithm, string> = {
  classic: "Classic Backtracking",
  optimized: "Optimized Solver",
  bitmask: "Bitmask Solver",
  parallel: "Parallel Solver"
};
const SEARCH_STRATEGIES: SearchStrategy[] = ["left-to-right", "center-first", "heuristic"];
const SEARCH_STRATEGY_LABELS: Record<SearchStrategy, string> = {
  "left-to-right": "Left to Right",
  "center-first": "Center First",
  heuristic: "Heuristic Search"
};

function formatMs(value: number) {
  if (!Number.isFinite(value)) {
    return "0.00 ms";
  }
  return `${value.toFixed(2)} ms`;
}

function formatInteger(value: number) {
  return Math.round(value).toLocaleString();
}

function toPercent(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

function sortResults(results: BenchmarkCaseResult[]) {
  return [...results].sort((a, b) => {
    if (a.boardSize !== b.boardSize) {
      return a.boardSize - b.boardSize;
    }
    return ALGORITHMS.indexOf(a.algorithm) - ALGORITHMS.indexOf(b.algorithm);
  });
}

export function BenchmarkLabShell() {
  const [selectedBoardSizes, setSelectedBoardSizes] = useState<BoardSize[]>([8, 10, 12]);
  const [selectedAlgorithms, setSelectedAlgorithms] = useState<SolverAlgorithm[]>([...ALGORITHMS]);
  const [mode, setMode] = useState<BenchmarkMode>("first");
  const [runs, setRuns] = useState(3);
  const [symmetryEnabled, setSymmetryEnabled] = useState(true);
  const [searchStrategy, setSearchStrategy] = useState<SearchStrategy>("left-to-right");
  const [splitDepthMode, setSplitDepthMode] = useState<"auto" | "manual">("auto");
  const [manualSplitDepth, setManualSplitDepth] = useState<0 | 1 | 2>(1);
  const [results, setResults] = useState<BenchmarkCaseResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [progressText, setProgressText] = useState<string>("");
  const [statusText, setStatusText] = useState<string>("Ready");
  const stopRef = useRef(false);
  const [stressAlgorithm, setStressAlgorithm] = useState<SolverAlgorithm>("parallel");
  const [stressMinBoard, setStressMinBoard] = useState<BoardSize>(8);
  const [stressMaxBoard, setStressMaxBoard] = useState<BoardSize>(16);
  const [stressSolveTarget, setStressSolveTarget] = useState<StressSolveTarget>("first");
  const [stressTimeLimitSeconds, setStressTimeLimitSeconds] = useState(20);
  const [stressWorkerMode, setStressWorkerMode] = useState<"auto" | "manual">("auto");
  const [stressWorkerCount, setStressWorkerCount] = useState(8);
  const [stressResult, setStressResult] = useState<StressTestResult | null>(null);
  const [isStressRunning, setIsStressRunning] = useState(false);
  const [stressStatusText, setStressStatusText] = useState("Ready");
  const [stressProgressText, setStressProgressText] = useState("");
  const stressStopRef = useRef(false);

  const toggleBoardSize = (size: BoardSize) => {
    setSelectedBoardSizes((previous) => {
      if (previous.includes(size)) {
        return previous.filter((value) => value !== size);
      }
      return [...previous, size].sort((a, b) => a - b);
    });
  };

  const toggleAlgorithm = (algorithm: SolverAlgorithm) => {
    setSelectedAlgorithms((previous) => {
      if (previous.includes(algorithm)) {
        return previous.filter((value) => value !== algorithm);
      }
      return [...previous, algorithm];
    });
  };

  const handleStart = async () => {
    if (isRunning || isStressRunning) {
      return;
    }
    if (selectedBoardSizes.length === 0 || selectedAlgorithms.length === 0) {
      setStatusText("Select at least one board size and one algorithm.");
      return;
    }

    setResults([]);
    setStatusText("Benchmark running...");
    setProgressText("");
    setIsRunning(true);
    stopRef.current = false;

    try {
      const benchmarkResults = await runBenchmark(
        {
          boardSizes: [...selectedBoardSizes].sort((a, b) => a - b),
          algorithms: selectedAlgorithms,
          runs: Math.max(1, Math.min(20, runs)),
          mode,
          symmetryEnabled,
          searchStrategy,
          splitDepthMode,
          manualSplitDepth
        },
        {
          shouldStop: () => stopRef.current,
          onProgress: (progress) => {
            const label = ALGORITHM_LABELS[progress.currentAlgorithm];
            setProgressText(
              `${progress.completedRuns}/${progress.totalRuns} • N=${progress.currentBoardSize} • ${label} • Run ${progress.currentRun}`
            );
          }
        }
      );

      const sorted = sortResults(benchmarkResults);
      setResults(sorted);
      setStatusText(`Benchmark complete. ${sorted.length} cases measured.`);
    } catch (error) {
      if (error instanceof Error && error.name === "BenchmarkStopped") {
        setStatusText("Benchmark stopped.");
      } else {
        setStatusText("Benchmark failed.");
      }
    } finally {
      setIsRunning(false);
      setProgressText("");
    }
  };

  const handleStop = () => {
    stopRef.current = true;
  };

  const baselineByBoardSize = useMemo(() => {
    const baseline = new Map<number, number>();
    for (const result of results) {
      if (result.algorithm === "classic") {
        baseline.set(result.boardSize, result.averageElapsedMs);
      }
    }
    return baseline;
  }, [results]);

  const maxElapsed = useMemo(() => {
    if (results.length === 0) {
      return 1;
    }
    return Math.max(...results.map((result) => result.averageElapsedMs), 1);
  }, [results]);

  const byBoardSize = useMemo(() => {
    const grouped = new Map<number, BenchmarkCaseResult[]>();
    for (const result of results) {
      const current = grouped.get(result.boardSize) ?? [];
      current.push(result);
      grouped.set(result.boardSize, current);
    }
    return grouped;
  }, [results]);

  return (
    <div className="relative min-h-screen">
      <div className="pointer-events-none absolute inset-0 bg-grid-noise [background-size:22px_22px] opacity-20" />
      <TopNavbar />

      <main className="relative z-10 mx-auto flex w-full max-w-[1800px] flex-col gap-4 px-4 py-4 sm:px-6 lg:gap-5 lg:px-8 lg:py-6">
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 text-primary">
                <FlaskConical className="h-4 w-4" />
                <span className="mono text-xs uppercase tracking-[0.16em]">Benchmark Lab</span>
              </div>
              <CardTitle>Algorithm Benchmark Platform</CardTitle>
              <CardDescription>
                Compare classic, optimized, bitmask, and parallel solver performance across board sizes and modes.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.13em] text-muted-foreground">Board Sizes</p>
                  <div className="flex flex-wrap gap-2">
                    {SUPPORTED_BOARD_SIZES.map((size) => (
                      <Button
                        key={size}
                        variant={selectedBoardSizes.includes(size) ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleBoardSize(size)}
                        disabled={isRunning || isStressRunning}
                      >
                        {size} x {size}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.13em] text-muted-foreground">Algorithms</p>
                  <div className="flex flex-wrap gap-2">
                    {ALGORITHMS.map((algorithm) => (
                      <Button
                        key={algorithm}
                        variant={selectedAlgorithms.includes(algorithm) ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleAlgorithm(algorithm)}
                        disabled={isRunning || isStressRunning}
                      >
                        {ALGORITHM_LABELS[algorithm]}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.13em] text-muted-foreground">Benchmark Mode</p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={mode === "first" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setMode("first")}
                      disabled={isRunning || isStressRunning}
                    >
                      First Solution
                    </Button>
                    <Button
                      variant={mode === "all" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setMode("all")}
                      disabled={isRunning || isStressRunning}
                    >
                      All Solutions
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.13em] text-muted-foreground">Number of Runs</p>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={runs}
                    disabled={isRunning || isStressRunning}
                    onChange={(event) => setRuns(Number(event.target.value) || 1)}
                    className="h-10 w-28 rounded-md border border-input bg-background/60 px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>

                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.13em] text-muted-foreground">Symmetry Optimization</p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={symmetryEnabled ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSymmetryEnabled(true)}
                      disabled={isRunning || isStressRunning}
                    >
                      Symmetry ON
                    </Button>
                    <Button
                      variant={!symmetryEnabled ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSymmetryEnabled(false)}
                      disabled={isRunning || isStressRunning}
                    >
                      Symmetry OFF
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.13em] text-muted-foreground">Search Strategy</p>
                  <div className="flex flex-wrap gap-2">
                    {SEARCH_STRATEGIES.map((strategy) => (
                      <Button
                        key={strategy}
                        variant={searchStrategy === strategy ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSearchStrategy(strategy)}
                        disabled={isRunning || isStressRunning}
                      >
                        {SEARCH_STRATEGY_LABELS[strategy]}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.13em] text-muted-foreground">Parallel Split Depth</p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={splitDepthMode === "auto" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSplitDepthMode("auto")}
                      disabled={isRunning || isStressRunning}
                    >
                      Auto Split
                    </Button>
                    <Button
                      variant={splitDepthMode === "manual" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSplitDepthMode("manual")}
                      disabled={isRunning || isStressRunning}
                    >
                      Manual Split
                    </Button>
                    {[0, 1, 2].map((depth) => (
                      <Button
                        key={depth}
                        variant={manualSplitDepth === depth ? "default" : "outline"}
                        size="sm"
                        onClick={() => setManualSplitDepth(depth as 0 | 1 | 2)}
                        disabled={isRunning || isStressRunning || splitDepthMode !== "manual"}
                      >
                        Depth {depth}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button className="gap-2" onClick={handleStart} disabled={isRunning || isStressRunning}>
                  <PlayCircle className="h-4 w-4" />
                  Run Benchmark
                </Button>
                <Button variant="secondary" className="gap-2" onClick={handleStop} disabled={!isRunning}>
                  <Square className="h-4 w-4" />
                  Stop
                </Button>
                <Badge variant="outline">{statusText}</Badge>
                {progressText && <Badge variant="secondary">{progressText}</Badge>}
              </div>
            </CardContent>
          </Card>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.06 }}
        >
          <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-background to-background">
            <CardHeader>
              <div className="flex items-center gap-2 text-primary">
                <Flame className="h-4 w-4" />
                <span className="mono text-xs uppercase tracking-[0.16em]">Stress Test Mode</span>
              </div>
              <CardTitle>Push The System</CardTitle>
              <CardDescription>
                Sweep board sizes under a time budget to find your maximum solved N and peak runtime characteristics.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.13em] text-muted-foreground">Algorithm</p>
                  <div className="flex flex-wrap gap-2">
                    {ALGORITHMS.map((algorithm) => (
                      <Button
                        key={`stress-${algorithm}`}
                        variant={stressAlgorithm === algorithm ? "default" : "outline"}
                        size="sm"
                        onClick={() => setStressAlgorithm(algorithm)}
                        disabled={isStressRunning || isRunning}
                      >
                        {ALGORITHM_LABELS[algorithm]}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.13em] text-muted-foreground">Solve Target</p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={stressSolveTarget === "first" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setStressSolveTarget("first")}
                      disabled={isStressRunning || isRunning}
                    >
                      First Solution
                    </Button>
                    <Button
                      variant={stressSolveTarget === "all" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setStressSolveTarget("all")}
                      disabled={isStressRunning || isRunning}
                    >
                      All Solutions
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.13em] text-muted-foreground">Board Size Range</p>
                  <div className="flex items-center gap-2">
                    <select
                      value={stressMinBoard}
                      onChange={(event) => setStressMinBoard(Number(event.target.value) as BoardSize)}
                      disabled={isStressRunning || isRunning}
                      className="h-10 rounded-md border border-input bg-background/60 px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {SUPPORTED_BOARD_SIZES.map((size) => (
                        <option key={`stress-min-${size}`} value={size}>
                          {size}
                        </option>
                      ))}
                    </select>
                    <span className="text-sm text-muted-foreground">to</span>
                    <select
                      value={stressMaxBoard}
                      onChange={(event) => setStressMaxBoard(Number(event.target.value) as BoardSize)}
                      disabled={isStressRunning || isRunning}
                      className="h-10 rounded-md border border-input bg-background/60 px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {SUPPORTED_BOARD_SIZES.map((size) => (
                        <option key={`stress-max-${size}`} value={size}>
                          {size}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.13em] text-muted-foreground">Time Limit (seconds)</p>
                  <input
                    type="number"
                    min={2}
                    max={300}
                    value={stressTimeLimitSeconds}
                    disabled={isStressRunning || isRunning}
                    onChange={(event) => setStressTimeLimitSeconds(Number(event.target.value) || 2)}
                    className="h-10 w-28 rounded-md border border-input bg-background/60 px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>

                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.13em] text-muted-foreground">Parallel Workers</p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={stressWorkerMode === "auto" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setStressWorkerMode("auto")}
                      disabled={isStressRunning || isRunning || stressAlgorithm !== "parallel"}
                    >
                      Auto
                    </Button>
                    <Button
                      variant={stressWorkerMode === "manual" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setStressWorkerMode("manual")}
                      disabled={isStressRunning || isRunning || stressAlgorithm !== "parallel"}
                    >
                      Manual
                    </Button>
                    <input
                      type="number"
                      min={1}
                      max={32}
                      value={stressWorkerCount}
                      disabled={
                        isStressRunning || isRunning || stressAlgorithm !== "parallel" || stressWorkerMode !== "manual"
                      }
                      onChange={(event) => setStressWorkerCount(Number(event.target.value) || 1)}
                      className="h-9 w-24 rounded-md border border-input bg-background/60 px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  className="gap-2"
                  disabled={isStressRunning || isRunning}
                  onClick={async () => {
                    if (isRunning || isStressRunning) {
                      return;
                    }

                    const min = Math.min(stressMinBoard, stressMaxBoard);
                    const max = Math.max(stressMinBoard, stressMaxBoard);
                    setStressResult(null);
                    setStressStatusText("Stress test running...");
                    setStressProgressText("");
                    setIsStressRunning(true);
                    stressStopRef.current = false;

                    try {
                      const result = await runStressTest(
                        {
                          algorithm: stressAlgorithm,
                          minBoardSize: min,
                          maxBoardSize: max,
                          solveTarget: stressSolveTarget,
                          timeLimitMs: Math.max(2000, stressTimeLimitSeconds * 1000),
                          symmetryEnabled,
                          searchStrategy,
                          splitDepthMode,
                          manualSplitDepth,
                          parallelWorkerCount: stressAlgorithm === "parallel" && stressWorkerMode === "manual" ? stressWorkerCount : undefined
                        },
                        {
                          shouldStop: () => stressStopRef.current,
                          onProgress: (progress) => {
                            setStressProgressText(
                              `N=${progress.currentBoardSize} | elapsed ${formatMs(progress.elapsedMs)} | nodes ${formatInteger(progress.totalNodesExplored)}`
                            );
                          }
                        }
                      );
                      setStressResult(result);
                      setStressStatusText(result.reachedTimeLimit ? "Time limit reached." : "Stress test completed.");
                    } catch (error) {
                      if (error instanceof Error && error.name === "StressTestStopped") {
                        setStressStatusText("Stress test stopped.");
                      } else {
                        setStressStatusText("Stress test failed.");
                      }
                    } finally {
                      setIsStressRunning(false);
                      setStressProgressText("");
                    }
                  }}
                >
                  <PlayCircle className="h-4 w-4" />
                  Run Stress Test
                </Button>

                <Button
                  variant="secondary"
                  className="gap-2"
                  onClick={() => {
                    stressStopRef.current = true;
                  }}
                  disabled={!isStressRunning}
                >
                  <Square className="h-4 w-4" />
                  Stop
                </Button>

                <Badge variant="outline">{stressStatusText}</Badge>
                {stressProgressText && <Badge variant="secondary">{stressProgressText}</Badge>}
              </div>

              {stressResult && (
                <div className="space-y-3">
                  <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
                    <article className="rounded-lg border border-border/60 bg-background/35 p-3">
                      <p className="text-xs text-muted-foreground">Max Solved N</p>
                      <p className="text-lg font-semibold">{stressResult.maxSolvedN ?? "-"}</p>
                    </article>
                    <article className="rounded-lg border border-border/60 bg-background/35 p-3">
                      <p className="text-xs text-muted-foreground">Total Nodes Explored</p>
                      <p className="text-lg font-semibold">{formatInteger(stressResult.totalNodesExplored)}</p>
                    </article>
                    <article className="rounded-lg border border-border/60 bg-background/35 p-3">
                      <p className="text-xs text-muted-foreground">Elapsed Time</p>
                      <p className="text-lg font-semibold">{formatMs(stressResult.totalElapsedMs)}</p>
                    </article>
                    <article className="rounded-lg border border-border/60 bg-background/35 p-3">
                      <p className="text-xs text-muted-foreground">Peak Worker Usage</p>
                      <p className="text-lg font-semibold">{stressResult.peakWorkerUsage}</p>
                    </article>
                    <article className="rounded-lg border border-border/60 bg-background/35 p-3">
                      <p className="text-xs text-muted-foreground">Solutions Found</p>
                      <p className="text-lg font-semibold">{formatInteger(stressResult.totalSolutionsFound)}</p>
                    </article>
                    <article className="rounded-lg border border-border/60 bg-background/35 p-3">
                      <p className="text-xs text-muted-foreground">Speed (Nodes/s)</p>
                      <p className="text-lg font-semibold">{formatInteger(stressResult.averageNodesPerSecond)}</p>
                    </article>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2">
                    <article className="rounded-lg border border-border/60 bg-background/35 p-3">
                      <p className="text-xs text-muted-foreground">Average Time per Board</p>
                      <p className="text-sm font-semibold">{formatMs(stressResult.averageMsPerBoard)}</p>
                    </article>
                    <article className="rounded-lg border border-border/60 bg-background/35 p-3">
                      <p className="text-xs text-muted-foreground">Stress Mode Status</p>
                      <p className="text-sm font-semibold">
                        {stressResult.reachedTimeLimit ? "Stopped at configured time limit" : "Completed configured board range"}
                      </p>
                    </article>
                  </div>

                  <div className="overflow-x-auto rounded-lg border border-border/60">
                    <table className="w-full min-w-[850px] text-left text-sm">
                      <thead className="border-b border-border/60 bg-background/40">
                        <tr>
                          <th className="px-3 py-2">N</th>
                          <th className="px-3 py-2">Solved</th>
                          <th className="px-3 py-2">Timed Out</th>
                          <th className="px-3 py-2">Elapsed</th>
                          <th className="px-3 py-2">Nodes</th>
                          <th className="px-3 py-2">Backtracks</th>
                          <th className="px-3 py-2">Branches Pruned</th>
                          <th className="px-3 py-2">Solutions</th>
                          <th className="px-3 py-2">Workers Used</th>
                          <th className="px-3 py-2">Peak Active Workers</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stressResult.steps.map((step) => (
                          <tr key={`stress-step-${step.boardSize}`} className="border-b border-border/40">
                            <td className="px-3 py-2">{step.boardSize}</td>
                            <td className="px-3 py-2">{step.solved ? "Yes" : "No"}</td>
                            <td className="px-3 py-2">{step.timedOut ? "Yes" : "No"}</td>
                            <td className="px-3 py-2">{formatMs(step.elapsedMs)}</td>
                            <td className="px-3 py-2">{formatInteger(step.recursiveCalls)}</td>
                            <td className="px-3 py-2">{formatInteger(step.backtracks)}</td>
                            <td className="px-3 py-2">{formatInteger(step.branchesPruned)}</td>
                            <td className="px-3 py-2">{formatInteger(step.solutionsFound)}</td>
                            <td className="px-3 py-2">{step.workersUsed || "-"}</td>
                            <td className="px-3 py-2">{step.peakActiveWorkers || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.08 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 text-primary">
                <BarChart3 className="h-4 w-4" />
                <span className="mono text-xs uppercase tracking-[0.16em]">Results</span>
              </div>
              <CardTitle>Benchmark Comparison</CardTitle>
              <CardDescription>Solve time, recursive calls, backtracks, pruning, speedup ratio, and solutions found.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {results.length === 0 && <p className="text-sm text-muted-foreground">No benchmark results yet. Configure options and run.</p>}

              {results.length > 0 && (
                <>
                  <div className="overflow-x-auto rounded-lg border border-border/60">
                    <table className="w-full min-w-[1100px] text-left text-sm">
                      <thead className="border-b border-border/60 bg-background/40">
                        <tr>
                          <th className="px-3 py-2">Algorithm</th>
                          <th className="px-3 py-2">Board</th>
                          <th className="px-3 py-2">Mode</th>
                          <th className="px-3 py-2">Avg Time</th>
                          <th className="px-3 py-2">Best Time</th>
                          <th className="px-3 py-2">Recursive Calls</th>
                          <th className="px-3 py-2">Backtracks</th>
                          <th className="px-3 py-2">Branches Pruned</th>
                          <th className="px-3 py-2">Solutions Found</th>
                          <th className="px-3 py-2">Speedup vs Classic</th>
                        </tr>
                      </thead>
                      <tbody>
                        {results.map((result) => {
                          const classic = baselineByBoardSize.get(result.boardSize);
                          const speedup = classic && result.averageElapsedMs > 0 ? classic / result.averageElapsedMs : null;

                          return (
                            <tr key={`${result.algorithm}-${result.boardSize}`} className="border-b border-border/40">
                              <td className="px-3 py-2 font-medium">{ALGORITHM_LABELS[result.algorithm]}</td>
                              <td className="px-3 py-2">
                                {result.boardSize} x {result.boardSize}
                              </td>
                              <td className="px-3 py-2 capitalize">{result.mode}</td>
                              <td className="px-3 py-2">{formatMs(result.averageElapsedMs)}</td>
                              <td className="px-3 py-2">{formatMs(result.bestElapsedMs)}</td>
                              <td className="px-3 py-2">{formatInteger(result.averageRecursiveCalls)}</td>
                              <td className="px-3 py-2">{formatInteger(result.averageBacktracks)}</td>
                              <td className="px-3 py-2">{formatInteger(result.averageBranchesPruned)}</td>
                              <td className="px-3 py-2">{formatInteger(result.averageSolutionsFound)}</td>
                              <td className="px-3 py-2">{speedup ? `${speedup.toFixed(2)}x` : "N/A"}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="space-y-3">
                    {[...byBoardSize.entries()].map(([boardSize, entries]) => (
                      <article key={boardSize} className="rounded-lg border border-border/60 bg-background/25 p-3">
                        <p className="mb-2 text-sm font-semibold">
                          N = {boardSize} ({mode === "first" ? "First Solution" : "All Solutions"})
                        </p>
                        <div className="space-y-2">
                          {entries.map((entry) => {
                            const width = `${(entry.averageElapsedMs / maxElapsed) * 100}%`;
                            const classic = baselineByBoardSize.get(entry.boardSize);
                            const speedup = classic && entry.averageElapsedMs > 0 ? classic / entry.averageElapsedMs : null;
                            return (
                              <div key={`${entry.algorithm}-${entry.boardSize}`} className="space-y-1">
                                <div className="flex items-center justify-between gap-2 text-xs">
                                  <span>{ALGORITHM_LABELS[entry.algorithm]}</span>
                                  <span className="text-muted-foreground">
                                    {formatMs(entry.averageElapsedMs)} {speedup ? `(${speedup.toFixed(2)}x)` : ""}
                                  </span>
                                </div>
                                <div className="h-2 rounded-full bg-secondary/60">
                                  <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width }} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </article>
                    ))}
                  </div>

                  <div className="grid gap-2 sm:grid-cols-3">
                    <article className="rounded-lg border border-border/60 bg-background/25 p-3">
                      <p className="text-xs text-muted-foreground">Configured Runs</p>
                      <p className="text-lg font-semibold">{runs}</p>
                    </article>
                    <article className="rounded-lg border border-border/60 bg-background/25 p-3">
                      <p className="text-xs text-muted-foreground">Symmetry Active</p>
                      <p className="text-lg font-semibold">{symmetryEnabled ? "Yes" : "No"}</p>
                    </article>
                    <article className="rounded-lg border border-border/60 bg-background/25 p-3">
                      <p className="text-xs text-muted-foreground">Search Strategy</p>
                      <p className="text-lg font-semibold">{SEARCH_STRATEGY_LABELS[searchStrategy]}</p>
                    </article>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Speedup ratio uses Classic Backtracking as baseline for the same board size. Estimated search reduction from symmetry
                    is approximately {toPercent(symmetryEnabled ? 0.5 : 0)} on large even boards.
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </motion.section>
      </main>
    </div>
  );
}
