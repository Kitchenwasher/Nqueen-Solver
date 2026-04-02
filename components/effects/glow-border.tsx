import * as React from "react";

import { cn } from "@/lib/utils";

type GlowBorderProps = React.HTMLAttributes<HTMLDivElement> & {
  intensity?: "low" | "medium" | "high";
};

const glowByIntensity = {
  low: "shadow-[0_0_0_1px_rgba(96,255,235,0.16),0_12px_30px_rgba(5,10,35,0.4)]",
  medium: "shadow-[0_0_0_1px_rgba(96,255,235,0.24),0_16px_36px_rgba(5,10,35,0.48)]",
  high: "shadow-[0_0_0_1px_rgba(96,255,235,0.36),0_0_26px_rgba(96,255,235,0.18),0_20px_48px_rgba(5,10,35,0.56)]"
} as const;

export function GlowBorder({ className, intensity = "medium", ...props }: GlowBorderProps) {
  return <div className={cn("rounded-2xl border border-primary/35", glowByIntensity[intensity], className)} {...props} />;
}
