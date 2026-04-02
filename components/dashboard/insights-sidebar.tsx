import {
  ActivitySquare,
  Binary,
  Bot,
  CircleHelp,
  CornerDownLeft,
  Cpu,
  Gauge,
  Grid2x2,
  Layers3,
  MapPinned,
  Rows3,
  Sigma,
  Timer,
  Zap
} from "lucide-react";
import type { ComponentType } from "react";
import { motion } from "framer-motion";

import { StatusPulse } from "@/components/effects/status-pulse";
import { GradientOverlay } from "@/components/effects/gradient-overlay";
import { HardwareInfoCard } from "@/components/dashboard/hardware-info-card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { AlgorithmPerformanceMap, SolverAnalytics, StrategyPerformanceMap } from "@/types/dashboard";

type InsightsSidebarProps = {
  className?: string;
  analytics: SolverAnalytics;
  performance: AlgorithmPerformanceMap;
  strategyPerformance: StrategyPerformanceMap;
  fullPage?: boolean;
  visibleSections?: "primary" | "all";
};

function formatElapsed(elapsedMs: number) {
  const totalSeconds = Math.floor(elapsedMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const milliseconds = Math.floor((elapsedMs % 1000) / 10);
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}.${milliseconds
    .toString()
    .padStart(2, "0")}`;
}

function prettyStatus(status: string) {
  return status.replace("-", " ");
}

const compactCardClass = "rounded-lg border border-border/50 bg-background/30 p-3";

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function scoreToLabel(score: number) {
  if (score >= 90) {
    return "Excellent";
  }
  if (score >= 75) {
    return "Strong";
  }
  if (score >= 60) {
    return "Good";
  }
  if (score >= 45) {
    return "Fair";
  }
  return "Developing";
}

function MetricHint({ text }: { text: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button type="button" className="text-muted-foreground hover:text-foreground">
          <CircleHelp className="h-3.5 w-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent>{text}</TooltipContent>
    </Tooltip>
  );
}

function CounterTile({ label, value, icon: Icon }: { label: string; value: string | number; icon: ComponentType<{ className?: string }> }) {
  return (
    <article className={compactCardClass}>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[11px] text-muted-foreground">{label}</p>
        <Icon className="h-3.5 w-3.5 text-primary" />
      </div>
      <p className="text-lg font-semibold">{value}</p>
    </article>
  );
}

export function InsightsSidebar({
  className,
  analytics,
  performance,
  strategyPerformance,
  fullPage = false,
  visibleSections = "all"
}: InsightsSidebarProps) {
  const progressPercent = Math.min((analytics.searchDepth / Math.max(analytics.boardSize, 1)) * 100, 100);
  const classic = performance.classic;
  const optimized = performance.optimized;
  const bitmask = performance.bitmask;

  const comparable =
    !!classic &&
    !!optimized &&
    classic.boardSize === optimized.boardSize &&
    classic.boardSize === analytics.boardSize &&
    classic.elapsedMs > 0 &&
    classic.recursiveCalls > 0;

  const speedGain = comparable
    ? ((classic.elapsedMs - optimized.elapsedMs) / Math.max(classic.elapsedMs, 1)) * 100
    : null;
  const recursiveGain = comparable
    ? ((classic.recursiveCalls - optimized.recursiveCalls) / Math.max(classic.recursiveCalls, 1)) * 100
    : null;

  const strategyMetrics = strategyPerformance[analytics.selectedAlgorithm];
  const selectedStrategyMetrics = strategyMetrics?.[analytics.selectedSearchStrategy];
  const strategyOrder = ["left-to-right", "center-first", "heuristic"] as const;
  const strategyLabels: Record<(typeof strategyOrder)[number], string> = {
    "left-to-right": "Left to Right",
    "center-first": "Center First",
    heuristic: "Heuristic Search"
  };
  const currentAlgorithmPerformance = performance[analytics.selectedAlgorithm];
  const baselineClassicForBoard = performance.classic?.boardSize === analytics.boardSize ? performance.classic : undefined;

  const pruningScore = clamp(analytics.pruning.estimatedWorkSaved * 100, 0, 100);
  const speedupScore = baselineClassicForBoard
    ? clamp((baselineClassicForBoard.elapsedMs / Math.max(analytics.elapsedMs, 1)) * 45, 0, 100)
    : 55;
  const utilizationScore =
    analytics.selectedAlgorithm === "parallel" && analytics.parallel
      ? clamp(
          ((analytics.parallel.activeWorkers / Math.max(analytics.parallel.totalWorkers, 1)) * 60 +
            analytics.parallel.loadBalancingEffectiveness * 40),
          0,
          100
        )
      : 65;
  const searchEfficiencyScore =
    currentAlgorithmPerformance && currentAlgorithmPerformance.solutionsFound > 0
      ? clamp(100 - (currentAlgorithmPerformance.recursiveCalls / Math.max(currentAlgorithmPerformance.solutionsFound, 1)) * 0.0005, 0, 100)
      : 60;
  const timeScore = clamp(100 - Math.log10(Math.max(analytics.elapsedMs, 1)) * 25, 0, 100);

  const overallEfficiencyScore = Math.round(
    clamp(pruningScore * 0.22 + speedupScore * 0.22 + utilizationScore * 0.18 + searchEfficiencyScore * 0.2 + timeScore * 0.18, 0, 100)
  );

  const isLive = analytics.solverStatus === "solving" || analytics.solverStatus === "stepping";
  const statusBadgeClass =
    analytics.solverStatus === "solving"
      ? "border-sky-300/30 bg-sky-500/15 text-sky-100"
      : analytics.solverStatus === "paused"
        ? "border-orange-300/35 bg-orange-500/15 text-orange-100"
        : analytics.solverStatus === "solved"
          ? "border-emerald-300/35 bg-emerald-500/15 text-emerald-100"
          : analytics.solverStatus === "failed"
            ? "border-rose-300/35 bg-rose-500/18 text-rose-100"
            : "border-border/60 bg-secondary/40 text-secondary-foreground";

  return (
    <TooltipProvider delayDuration={100}>
      <aside className={cn("relative", className)}>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <Card className="glass-panel relative overflow-hidden border-border/60">
            <GradientOverlay className="opacity-45" />
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-primary">
                  <ActivitySquare className="h-4 w-4" />
                  <span className="mono text-xs uppercase tracking-[0.16em]">Insights</span>
                </div>
                <Badge variant="outline" className="gap-1.5">
                  <StatusPulse tone={isLive ? "cyan" : "emerald"} />
                  {isLive ? "Running" : "Idle"}
                </Badge>
              </div>
              <CardTitle>Analytics Dashboard</CardTitle>
              <CardDescription>Premium, sectioned telemetry for fast decision-making.</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className={cn("pr-1", !fullPage && visibleSections === "all" && "h-[calc(100vh-240px)]")}>
                <div className="space-y-3 pt-1">
              <Card className={cn("border-border/60 bg-background/35 hover-shine hover:translate-y-0", isLive && "glow-border")}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Cpu className="h-4 w-4 text-primary" />
                      <CardTitle className="text-sm">1. Solver Status</CardTitle>
                    </div>
                    <MetricHint text="Current runtime state of the selected solver." />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={cn("capitalize", statusBadgeClass)}>{prettyStatus(analytics.solverStatus)}</Badge>
                    <Badge variant="secondary" className="gap-1.5 border-primary/25 bg-primary/10 text-primary">
                      <Binary className="h-3.5 w-3.5" />
                      {analytics.algorithm}
                    </Badge>
                    {analytics.selectedAlgorithm === "parallel" && <Badge variant="outline">Parallel</Badge>}
                    <Badge variant="outline">Optimized</Badge>
                  </div>
                  <div>
                    <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                      <span>Solver Progress</span>
                      <span className="mono">{progressPercent.toFixed(0)}%</span>
                    </div>
                    <Progress value={progressPercent} indicatorClassName="bg-gradient-to-r from-cyan-300 via-cyan-400 to-primary" />
                  </div>
                  <p className="text-xs text-muted-foreground">Objective: {analytics.solvingObjective}</p>
                </CardContent>
              </Card>

              <Card className="border-border/60 bg-background/35 hover-shine hover:translate-y-0">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Layers3 className="h-4 w-4 text-primary" />
                      <CardTitle className="text-sm">2. Runtime Counters</CardTitle>
                    </div>
                    <MetricHint text="Live counters collected from the active solver run." />
                  </div>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-2">
                  <CounterTile label="Recursive Calls" value={analytics.recursiveCalls} icon={Rows3} />
                  <CounterTile label="Backtracks" value={analytics.backtracks} icon={CornerDownLeft} />
                  <CounterTile label="Solutions Found" value={analytics.solutionsFound} icon={Sigma} />
                  <CounterTile label="Elapsed Time" value={formatElapsed(analytics.elapsedMs)} icon={Timer} />
                  <CounterTile label="Current Row" value={analytics.currentRow ?? "-"} icon={MapPinned} />
                  <CounterTile label="Current Column" value={analytics.currentColumn ?? "-"} icon={MapPinned} />
                  <CounterTile label="Search Depth" value={analytics.searchDepth} icon={Layers3} />
                  <CounterTile label="Board Size" value={`${analytics.boardSize} x ${analytics.boardSize}`} icon={Grid2x2} />
                </CardContent>
              </Card>

              {visibleSections === "all" && (
                <>
              <Card className="border-border/60 bg-background/35 hover-shine hover:translate-y-0">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-primary" />
                      <CardTitle className="text-sm">3. Performance</CardTitle>
                    </div>
                    <MetricHint text="Composite efficiency score from timing, pruning, utilization, and search quality." />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-end justify-between gap-2">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.13em] text-muted-foreground">Solver Efficiency</p>
                      <p className="text-3xl font-semibold leading-none text-primary drop-shadow-[0_0_12px_rgba(90,255,235,0.25)]">
                        {overallEfficiencyScore}
                        <span className="text-base text-muted-foreground">/100</span>
                      </p>
                    </div>
                    <Badge variant="secondary">{scoreToLabel(overallEfficiencyScore)}</Badge>
                  </div>
                  <Progress value={overallEfficiencyScore} indicatorClassName="bg-gradient-to-r from-cyan-400 to-primary" />
                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <p>Pruning: <span className="text-foreground">{scoreToLabel(Math.round(pruningScore))}</span></p>
                    <p>Utilization: <span className="text-foreground">{scoreToLabel(Math.round(utilizationScore))}</span></p>
                    <p>Search Quality: <span className="text-foreground">{scoreToLabel(Math.round(searchEfficiencyScore))}</span></p>
                    <p>Time Score: <span className="text-foreground">{scoreToLabel(Math.round(timeScore))}</span></p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/60 bg-background/35 hover-shine hover:translate-y-0">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Cpu className="h-4 w-4 text-primary" />
                      <CardTitle className="text-sm">4. Hardware Intelligence</CardTitle>
                    </div>
                    <Badge variant="outline">Recommended</Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <HardwareInfoCard currentAlgorithm={analytics.selectedAlgorithm} compactCardClass="rounded-lg border border-border/50 bg-background/20 p-3" />
                </CardContent>
              </Card>

              <Card className="border-border/60 bg-background/35 hover-shine hover:translate-y-0">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bot className="h-4 w-4 text-primary" />
                      <CardTitle className="text-sm">5. Symmetry / Pruning</CardTitle>
                    </div>
                    <Badge variant="outline" className="gap-1.5">{analytics.symmetry.enabled ? "Optimized" : "Standard"}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div className={compactCardClass}>
                      <p className="text-muted-foreground">Symmetry</p>
                      <p className="mt-1 text-sm font-semibold">{analytics.symmetry.enabled ? "Active" : "Inactive"}</p>
                      <p className="text-muted-foreground">Skipped: {analytics.symmetry.branchesSkipped}</p>
                      <p className="text-muted-foreground">Reduction: {(analytics.symmetry.estimatedSearchReduction * 100).toFixed(1)}%</p>
                      <p className="text-muted-foreground">Speedup: {analytics.symmetry.effectiveSpeedup.toFixed(2)}x</p>
                    </div>
                    <div className={compactCardClass}>
                      <p className="text-muted-foreground">Pruning</p>
                      <p className="mt-1 text-sm font-semibold">Work Saved {(analytics.pruning.estimatedWorkSaved * 100).toFixed(1)}%</p>
                      <p className="text-muted-foreground">Pruned: {analytics.pruning.branchesPruned}</p>
                      <p className="text-muted-foreground">Dead states: {analytics.pruning.deadStatesDetected}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/60 bg-background/35 hover-shine hover:translate-y-0">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Gauge className="h-4 w-4 text-primary" />
                      <CardTitle className="text-sm">6. Strategy + 7. Algorithm Comparison</CardTitle>
                    </div>
                    <Badge variant="outline">Comparison</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="strategy" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="strategy">Strategy</TabsTrigger>
                      <TabsTrigger value="algorithm">Algorithm</TabsTrigger>
                    </TabsList>

                    <TabsContent value="strategy" className="space-y-2">
                      <article className={compactCardClass}>
                        <p className="text-xs text-muted-foreground">Selected Strategy</p>
                        <p className="text-sm font-semibold">{analytics.searchStrategy}</p>
                        <p className="text-xs text-muted-foreground">First: {selectedStrategyMetrics?.firstSolutionElapsedMs !== undefined ? formatElapsed(selectedStrategyMetrics.firstSolutionElapsedMs) : "No run yet"}</p>
                        <p className="text-xs text-muted-foreground">All: {selectedStrategyMetrics?.allSolutionsElapsedMs !== undefined ? formatElapsed(selectedStrategyMetrics.allSolutionsElapsedMs) : "No run yet"}</p>
                      </article>
                      {strategyOrder.map((strategy) => {
                        const metrics = strategyMetrics?.[strategy];
                        return (
                          <article key={strategy} className={compactCardClass}>
                            <p className="text-xs text-muted-foreground">{strategyLabels[strategy]}</p>
                            <p className="text-xs">All: {metrics?.allSolutionsElapsedMs !== undefined ? formatElapsed(metrics.allSolutionsElapsedMs) : "N/A"}</p>
                            <p className="text-xs">First: {metrics?.firstSolutionElapsedMs !== undefined ? formatElapsed(metrics.firstSolutionElapsedMs) : "N/A"}</p>
                          </article>
                        );
                      })}
                    </TabsContent>

                    <TabsContent value="algorithm" className="space-y-2">
                      {!classic && !optimized && !bitmask && <p className="text-xs text-muted-foreground">Run each algorithm once to compare.</p>}
                      {(classic || optimized || bitmask) && (
                        <>
                          <article className={compactCardClass}>
                            <p className="text-xs text-muted-foreground">Classic</p>
                            <p className="text-xs">{classic ? `${formatElapsed(classic.elapsedMs)} | ${classic.recursiveCalls} calls` : "No run yet"}</p>
                          </article>
                          <article className={compactCardClass}>
                            <p className="text-xs text-muted-foreground">Optimized</p>
                            <p className="text-xs">{optimized ? `${formatElapsed(optimized.elapsedMs)} | ${optimized.recursiveCalls} calls` : "No run yet"}</p>
                          </article>
                          <article className={compactCardClass}>
                            <p className="text-xs text-muted-foreground">Bitmask</p>
                            <p className="text-xs">{bitmask ? `${formatElapsed(bitmask.elapsedMs)} | ${bitmask.recursiveCalls} calls` : "No run yet"}</p>
                          </article>
                          {comparable && speedGain !== null && recursiveGain !== null && (
                            <article className="rounded-lg border border-emerald-300/25 bg-emerald-500/10 p-3 text-xs text-emerald-100">
                              Optimized is {speedGain.toFixed(1)}% faster and uses {recursiveGain.toFixed(1)}% fewer recursive calls.
                            </article>
                          )}
                        </>
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>

              <Card className="border-border/60 bg-background/35 hover-shine hover:translate-y-0">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bot className="h-4 w-4 text-primary" />
                      <CardTitle className="text-sm">8. Parallel Worker Telemetry</CardTitle>
                    </div>
                    <Badge variant="outline">Parallel</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {analytics.selectedAlgorithm === "parallel" && analytics.parallel ? (
                    <>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <article className={compactCardClass}><p className="text-muted-foreground">Total Workers</p><p className="text-sm font-semibold">{analytics.parallel.totalWorkers}</p></article>
                        <article className={compactCardClass}><p className="text-muted-foreground">Active Workers</p><p className="text-sm font-semibold">{analytics.parallel.activeWorkers}</p></article>
                        <article className={compactCardClass}><p className="text-muted-foreground">Tasks Completed</p><p className="text-sm font-semibold">{analytics.parallel.tasksCompleted}</p></article>
                        <article className={compactCardClass}><p className="text-muted-foreground">Tasks Remaining</p><p className="text-sm font-semibold">{analytics.parallel.tasksRemaining}</p></article>
                        <article className={compactCardClass}><p className="text-muted-foreground">Split Depth Used</p><p className="text-sm font-semibold">{analytics.parallel.splitDepthUsed}</p></article>
                        <article className={compactCardClass}><p className="text-muted-foreground">Task Count</p><p className="text-sm font-semibold">{analytics.parallel.taskCountGenerated}</p></article>
                        <article className={compactCardClass}><p className="text-muted-foreground">Load Balance</p><p className="text-sm font-semibold">{(analytics.parallel.loadBalancingEffectiveness * 100).toFixed(1)}%</p></article>
                      </div>

                      {!!analytics.parallel.workers && analytics.parallel.workers.length > 0 && (
                        <div className="rounded-lg border border-border/50 bg-background/25 p-2">
                          <p className="mb-2 text-xs text-muted-foreground">Live Worker Monitor</p>
                          <div className="space-y-1.5">
                            {analytics.parallel.workers.map((worker) => (
                              <div key={`parallel-worker-${worker.workerId}`} className="rounded-md border border-border/40 bg-background/35 p-2">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="text-xs font-semibold">Worker {worker.workerId}</p>
                                  <Badge
                                    variant="secondary"
                                    className={
                                      worker.status === "active"
                                        ? "border-sky-300/30 bg-sky-500/15 text-sky-100"
                                        : worker.status === "completed"
                                          ? "border-emerald-300/30 bg-emerald-500/15 text-emerald-100"
                                          : "border-border/50 bg-secondary/40 text-muted-foreground"
                                    }
                                  >
                                    {worker.status}
                                  </Badge>
                                </div>
                                <p className="mt-1 text-[11px] text-muted-foreground">Task: {worker.currentTask ?? (worker.status === "completed" ? "Completed task" : "Waiting")}</p>
                                <p className="text-[11px] text-muted-foreground">Duration: {formatElapsed(worker.taskDurationMs)} | Solutions: {worker.solutionsFound}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-xs text-muted-foreground">Switch to Parallel Solver to view worker telemetry.</p>
                  )}
                </CardContent>
              </Card>

              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="advanced-metrics" className="border-border/60 bg-background/35">
                  <AccordionTrigger className="px-3 text-sm">Advanced Metrics</AccordionTrigger>
                  <AccordionContent className="space-y-3 px-3 pb-3">
                    <article className={compactCardClass}>
                      <p className="text-xs text-muted-foreground">Time To First Solution</p>
                      <p className="text-sm font-semibold">{analytics.timeToFirstSolutionMs !== null ? formatElapsed(analytics.timeToFirstSolutionMs) : "No run yet"}</p>
                    </article>
                    <article className={compactCardClass}>
                      <p className="text-xs text-muted-foreground">Time To All Solutions</p>
                      <p className="text-sm font-semibold">{analytics.timeToAllSolutionsMs !== null ? formatElapsed(analytics.timeToAllSolutionsMs) : "No run yet"}</p>
                    </article>
                    <article className={compactCardClass}>
                      <p className="text-xs text-muted-foreground">First Solution Path</p>
                      <p className="text-xs text-foreground">{analytics.firstSolutionPath ?? "No path captured yet"}</p>
                    </article>

                    {analytics.constraints && (
                      <>
                        <Separator />
                        <article className={compactCardClass}>
                          <p className="mb-1 text-xs text-muted-foreground">Constraint Analytics</p>
                          <p className="text-xs">Constraint count: {analytics.constraints.totalCount}</p>
                          <p className="text-xs">Blocked: {analytics.constraints.blockedCount}</p>
                          <p className="text-xs">Forbidden: {analytics.constraints.forbiddenCount}</p>
                          <p className="text-xs">Pre-placed: {analytics.constraints.prePlacedCount}</p>
                          <p className="text-xs">Constrained branch pruning: {analytics.constraints.constrainedBranchesPruned}</p>
                          <p className="text-xs font-semibold capitalize">Result: {analytics.constraints.solvability}</p>
                        </article>
                      </>
                    )}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
                </>
              )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </motion.div>
      </aside>
    </TooltipProvider>
  );
}
