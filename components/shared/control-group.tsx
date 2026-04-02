import * as React from "react";

import { GlowCard } from "@/components/shared/glow-card";
import { SectionHeader } from "@/components/shared/section-header";

type ControlGroupProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
  rightSlot?: React.ReactNode;
  className?: string;
};

export function ControlGroup({ title, description, rightSlot, children, className }: ControlGroupProps) {
  return (
    <GlowCard className={className}>
      <div className="space-y-3 p-3">
        <SectionHeader title={title} description={description} rightSlot={rightSlot} />
        {children}
      </div>
    </GlowCard>
  );
}
