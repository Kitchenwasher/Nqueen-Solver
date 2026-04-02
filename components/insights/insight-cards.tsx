import * as React from "react";

import { GlowCard } from "@/components/shared/glow-card";

type GenericCardProps = {
  title: string;
  children: React.ReactNode;
};

function makeCard(defaultTitle: string) {
  return function CardComp({ title, children }: GenericCardProps) {
    return (
      <GlowCard>
        <div className="space-y-2 p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{title || defaultTitle}</p>
          {children}
        </div>
      </GlowCard>
    );
  };
}

export const HardwareCard = makeCard("Hardware");
export const RuntimeStatsCard = makeCard("Runtime");
export const ComparisonCard = makeCard("Comparison");
export const WorkerMonitorCard = makeCard("Workers");
