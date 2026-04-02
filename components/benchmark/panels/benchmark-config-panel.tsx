import * as React from "react";

import { SectionCard } from "@/components/app-shell/section-card";

type BenchmarkConfigPanelProps = {
  children: React.ReactNode;
};

export function BenchmarkConfigPanel({ children }: BenchmarkConfigPanelProps) {
  return (
    <SectionCard
      title="Benchmark Configuration"
      description="Set matrix, objective, and strategy controls."
      className="border-border/60 bg-background/35"
    >
      {children}
    </SectionCard>
  );
}
