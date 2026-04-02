"use client";

import { useState } from "react";
import { motion } from "framer-motion";

import { ChessboardPanel } from "@/components/dashboard/chessboard-panel";
import { ControlSidebar } from "@/components/dashboard/control-sidebar";
import { EducationPanel } from "@/components/dashboard/education-panel";
import { InsightsSidebar } from "@/components/dashboard/insights-sidebar";
import { TopNavbar } from "@/components/dashboard/top-navbar";
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

export function DashboardShell() {
  const [analytics, setAnalytics] = useState<SolverAnalytics>(initialAnalytics);
  const [performance, setPerformance] = useState<AlgorithmPerformanceMap>({});
  const [strategyPerformance, setStrategyPerformance] = useState<StrategyPerformanceMap>({});

  const handleAnalyticsChange = (
    nextAnalytics: SolverAnalytics,
    nextPerformance: AlgorithmPerformanceMap,
    nextStrategyPerformance: StrategyPerformanceMap
  ) => {
    setAnalytics(nextAnalytics);
    setPerformance(nextPerformance);
    setStrategyPerformance(nextStrategyPerformance);
  };

  return (
    <div className="relative min-h-screen">
      <div className="pointer-events-none absolute inset-0 bg-grid-noise [background-size:22px_22px] opacity-20" />

      <TopNavbar />

      <main className="relative z-10 mx-auto flex w-full max-w-[1800px] flex-col gap-4 px-4 py-4 sm:px-6 lg:gap-5 lg:px-8 lg:py-6">
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="grid grid-cols-1 gap-4 md:gap-5 xl:grid-cols-[240px_minmax(0,1.5fr)_300px] xl:items-start"
        >
          <ChessboardPanel className="order-1 h-full xl:order-2" onAnalyticsChange={handleAnalyticsChange} />
          <ControlSidebar className="order-2 h-full xl:order-1" />
          <InsightsSidebar
            className="order-3 h-full xl:order-3"
            analytics={analytics}
            performance={performance}
            strategyPerformance={strategyPerformance}
          />
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.12 }}
        >
          <EducationPanel />
        </motion.section>
      </main>
    </div>
  );
}
