"use client";

import { usePathname } from "next/navigation";

import { BenchmarkLabShell } from "@/components/benchmark/benchmark-lab-shell";
import { ChallengeLabShell } from "@/components/challenges/challenge-lab-shell";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { InsightsPageShell } from "@/components/insights/insights-page-shell";
import { cn } from "@/lib/utils";

function matchesDashboard(pathname: string | null) {
  return pathname === "/";
}

function matchesBenchmark(pathname: string | null) {
  return pathname?.startsWith("/benchmark") ?? false;
}

function matchesChallenges(pathname: string | null) {
  return pathname?.startsWith("/challenges") ?? false;
}

function matchesInsights(pathname: string | null) {
  return pathname?.startsWith("/insights") ?? false;
}

export function PersistentLabsHost() {
  const pathname = usePathname();
  const knownLabRoute =
    matchesDashboard(pathname) || matchesBenchmark(pathname) || matchesChallenges(pathname) || matchesInsights(pathname);

  if (!knownLabRoute) {
    return null;
  }

  return (
    <div className="min-h-screen">
      <div className={cn(matchesDashboard(pathname) ? "block" : "hidden")}>
        <DashboardShell />
      </div>

      <div className={cn(matchesBenchmark(pathname) ? "block" : "hidden")}>
        <BenchmarkLabShell />
      </div>

      <div className={cn(matchesChallenges(pathname) ? "block" : "hidden")}>
        <ChallengeLabShell />
      </div>

      <div className={cn(matchesInsights(pathname) ? "block" : "hidden")}>
        <InsightsPageShell />
      </div>
    </div>
  );
}

