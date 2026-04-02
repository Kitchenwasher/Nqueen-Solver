import {
  ActivitySquare,
  Binary,
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
import type { AlgorithmPerformanceMap, SolverAnalytics } from "@/types/dashboard";

type InsightsSidebarProps = {
  className?: string;
  analytics: SolverAnalytics;
  performance: AlgorithmPerformanceMap;
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

export function InsightsSidebar({ className, analytics, performance }: InsightsSidebarProps) {
  const progressPercent = Math.min((analytics.searchDepth / Math.max(analytics.boardSize, 1)) * 100, 100);
  const classic = performance.classic;
  const optimized = performance.optimized;

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
                <p className="text-xs text-muted-foreground">Solver Status</p>
                <Cpu className="h-3.5 w-3.5 text-primary" />
              </div>
              <Badge variant="secondary" className="capitalize">
                {prettyStatus(analytics.solverStatus)}
              </Badge>
            </article>

            <article className={compactCardClass}>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Algorithm Comparison</p>
                <Zap className="h-3.5 w-3.5 text-primary" />
              </div>
              {!classic && !optimized && <p className="text-xs text-muted-foreground">Run each algorithm once to compare.</p>}
              {(classic || optimized) && (
                <div className="space-y-1.5 text-xs">
                  <p className="text-muted-foreground">
                    Classic: {classic ? `${formatElapsed(classic.elapsedMs)} | ${classic.recursiveCalls} calls` : "No run yet"}
                  </p>
                  <p className="text-muted-foreground">
                    Optimized: {optimized ? `${formatElapsed(optimized.elapsedMs)} | ${optimized.recursiveCalls} calls` : "No run yet"}
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
