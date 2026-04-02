import * as React from "react";

import { GlowCard } from "@/components/shared/glow-card";

type BenchmarkSummaryCardsProps = {
  children: React.ReactNode;
  className?: string;
};

export function BenchmarkSummaryCards({ children, className }: BenchmarkSummaryCardsProps) {
  return <div className={className}>{children}</div>;
}

export function BenchmarkSummaryCard({ title, value }: { title: string; value: React.ReactNode }) {
  return (
    <GlowCard className="border-border/70 bg-background/35">
      <div className="p-4">
        <p className="text-xs text-muted-foreground">{title}</p>
        <p className="mt-1 text-lg font-semibold">{value}</p>
      </div>
    </GlowCard>
  );
}
