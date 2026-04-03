"use client";

import Link from "next/link";
import { useEffect } from "react";
import { DashboardAppShell } from "@/components/dashboard/dashboard-app-shell";
import { InsightsRail } from "@/components/insights/insights-rail";
import { Button } from "@/components/ui/button";
import { initializeSolverTelemetryStore, useSolverTelemetrySelector } from "@/lib/solver-telemetry-store";

type InsightsPageShellProps = {
  isVisible?: boolean;
};

export function InsightsPageShell({ isVisible: _isVisible = true }: InsightsPageShellProps) {
  void _isVisible;

  useEffect(() => {
    initializeSolverTelemetryStore();
  }, []);

  const analytics = useSolverTelemetrySelector((snapshot) => snapshot.analytics);
  const performance = useSolverTelemetrySelector((snapshot) => snapshot.performance);
  const strategyPerformance = useSolverTelemetrySelector((snapshot) => snapshot.strategyPerformance);

  return (
    <DashboardAppShell
      page="insights"
      title="Insights Lab"
      subtitle="Expanded analytics workspace with full-width telemetry cards."
      quickActions={
        <div className="hidden items-center gap-1.5 md:flex">
          <Button asChild variant="outline" size="sm">
            <Link href="/">Open Solver</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/benchmark">Open Benchmark</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/challenges">Open Challenge Lab</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/about">Open About</Link>
          </Button>
        </div>
      }
      activeSection="insights"
      onSectionNavigate={() => {
        // Dedicated page: keep sidebar callbacks inert here.
      }}
      solverLiveLabel="Insights Live"
      multiAlgorithmEnabled
    >
      <div id="insights-section" className="w-full max-w-[1200px]">
        <InsightsRail
          analytics={analytics}
          performance={performance}
          strategyPerformance={strategyPerformance}
          fullPage
        />
      </div>
    </DashboardAppShell>
  );
}
