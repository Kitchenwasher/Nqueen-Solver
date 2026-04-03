"use client";

import { memo, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

import { ChessboardPanel } from "@/components/dashboard/chessboard-panel";
import { ControlSidebar } from "@/components/dashboard/control-sidebar";
import { DashboardAppShell } from "@/components/dashboard/dashboard-app-shell";
import { EducationPanel } from "@/components/dashboard/education-panel";
import { InsightsRail } from "@/components/insights/insights-rail";
import { Button } from "@/components/ui/button";
import {
  initializeSolverTelemetryStore,
  setSolverTelemetrySnapshot,
  useSolverTelemetrySelector
} from "@/lib/solver-telemetry-store";
import type { AlgorithmPerformanceMap, SolverAnalytics, StrategyPerformanceMap } from "@/types/dashboard";

const sectionIdToKey = {
  "solver-section": "solver",
  "challenges-section": "challenges",
  "learn-section": "learn",
  "insights-section": "insights",
  "settings-section": "settings"
} as const;

type DashboardSection = (typeof sectionIdToKey)[keyof typeof sectionIdToKey];

type DashboardShellProps = {
  isVisible?: boolean;
};

export function DashboardShell({ isVisible = true }: DashboardShellProps) {
  const [focusMode, setFocusMode] = useState(false);
  const [activeSection, setActiveSection] = useState<DashboardSection>("solver");

  useEffect(() => {
    initializeSolverTelemetryStore();
  }, []);

  const handleAnalyticsChange = useCallback(
    (
    nextAnalytics: SolverAnalytics,
    nextPerformance: AlgorithmPerformanceMap,
    nextStrategyPerformance: StrategyPerformanceMap
  ) => {
    setSolverTelemetrySnapshot({
      analytics: nextAnalytics,
      performance: nextPerformance,
      strategyPerformance: nextStrategyPerformance
    });
  },
    []
  );

  const handleSectionNavigate = (sectionId: string) => {
    const mapped = sectionIdToKey[sectionId as keyof typeof sectionIdToKey];
    if (mapped) {
      setActiveSection(mapped);
    }

    const node = document.getElementById(sectionId);
    if (node) {
      node.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <DashboardAppShell
      page="solver"
      title="Solver Workspace"
      subtitle="Interactive N-Queen solving, constraints, and visual exploration in one premium lab."
      showFocusToggle
      focusMode={focusMode}
      onToggleFocusMode={() => setFocusMode((current) => !current)}
      quickActions={
        <div className="hidden items-center gap-1.5 md:flex">
          <Button asChild variant="outline" size="sm">
            <Link href="/benchmark">Open Benchmark</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/insights">Open Insights</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/about">Open About</Link>
          </Button>
        </div>
      }
      activeSection={activeSection}
      onSectionNavigate={handleSectionNavigate}
      solverLiveLabel={focusMode ? "Focus Solve Live" : "Solver Live"}
      rightPanel={
        <div id="insights-section" className="h-full">
          <DashboardInsightsPanel />
        </div>
      }
    >
      <div className={focusMode ? "space-y-3" : "space-y-4"}>
        <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.34, ease: "easeOut" }}>
          <ChessboardPanel onAnalyticsChange={handleAnalyticsChange} focusMode={focusMode} isVisible={isVisible} />
        </motion.section>

        {!focusMode && (
          <motion.section
            id="learn-section"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.44, ease: "easeOut", delay: 0.06 }}
          >
            <EducationPanel />
          </motion.section>
        )}

        {!focusMode && (
          <motion.section
            id="settings-section"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.38, ease: "easeOut", delay: 0.03 }}
          >
            <ControlSidebar />
          </motion.section>
        )}
      </div>
    </DashboardAppShell>
  );
}

const DashboardInsightsPanel = memo(function DashboardInsightsPanel() {
  const analytics = useSolverTelemetrySelector((snapshot) => snapshot.analytics);
  const performance = useSolverTelemetrySelector((snapshot) => snapshot.performance);
  const strategyPerformance = useSolverTelemetrySelector((snapshot) => snapshot.strategyPerformance);

  return (
    <InsightsRail
      analytics={analytics}
      performance={performance}
      strategyPerformance={strategyPerformance}
      className="h-full"
      visibleSections="primary"
    />
  );
});
