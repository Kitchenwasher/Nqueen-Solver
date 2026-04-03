"use client";

import { usePathname } from "next/navigation";

import { BenchmarkLabShell } from "@/components/benchmark/benchmark-lab-shell";
import { ChallengeLabShell } from "@/components/challenges/challenge-lab-shell";
import { AboutPageShell } from "@/components/about/about-page-shell";
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

function matchesAbout(pathname: string | null) {
  return pathname?.startsWith("/about") ?? false;
}

export function PersistentLabsHost() {
  const pathname = usePathname();
  const resolvedPathname = pathname ?? "/";
  const knownLabRoute =
    matchesDashboard(resolvedPathname) ||
    matchesBenchmark(resolvedPathname) ||
    matchesChallenges(resolvedPathname) ||
    matchesInsights(resolvedPathname) ||
    matchesAbout(resolvedPathname);

  if (!knownLabRoute) {
    return null;
  }

  return (
    <div className="min-h-screen">
      <div className={cn(matchesDashboard(resolvedPathname) ? "block" : "hidden")}>
        <DashboardShell isVisible={matchesDashboard(resolvedPathname)} />
      </div>

      <div className={cn(matchesBenchmark(resolvedPathname) ? "block" : "hidden")}>
        <BenchmarkLabShell isVisible={matchesBenchmark(resolvedPathname)} />
      </div>

      <div className={cn(matchesChallenges(resolvedPathname) ? "block" : "hidden")}>
        <ChallengeLabShell isVisible={matchesChallenges(resolvedPathname)} />
      </div>

      <div className={cn(matchesInsights(resolvedPathname) ? "block" : "hidden")}>
        <InsightsPageShell isVisible={matchesInsights(resolvedPathname)} />
      </div>

      <div className={cn(matchesAbout(resolvedPathname) ? "block" : "hidden")}>
        <AboutPageShell isVisible={matchesAbout(resolvedPathname)} />
      </div>
    </div>
  );
}
