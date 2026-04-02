"use client";

import Link from "next/link";
import { DashboardAppShell } from "@/components/dashboard/dashboard-app-shell";
import { InsightsRail } from "@/components/insights/insights-rail";
import { Button } from "@/components/ui/button";
import type { SolverAnalytics } from "@/types/dashboard";

const initialAnalytics: SolverAnalytics = {
  algorithm: "Classic Backtracking",
  selectedAlgorithm: "classic",
  recursiveCalls: 0,
  backtracks: 0,
  solutionsFound: 0,
  elapsedMs: 0,
  currentRow: null,
  currentColumn: null,
  searchDepth: 0,
  boardSize: 8,
  solverStatus: "idle",
  searchStrategy: "Left to Right",
  selectedSearchStrategy: "left-to-right",
  solvingObjective: "Fastest First Solution",
  selectedSolvingObjective: "fastest-first",
  timeToFirstSolutionMs: null,
  timeToAllSolutionsMs: null,
  firstSolutionPath: null,
  symmetry: {
    enabled: false,
    branchesSkipped: 0,
    estimatedSearchReduction: 0,
    effectiveSpeedup: 1
  },
  pruning: {
    branchesPruned: 0,
    deadStatesDetected: 0,
    estimatedWorkSaved: 0
  }
};

export function InsightsPageShell() {
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
          analytics={initialAnalytics}
          performance={{}}
          strategyPerformance={{}}
          fullPage
        />
      </div>
    </DashboardAppShell>
  );
}
