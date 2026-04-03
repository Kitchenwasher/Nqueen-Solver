"use client";

import Link from "next/link";

import { ChessboardPanel } from "@/components/dashboard/chessboard-panel";
import { DashboardAppShell } from "@/components/dashboard/dashboard-app-shell";
import { Button } from "@/components/ui/button";

type ChallengeLabShellProps = {
  isVisible?: boolean;
};

export function ChallengeLabShell({ isVisible = true }: ChallengeLabShellProps) {
  return (
    <DashboardAppShell
      page="challenges"
      title="Challenge Lab"
      subtitle="Dedicated workspace for objective, constraints, challenge generation, and advanced controls."
      showFocusToggle={false}
      multiAlgorithmEnabled
      quickActions={
        <div className="hidden items-center gap-1.5 md:flex">
          <Button asChild variant="outline" size="sm">
            <Link href="/">Open Solver</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/benchmark">Open Benchmark</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/insights">Open Insights</Link>
          </Button>
        </div>
      }
      activeSection="challenges"
      onSectionNavigate={() => {
        // Dedicated page: section-jump callbacks are intentionally no-op here.
      }}
      solverLiveLabel="Challenge Live"
    >
      <div className="mx-auto w-full max-w-[1280px]">
        <ChessboardPanel defaultAdvancedOpen surface="challenge" isVisible={isVisible} />
      </div>
    </DashboardAppShell>
  );
}
