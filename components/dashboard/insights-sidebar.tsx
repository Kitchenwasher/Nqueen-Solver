import {
  ActivitySquare,
  Binary,
  Bot,
  CornerDownLeft,
  Cpu,
  Grid2x2,
  Layers3,
  MapPinned,
  Rows3,
  Sigma,
  Timer,
  Zap
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HardwareInfoCard } from "@/components/dashboard/hardware-info-card";
import type { AlgorithmPerformanceMap, SolverAnalytics, StrategyPerformanceMap } from "@/types/dashboard";

type InsightsSidebarProps = {
  className?: string;
  analytics: SolverAnalytics;
  performance: AlgorithmPerformanceMap;
  strategyPerformance: StrategyPerformanceMap;
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

export function InsightsSidebar({ className, analytics, performance, strategyPerformance }: InsightsSidebarProps) {
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

  return (
    <aside className={className}>
      <Card className="h-full border-border/55 bg-card/72">
        <CardHeader>
          <div className="flex items-center gap-2 text-primary">
            <ActivitySquare className="h-4 w-4" />
            <span className="mono text-xs uppercase tracking-[0.16em]">Insights</span>
          </div>
          <CardTitle>Live Solver Analytics</CardTitle>
          <CardDescription>Compact analytics cards to support board-first focus.</CardDescription>
        </CardHeader>

        <CardContent className="space-y-2.5">
          <div className="grid gap-2">
            <article className={compactCardClass}>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Current Algorithm</p>
                <Binary className="h-3.5 w-3.5 text-primary" />
              </div>
              <p className="text-sm font-semibold">{analytics.algorithm}</p>
            </article>

            <article className={compactCardClass}>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Performance Score</p>
                <Zap className="h-3.5 w-3.5 text-primary" />
              </div>
              <div className="space-y-1 text-xs">
                <p className="text-lg font-semibold">{overallEfficiencyScore}/100</p>
                <p className="text-muted-foreground">Solver Efficiency: {scoreToLabel(overallEfficiencyScore)}</p>
                <p className="text-muted-foreground">Branch Pruning: {scoreToLabel(Math.round(pruningScore))}</p>
                <p className="text-muted-foreground">Parallel Utilization: {scoreToLabel(Math.round(utilizationScore))}</p>
                <p className="text-muted-foreground">Search Quality: {scoreToLabel(Math.round(searchEfficiencyScore))}</p>
              </div>
            </article>

            <article className={compactCardClass}>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Solver Status</p>
                <Cpu className="h-3.5 w-3.5 text-primary" />
              </div>
              <Badge variant="secondary" className="capitalize">
                {prettyStatus(analytics.solverStatus)}
              </Badge>
            </article>

            <HardwareInfoCard currentAlgorithm={analytics.selectedAlgorithm} compactCardClass={compactCardClass} />

            <article className={compactCardClass}>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Symmetry Optimization</p>
                <Bot className="h-3.5 w-3.5 text-primary" />
              </div>
              <div className="space-y-1 text-xs">
                <p className="font-semibold">{analytics.symmetry.enabled ? "Active" : "Inactive"}</p>
                <p className="text-muted-foreground">Branches skipped: {analytics.symmetry.branchesSkipped}</p>
                <p className="text-muted-foreground">
                  Estimated search reduction: {(analytics.symmetry.estimatedSearchReduction * 100).toFixed(1)}%
                </p>
                <p className="text-muted-foreground">Effective speedup: {analytics.symmetry.effectiveSpeedup.toFixed(2)}x</p>
              </div>
            </article>

            <article className={compactCardClass}>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Search Strategy</p>
                <Zap className="h-3.5 w-3.5 text-primary" />
              </div>
              <div className="space-y-1 text-xs">
                <p className="font-semibold">{analytics.searchStrategy}</p>
                <p className="text-muted-foreground">
                  First-solution time:{" "}
                  {selectedStrategyMetrics?.firstSolutionElapsedMs !== undefined
                    ? formatElapsed(selectedStrategyMetrics.firstSolutionElapsedMs)
                    : "No run yet"}
                </p>
                <p className="text-muted-foreground">
                  All-solutions time:{" "}
                  {selectedStrategyMetrics?.allSolutionsElapsedMs !== undefined
                    ? formatElapsed(selectedStrategyMetrics.allSolutionsElapsedMs)
                    : "No run yet"}
                </p>
              </div>
            </article>

            <article className={compactCardClass}>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Solving Objective</p>
                <Timer className="h-3.5 w-3.5 text-primary" />
              </div>
              <div className="space-y-1 text-xs">
                <p className="font-semibold">{analytics.solvingObjective}</p>
                <p className="text-muted-foreground">
                  Time to first solution:{" "}
                  {analytics.timeToFirstSolutionMs !== null ? formatElapsed(analytics.timeToFirstSolutionMs) : "No run yet"}
                </p>
                <p className="text-muted-foreground">
                  Time to all solutions:{" "}
                  {analytics.timeToAllSolutionsMs !== null ? formatElapsed(analytics.timeToAllSolutionsMs) : "No run yet"}
                </p>
                <p className="text-muted-foreground">
                  First solution path: {analytics.firstSolutionPath ?? "No path captured yet"}
                </p>
              </div>
            </article>

            <article className={compactCardClass}>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Dead-State Pruning</p>
                <CornerDownLeft className="h-3.5 w-3.5 text-primary" />
              </div>
              <div className="space-y-1 text-xs">
                <p className="text-muted-foreground">Branches pruned: {analytics.pruning.branchesPruned}</p>
                <p className="text-muted-foreground">Dead states detected: {analytics.pruning.deadStatesDetected}</p>
                <p className="text-muted-foreground">
                  Estimated work saved: {(analytics.pruning.estimatedWorkSaved * 100).toFixed(1)}%
                </p>
              </div>
            </article>

            {analytics.constraints && (
              <article className={compactCardClass}>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">Constraint Analytics</p>
                  <Grid2x2 className="h-3.5 w-3.5 text-primary" />
                </div>
                <div className="space-y-1 text-xs">
                  <p className="text-muted-foreground">Constraint count: {analytics.constraints.totalCount}</p>
                  <p className="text-muted-foreground">Blocked: {analytics.constraints.blockedCount}</p>
                  <p className="text-muted-foreground">Forbidden: {analytics.constraints.forbiddenCount}</p>
                  <p className="text-muted-foreground">Pre-placed: {analytics.constraints.prePlacedCount}</p>
                  <p className="text-muted-foreground">
                    Constrained branch pruning: {analytics.constraints.constrainedBranchesPruned}
                  </p>
                  <p className="font-semibold capitalize">Result: {analytics.constraints.solvability}</p>
                </div>
              </article>
            )}

            <article className={compactCardClass}>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Strategy Time Comparison</p>
                <Timer className="h-3.5 w-3.5 text-primary" />
              </div>
              <div className="space-y-1 text-xs">
                {strategyOrder.map((strategy) => {
                  const metrics = strategyMetrics?.[strategy];
                  return (
                    <p key={strategy} className="text-muted-foreground">
                      {strategyLabels[strategy]}:{" "}
                      {metrics?.allSolutionsElapsedMs !== undefined
                        ? `All ${formatElapsed(metrics.allSolutionsElapsedMs)}`
                        : "All N/A"}
                      {" | "}
                      {metrics?.firstSolutionElapsedMs !== undefined
                        ? `First ${formatElapsed(metrics.firstSolutionElapsedMs)}`
                        : "First N/A"}
                    </p>
                  );
                })}
              </div>
            </article>

            <article className={compactCardClass}>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Algorithm Comparison</p>
                <Zap className="h-3.5 w-3.5 text-primary" />
              </div>
              {!classic && !optimized && !bitmask && (
                <p className="text-xs text-muted-foreground">Run each algorithm once to compare.</p>
              )}
              {(classic || optimized || bitmask) && (
                <div className="space-y-1.5 text-xs">
                  <p className="text-muted-foreground">
                    Classic: {classic ? `${formatElapsed(classic.elapsedMs)} | ${classic.recursiveCalls} calls` : "No run yet"}
                  </p>
                  <p className="text-muted-foreground">
                    Optimized: {optimized ? `${formatElapsed(optimized.elapsedMs)} | ${optimized.recursiveCalls} calls` : "No run yet"}
                  </p>
                  <p className="text-muted-foreground">
                    Bitmask: {bitmask ? `${formatElapsed(bitmask.elapsedMs)} | ${bitmask.recursiveCalls} calls` : "No run yet"}
                  </p>
                  {comparable && speedGain !== null && recursiveGain !== null && (
                    <p className="font-medium text-emerald-200">
                      Optimized is {speedGain.toFixed(1)}% faster and uses {recursiveGain.toFixed(1)}% fewer recursive calls.
                    </p>
                  )}
                </div>
              )}
            </article>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <article className={compactCardClass}>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[11px] text-muted-foreground">Recursive Calls</p>
                <Rows3 className="h-3.5 w-3.5 text-primary" />
              </div>
              <p className="text-lg font-semibold">{analytics.recursiveCalls}</p>
            </article>

            <article className={compactCardClass}>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[11px] text-muted-foreground">Backtracks</p>
                <CornerDownLeft className="h-3.5 w-3.5 text-primary" />
              </div>
              <p className="text-lg font-semibold">{analytics.backtracks}</p>
            </article>

            <article className={compactCardClass}>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[11px] text-muted-foreground">Solutions Found</p>
                <Sigma className="h-3.5 w-3.5 text-primary" />
              </div>
              <p className="text-lg font-semibold">{analytics.solutionsFound}</p>
            </article>

            <article className={compactCardClass}>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[11px] text-muted-foreground">Elapsed Time</p>
                <Timer className="h-3.5 w-3.5 text-primary" />
              </div>
              <p className="text-lg font-semibold">{formatElapsed(analytics.elapsedMs)}</p>
            </article>

            <article className={compactCardClass}>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[11px] text-muted-foreground">Current Row</p>
                <MapPinned className="h-3.5 w-3.5 text-primary" />
              </div>
              <p className="text-lg font-semibold">{analytics.currentRow ?? "-"}</p>
            </article>

            <article className={compactCardClass}>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[11px] text-muted-foreground">Current Column</p>
                <MapPinned className="h-3.5 w-3.5 text-primary" />
              </div>
              <p className="text-lg font-semibold">{analytics.currentColumn ?? "-"}</p>
            </article>

            <article className={compactCardClass}>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[11px] text-muted-foreground">Search Depth</p>
                <Layers3 className="h-3.5 w-3.5 text-primary" />
              </div>
              <p className="text-lg font-semibold">{analytics.searchDepth}</p>
            </article>

            <article className={compactCardClass}>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[11px] text-muted-foreground">Board Size</p>
                <Grid2x2 className="h-3.5 w-3.5 text-primary" />
              </div>
              <p className="text-lg font-semibold">
                {analytics.boardSize} x {analytics.boardSize}
              </p>
            </article>
          </div>

          {analytics.selectedAlgorithm === "parallel" && analytics.parallel && (
            <section className={compactCardClass}>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Parallel Runtime</p>
                <Bot className="h-3.5 w-3.5 text-primary" />
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-md border border-border/50 bg-background/40 p-2">
                  <p className="text-muted-foreground">Total Workers</p>
                  <p className="text-sm font-semibold">{analytics.parallel.totalWorkers}</p>
                </div>
                <div className="rounded-md border border-border/50 bg-background/40 p-2">
                  <p className="text-muted-foreground">Active Workers</p>
                  <p className="text-sm font-semibold">{analytics.parallel.activeWorkers}</p>
                </div>
                <div className="rounded-md border border-border/50 bg-background/40 p-2">
                  <p className="text-muted-foreground">Tasks Completed</p>
                  <p className="text-sm font-semibold">{analytics.parallel.tasksCompleted}</p>
                </div>
                <div className="rounded-md border border-border/50 bg-background/40 p-2">
                  <p className="text-muted-foreground">Tasks Remaining</p>
                  <p className="text-sm font-semibold">{analytics.parallel.tasksRemaining}</p>
                </div>
                <div className="rounded-md border border-border/50 bg-background/40 p-2">
                  <p className="text-muted-foreground">Split Depth Used</p>
                  <p className="text-sm font-semibold">{analytics.parallel.splitDepthUsed}</p>
                </div>
                <div className="rounded-md border border-border/50 bg-background/40 p-2">
                  <p className="text-muted-foreground">Task Count</p>
                  <p className="text-sm font-semibold">{analytics.parallel.taskCountGenerated}</p>
                </div>
                <div className="rounded-md border border-border/50 bg-background/40 p-2">
                  <p className="text-muted-foreground">Load Balance</p>
                  <p className="text-sm font-semibold">{(analytics.parallel.loadBalancingEffectiveness * 100).toFixed(1)}%</p>
                </div>
              </div>

              {!!analytics.parallel.workers && analytics.parallel.workers.length > 0 && (
                <div className="mt-2 rounded-md border border-border/50 bg-background/35 p-2">
                  <p className="mb-2 text-xs text-muted-foreground">Live Worker Monitor</p>
                  <div className="space-y-1.5">
                    {analytics.parallel.workers.map((worker) => (
                      <div
                        key={`parallel-worker-${worker.workerId}`}
                        className="rounded-md border border-border/40 bg-background/40 p-2"
                      >
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
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          Task: {worker.currentTask ?? (worker.status === "completed" ? "Completed task" : "Waiting")}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          Duration: {formatElapsed(worker.taskDurationMs)} | Solutions: {worker.solutionsFound}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          <section className={compactCardClass}>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Solver Progress</p>
              <p className="mono text-[10px] text-muted-foreground">{progressPercent.toFixed(0)}%</p>
            </div>
            <div className="h-2 w-full rounded-full bg-secondary/70">
              <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${progressPercent}%` }} />
            </div>
          </section>
        </CardContent>
      </Card>
    </aside>
  );
}
