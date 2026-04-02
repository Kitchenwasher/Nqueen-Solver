"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { BarChart3, Flame, FlaskConical, PlayCircle, Sparkles, Square } from "lucide-react";
import { GlowBorder } from "@/components/effects/glow-border";
import { GradientOverlay } from "@/components/effects/gradient-overlay";
import { SpotlightBackground } from "@/components/effects/spotlight-background";
import { StatusPulse } from "@/components/effects/status-pulse";

import { TopNavbar } from "@/components/dashboard/top-navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { runBenchmark } from "@/lib/benchmark/run-benchmark";
import { BenchmarkSummaryCard, BenchmarkSummaryCards } from "@/components/benchmark/panels/benchmark-summary-cards";
import { BenchmarkConfigPanel } from "@/components/benchmark/panels/benchmark-config-panel";
import { BenchmarkResultsTable } from "@/components/benchmark/panels/benchmark-results-table";
import { StressTestPanel } from "@/components/benchmark/panels/stress-test-panel";
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
  const [activeTab, setActiveTab] = useState<"benchmark" | "stress">("benchmark");
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
  const [benchmarkProgressValue, setBenchmarkProgressValue] = useState(0);
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
  const [stressProgressValue, setStressProgressValue] = useState(0);
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

  /**
   * Runs benchmark matrix using current UI selections.
   * Side effect: clears previous results and streams progress text.
   */
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
    setBenchmarkProgressValue(0);
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
              `${progress.completedRuns}/${progress.totalRuns} | N=${progress.currentBoardSize} | ${label} | Run ${progress.currentRun}`
            );
            setBenchmarkProgressValue(Math.min(100, (progress.completedRuns / progress.totalRuns) * 100));
          }
        }
      );

      const sorted = sortResults(benchmarkResults);
      setResults(sorted);
      setStatusText(`Benchmark complete. ${sorted.length} cases measured.`);
      setBenchmarkProgressValue(100);
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

  /**
   * Signals cooperative stop to active benchmark run.
   */
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
      <SpotlightBackground className="opacity-75" />
      <GradientOverlay className="opacity-90" />
      <div className="pointer-events-none absolute inset-0 bg-grid-noise [background-size:22px_22px] opacity-20" />
      <TopNavbar title="Benchmark Lab" subtitle="Algorithm benchmarking and stress testing workspace." />

      <main className="relative z-10 mx-auto flex w-full max-w-[1800px] flex-col gap-4 px-4 py-4 sm:px-6 lg:gap-5 lg:px-8 lg:py-6">
        <TooltipProvider>
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "benchmark" | "stress")} className="space-y-4">
            <Card className="relative overflow-hidden border-primary/30 bg-gradient-to-br from-primary/15 via-background/95 to-background/60 shadow-[0_18px_42px_rgba(3,9,30,0.45)]">
              <GradientOverlay className="opacity-70" />
              <CardContent className="relative flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="space-y-1">
                  <p className="text-sm font-semibold tracking-tight">Performance Testing Workspace</p>
                  <p className="text-xs text-muted-foreground">Switch between benchmark sweeps and stress diagnostics.</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="hidden items-center gap-1.5 lg:flex">
                    <Button asChild variant="outline" size="sm">
                      <Link href="/">Open Solver</Link>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <Link href="/challenges">Open Challenge Lab</Link>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <Link href="/insights">Open Insights</Link>
                    </Button>
                  </div>
                  <TabsList className="grid w-[300px] grid-cols-2 border-primary/20 bg-background/55 backdrop-blur-sm">
                    <TabsTrigger value="benchmark" className="font-medium">
                      Benchmark
                    </TabsTrigger>
                    <TabsTrigger value="stress" className="font-medium">
                      Stress Test
                    </TabsTrigger>
                  </TabsList>
                  <Badge variant="outline" className="gap-2 border-primary/35 bg-background/55 backdrop-blur-sm">
                    <StatusPulse tone={isRunning || isStressRunning ? "cyan" : "amber"} />
                    {isRunning || isStressRunning ? "Running" : "Idle"}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <TabsContent value="benchmark" className="mt-0 space-y-4">
              <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
        >
          <BenchmarkConfigPanel>
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary">
                <FlaskConical className="h-4 w-4" />
                <span className="mono text-xs uppercase tracking-[0.16em]">Benchmark Lab</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Compare fastest-first objective vs all-solutions objective across classic, optimized, bitmask, and parallel solvers.
              </p>
              <GlowBorder intensity="low" className="rounded-xl bg-background/25 p-0.5">
                <div className="rounded-[11px] border border-border/50 bg-background/30 p-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Configuration Matrix</p>
                </div>
              </GlowBorder>
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
                  <ToggleGroup
                    type="single"
                    value={mode}
                    onValueChange={(value) => {
                      if (value === "first" || value === "all") {
                        setMode(value);
                      }
                    }}
                    variant="outline"
                    size="sm"
                    disabled={isRunning || isStressRunning}
                    className="justify-start"
                  >
                    <ToggleGroupItem value="first">First Solution</ToggleGroupItem>
                    <ToggleGroupItem value="all">All Solutions</ToggleGroupItem>
                  </ToggleGroup>
                </div>

                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.13em] text-muted-foreground">Number of Runs</p>
                  <Select
                    value={String(runs)}
                    onValueChange={(value) => setRuns(Math.max(1, Math.min(20, Number(value) || 1)))}
                    disabled={isRunning || isStressRunning}
                  >
                    <SelectTrigger className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 5, 8, 10, 15, 20].map((count) => (
                        <SelectItem key={count} value={String(count)}>
                          {count} run{count === 1 ? "" : "s"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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

              <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border/60 bg-background/30 p-2.5">
                <Button className="gap-2" onClick={handleStart} disabled={isRunning || isStressRunning}>
                  <PlayCircle className="h-4 w-4" />
                  Run Benchmark
                </Button>
                <Button variant="secondary" className="gap-2" onClick={handleStop} disabled={!isRunning}>
                  <Square className="h-4 w-4" />
                  Stop
                </Button>
                <Badge variant="outline" className="border-primary/35 bg-background/60">
                  {statusText}
                </Badge>
                {progressText && (
                  <Badge variant="secondary" className="bg-secondary/70">
                    {progressText}
                  </Badge>
                )}
              </div>

              <div className="rounded-xl border border-border/60 bg-background/35 p-3">
                <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Run State</span>
                  <span>{isRunning ? `${benchmarkProgressValue.toFixed(0)}%` : "Ready"}</span>
                </div>
                <Progress value={isRunning ? benchmarkProgressValue : 0} indicatorClassName="bg-gradient-to-r from-cyan-400 via-primary to-blue-500" />
              </div>
            </div>
          </BenchmarkConfigPanel>
              </motion.section>
            </TabsContent>

            <TabsContent value="stress" className="mt-0 space-y-4">
              <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.06 }}
        >
          <StressTestPanel>
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary">
                <Flame className="h-4 w-4" />
                <span className="mono text-xs uppercase tracking-[0.16em]">Stress Test Mode</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Sweep board sizes under a time budget to find your maximum solved N and peak runtime characteristics.
              </p>
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
                  <ToggleGroup
                    type="single"
                    value={stressSolveTarget}
                    onValueChange={(value) => {
                      if (value === "first" || value === "all") {
                        setStressSolveTarget(value);
                      }
                    }}
                    variant="outline"
                    size="sm"
                    disabled={isStressRunning || isRunning}
                    className="justify-start"
                  >
                    <ToggleGroupItem value="first">First Solution</ToggleGroupItem>
                    <ToggleGroupItem value="all">All Solutions</ToggleGroupItem>
                  </ToggleGroup>
                </div>

                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.13em] text-muted-foreground">Board Size Range</p>
                  <div className="flex items-center gap-2">
                    <Select
                      value={String(stressMinBoard)}
                      onValueChange={(value) => setStressMinBoard(Number(value) as BoardSize)}
                      disabled={isStressRunning || isRunning}
                    >
                      <SelectTrigger className="w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SUPPORTED_BOARD_SIZES.map((size) => (
                          <SelectItem key={`stress-min-${size}`} value={String(size)}>
                            {size}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span className="text-sm text-muted-foreground">to</span>
                    <Select
                      value={String(stressMaxBoard)}
                      onValueChange={(value) => setStressMaxBoard(Number(value) as BoardSize)}
                      disabled={isStressRunning || isRunning}
                    >
                      <SelectTrigger className="w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SUPPORTED_BOARD_SIZES.map((size) => (
                          <SelectItem key={`stress-max-${size}`} value={String(size)}>
                            {size}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.13em] text-muted-foreground">Time Limit (seconds)</p>
                  <Select
                    value={String(stressTimeLimitSeconds)}
                    onValueChange={(value) => setStressTimeLimitSeconds(Number(value) || 2)}
                    disabled={isStressRunning || isRunning}
                  >
                    <SelectTrigger className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[5, 10, 15, 20, 30, 45, 60, 90, 120, 180, 240, 300].map((seconds) => (
                        <SelectItem key={seconds} value={String(seconds)}>
                          {seconds}s
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <p className="text-xs uppercase tracking-[0.13em] text-muted-foreground">Parallel Workers</p>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge variant="outline" className="h-5 cursor-help px-1.5 text-[10px]">
                          i
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>Manual worker count is used only when Parallel Solver is selected.</TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <ToggleGroup
                      type="single"
                      value={stressWorkerMode}
                      onValueChange={(value) => {
                        if (value === "auto" || value === "manual") {
                          setStressWorkerMode(value);
                        }
                      }}
                      variant="outline"
                      size="sm"
                      disabled={isStressRunning || isRunning || stressAlgorithm !== "parallel"}
                      className="justify-start"
                    >
                      <ToggleGroupItem value="auto">Auto</ToggleGroupItem>
                      <ToggleGroupItem value="manual">Manual</ToggleGroupItem>
                    </ToggleGroup>
                    <Select
                      value={String(stressWorkerCount)}
                      onValueChange={(value) => setStressWorkerCount(Number(value) || 1)}
                      disabled={
                        isStressRunning || isRunning || stressAlgorithm !== "parallel" || stressWorkerMode !== "manual"
                      }
                    >
                      <SelectTrigger className="w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 16 }, (_, index) => index + 1).map((workers) => (
                          <SelectItem key={workers} value={String(workers)}>
                            {workers}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border/60 bg-background/30 p-2.5">
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
                    setStressProgressValue(0);
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
                            const minBoard = Math.min(min, max);
                            const maxBoard = Math.max(min, max);
                            const span = Math.max(1, maxBoard - minBoard + 1);
                            const completed = progress.currentBoardSize - minBoard + 1;
                            setStressProgressValue(Math.min(100, Math.max(0, (completed / span) * 100)));
                          }
                        }
                      );
                      setStressResult(result);
                      setStressStatusText(result.reachedTimeLimit ? "Time limit reached." : "Stress test completed.");
                      setStressProgressValue(100);
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

                <Badge variant="outline" className="border-primary/35 bg-background/60">
                  {stressStatusText}
                </Badge>
                {stressProgressText && (
                  <Badge variant="secondary" className="bg-secondary/70">
                    {stressProgressText}
                  </Badge>
                )}
              </div>

              <div className="rounded-xl border border-border/60 bg-background/35 p-3">
                <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Live Test State</span>
                  <span>{isStressRunning ? `${stressProgressValue.toFixed(0)}%` : "Ready"}</span>
                </div>
                <Progress
                  value={isStressRunning ? stressProgressValue : 0}
                  indicatorClassName="bg-gradient-to-r from-emerald-400 via-cyan-400 to-primary"
                />
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
                    <article className="rounded-lg border border-border/60 bg-background/35 p-3">
                      <p className="text-xs text-muted-foreground">Estimated Speedup</p>
                      <p className="text-lg font-semibold">{`${Math.max(1, stressResult.averageNodesPerSecond / 1000).toFixed(2)}x`}</p>
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

                  <ScrollArea className="h-[280px] rounded-lg border border-border/60">
                    <Table className="min-w-[900px]">
                      <TableHeader className="bg-background/40">
                        <TableRow>
                          <TableHead>N</TableHead>
                          <TableHead>Solved</TableHead>
                          <TableHead>Timed Out</TableHead>
                          <TableHead>Elapsed</TableHead>
                          <TableHead>Nodes</TableHead>
                          <TableHead>Backtracks</TableHead>
                          <TableHead>Branches Pruned</TableHead>
                          <TableHead>Solutions</TableHead>
                          <TableHead>Workers Used</TableHead>
                          <TableHead>Peak Active Workers</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {stressResult.steps.map((step) => (
                          <TableRow key={`stress-step-${step.boardSize}`}>
                            <TableCell>{step.boardSize}</TableCell>
                            <TableCell>{step.solved ? "Yes" : "No"}</TableCell>
                            <TableCell>{step.timedOut ? "Yes" : "No"}</TableCell>
                            <TableCell>{formatMs(step.elapsedMs)}</TableCell>
                            <TableCell>{formatInteger(step.recursiveCalls)}</TableCell>
                            <TableCell>{formatInteger(step.backtracks)}</TableCell>
                            <TableCell>{formatInteger(step.branchesPruned)}</TableCell>
                            <TableCell>{formatInteger(step.solutionsFound)}</TableCell>
                            <TableCell>{step.workersUsed || "-"}</TableCell>
                            <TableCell>{step.peakActiveWorkers || "-"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </div>
              )}
            </div>
          </StressTestPanel>
              </motion.section>
            </TabsContent>

            <TabsContent value="benchmark" className="mt-0 space-y-4">
              <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.08 }}
        >
          <BenchmarkResultsTable>
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary">
                <BarChart3 className="h-4 w-4" />
                <span className="mono text-xs uppercase tracking-[0.16em]">Results</span>
              </div>
              <p className="text-xs text-muted-foreground">Solve time, recursive calls, backtracks, pruning, speedup ratio, and solutions found.</p>
              {results.length === 0 && (
                <div className="glass-elevated rounded-xl p-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <p className="text-sm font-medium">No benchmark results yet</p>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">Configure test matrix and start a run to populate analytics.</p>
                  {isRunning && (
                    <div className="mt-3 grid gap-2">
                      <Skeleton className="h-9 w-full" />
                      <Skeleton className="h-9 w-[85%]" />
                      <Skeleton className="h-9 w-[70%]" />
                    </div>
                  )}
                </div>
              )}

              {results.length > 0 && (
                <>
                  <ScrollArea className="h-[320px] rounded-xl border border-border/60 bg-background/25">
                    <Table className="min-w-[1100px]">
                      <TableHeader className="bg-background/40">
                        <TableRow>
                          <TableHead>Algorithm</TableHead>
                          <TableHead>Board</TableHead>
                          <TableHead>Mode</TableHead>
                          <TableHead>Avg Time</TableHead>
                          <TableHead>Best Time</TableHead>
                          <TableHead>Recursive Calls</TableHead>
                          <TableHead>Backtracks</TableHead>
                          <TableHead>Branches Pruned</TableHead>
                          <TableHead>Solutions Found</TableHead>
                          <TableHead>Speedup vs Classic</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {results.map((result) => {
                          const classic = baselineByBoardSize.get(result.boardSize);
                          const speedup = classic && result.averageElapsedMs > 0 ? classic / result.averageElapsedMs : null;

                          return (
                            <TableRow key={`${result.algorithm}-${result.boardSize}`}>
                              <TableCell className="font-medium">{ALGORITHM_LABELS[result.algorithm]}</TableCell>
                              <TableCell>
                                {result.boardSize} x {result.boardSize}
                              </TableCell>
                              <TableCell className="capitalize">{result.mode}</TableCell>
                              <TableCell>{formatMs(result.averageElapsedMs)}</TableCell>
                              <TableCell>{formatMs(result.bestElapsedMs)}</TableCell>
                              <TableCell>{formatInteger(result.averageRecursiveCalls)}</TableCell>
                              <TableCell>{formatInteger(result.averageBacktracks)}</TableCell>
                              <TableCell>{formatInteger(result.averageBranchesPruned)}</TableCell>
                              <TableCell>{formatInteger(result.averageSolutionsFound)}</TableCell>
                              <TableCell>{speedup ? `${speedup.toFixed(2)}x` : "N/A"}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </ScrollArea>

                  <div className="space-y-3">
                    {[...byBoardSize.entries()].map(([boardSize, entries]) => (
                      <article key={boardSize} className="rounded-xl border border-border/60 bg-background/25 p-3.5">
                        <p className="mb-2 text-sm font-semibold">
                          N = {boardSize} ({mode === "first" ? "First Solution" : "All Solutions"})
                        </p>
                        <div className="space-y-2">
                          {entries.map((entry) => {
                            const width = (entry.averageElapsedMs / maxElapsed) * 100;
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
                                <Progress
                                  value={width}
                                  indicatorClassName="bg-gradient-to-r from-cyan-400 via-primary to-blue-500"
                                />
                              </div>
                            );
                          })}
                        </div>
                      </article>
                    ))}
                  </div>

                  <BenchmarkSummaryCards className="grid gap-2 sm:grid-cols-3">
                    <BenchmarkSummaryCard title="Configured Runs" value={runs} />
                    <BenchmarkSummaryCard title="Symmetry Active" value={symmetryEnabled ? "Yes" : "No"} />
                    <BenchmarkSummaryCard title="Search Strategy" value={SEARCH_STRATEGY_LABELS[searchStrategy]} />
                  </BenchmarkSummaryCards>

                  <p className="text-xs text-muted-foreground">
                    Speedup ratio uses Classic Backtracking as baseline for the same board size. Estimated search reduction from symmetry
                    is approximately {toPercent(symmetryEnabled ? 0.5 : 0)} on large even boards.
                  </p>
                </>
              )}
            </div>
          </BenchmarkResultsTable>
              </motion.section>
            </TabsContent>
          </Tabs>
        </TooltipProvider>
      </main>
    </div>
  );
}
