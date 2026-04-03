"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

import { ChessboardPanel } from "@/components/dashboard/chessboard-panel";
import { ControlSidebar } from "@/components/dashboard/control-sidebar";
import { DashboardAppShell } from "@/components/dashboard/dashboard-app-shell";
import { EducationPanel } from "@/components/dashboard/education-panel";
import { InsightsRail } from "@/components/insights/insights-rail";
import { Button } from "@/components/ui/button";
import {
  getSolverTelemetrySnapshot,
  initializeSolverTelemetryStore,
  setSolverTelemetrySnapshot
} from "@/lib/solver-telemetry-store";
import type { AlgorithmPerformanceMap, SolverAnalytics, StrategyPerformanceMap } from "@/types/dashboard";

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

const sectionIdToKey = {
  "solver-section": "solver",
  "challenges-section": "challenges",
  "learn-section": "learn",
  "insights-section": "insights",
  "settings-section": "settings"
} as const;

type DashboardSection = (typeof sectionIdToKey)[keyof typeof sectionIdToKey];

export function DashboardShell() {
  const [analytics, setAnalytics] = useState<SolverAnalytics>(initialAnalytics);
  const [performance, setPerformance] = useState<AlgorithmPerformanceMap>({});
  const [strategyPerformance, setStrategyPerformance] = useState<StrategyPerformanceMap>({});
  const [focusMode, setFocusMode] = useState(false);
  const [activeSection, setActiveSection] = useState<DashboardSection>("solver");
  const analyticsCommitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingTelemetryRef = useRef<{
    analytics: SolverAnalytics;
    performance: AlgorithmPerformanceMap;
    strategyPerformance: StrategyPerformanceMap;
  } | null>(null);

  useEffect(() => {
    initializeSolverTelemetryStore();
    const snapshot = getSolverTelemetrySnapshot();
    setAnalytics(snapshot.analytics);
    setPerformance(snapshot.performance);
    setStrategyPerformance(snapshot.strategyPerformance);
  }, []);

  const handleAnalyticsChange = useCallback((
    nextAnalytics: SolverAnalytics,
    nextPerformance: AlgorithmPerformanceMap,
    nextStrategyPerformance: StrategyPerformanceMap
  ) => {
    pendingTelemetryRef.current = {
      analytics: nextAnalytics,
      performance: nextPerformance,
      strategyPerformance: nextStrategyPerformance
    };

    if (analyticsCommitTimerRef.current) {
      return;
    }

    analyticsCommitTimerRef.current = setTimeout(() => {
      analyticsCommitTimerRef.current = null;
      const pending = pendingTelemetryRef.current;
      if (!pending) {
        return;
      }

      setAnalytics(pending.analytics);
      setPerformance(pending.performance);
      setStrategyPerformance(pending.strategyPerformance);
      setSolverTelemetrySnapshot(pending);
    }, 80);
  }, []);

  useEffect(() => {
    return () => {
      if (analyticsCommitTimerRef.current) {
        clearTimeout(analyticsCommitTimerRef.current);
        analyticsCommitTimerRef.current = null;
      }
    };
  }, []);

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
        </div>
      }
      activeSection={activeSection}
      onSectionNavigate={handleSectionNavigate}
      solverLiveLabel={focusMode ? "Focus Solve Live" : "Solver Live"}
      rightPanel={
        <div id="insights-section" className="h-full">
          <InsightsRail
            analytics={analytics}
            performance={performance}
            strategyPerformance={strategyPerformance}
            className="h-full"
            visibleSections="primary"
          />
        </div>
      }
    >
      <div className={focusMode ? "space-y-3" : "space-y-4"}>
        <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.34, ease: "easeOut" }}>
          <ChessboardPanel onAnalyticsChange={handleAnalyticsChange} focusMode={focusMode} />
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
