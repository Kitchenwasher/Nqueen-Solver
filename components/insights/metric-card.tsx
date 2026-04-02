import * as React from "react";

import { GlowCard } from "@/components/shared/glow-card";
import { SectionHeader } from "@/components/shared/section-header";

type MetricCardProps = {
  label: string;
  value: React.ReactNode;
  hint?: string;
};

export function MetricCard({ label, value, hint }: MetricCardProps) {
  return (
    <GlowCard>
      <div className="space-y-1 p-3">
        <SectionHeader title={label} description={hint} />
        <p className="text-lg font-semibold">{value}</p>
      </div>
    </GlowCard>
  );
}
