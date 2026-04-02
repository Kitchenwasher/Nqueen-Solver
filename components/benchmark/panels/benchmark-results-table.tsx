import * as React from "react";

import { SectionCard } from "@/components/app-shell/section-card";

type BenchmarkResultsTableProps = {
  children: React.ReactNode;
};

export function BenchmarkResultsTable({ children }: BenchmarkResultsTableProps) {
  return (
    <SectionCard
      title="Benchmark Results Table"
      description="Runtime, recursion, pruning, and speedup metrics."
      className="border-border/60 bg-background/30"
    >
      {children}
    </SectionCard>
  );
}
