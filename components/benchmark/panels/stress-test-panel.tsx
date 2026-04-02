import * as React from "react";

import { SectionCard } from "@/components/app-shell/section-card";

type StressTestPanelProps = {
  children: React.ReactNode;
};

export function StressTestPanel({ children }: StressTestPanelProps) {
  return (
    <SectionCard
      title="Stress Test Configuration"
      description="Push range, target, and worker profile."
      className="border-primary/30 bg-gradient-to-br from-primary/10 via-background/60 to-background/20"
    >
      {children}
    </SectionCard>
  );
}
