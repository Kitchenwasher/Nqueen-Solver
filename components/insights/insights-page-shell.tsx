"use client";

import Link from "next/link";
import { useEffect, useSyncExternalStore } from "react";
import { DashboardAppShell } from "@/components/dashboard/dashboard-app-shell";
import { InsightsRail } from "@/components/insights/insights-rail";
import { Button } from "@/components/ui/button";
import {
  getSolverTelemetrySnapshot,
  initializeSolverTelemetryStore,
  subscribeSolverTelemetry
} from "@/lib/solver-telemetry-store";

export function InsightsPageShell() {
  useEffect(() => {
    initializeSolverTelemetryStore();
  }, []);

  const telemetry = useSyncExternalStore(
    subscribeSolverTelemetry,
    getSolverTelemetrySnapshot,
    getSolverTelemetrySnapshot
  );

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
          analytics={telemetry.analytics}
          performance={telemetry.performance}
          strategyPerformance={telemetry.strategyPerformance}
          fullPage
        />
      </div>
    </DashboardAppShell>
  );
}
