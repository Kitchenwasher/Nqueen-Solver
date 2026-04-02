import * as React from "react";

import { cn } from "@/lib/utils";

type StatusPulseProps = React.HTMLAttributes<HTMLSpanElement> & {
  tone?: "cyan" | "emerald" | "amber" | "rose";
};

const toneMap = {
  cyan: "bg-cyan-300 shadow-[0_0_12px_rgba(103,232,249,0.8)]",
  emerald: "bg-emerald-300 shadow-[0_0_12px_rgba(110,231,183,0.8)]",
  amber: "bg-amber-300 shadow-[0_0_12px_rgba(252,211,77,0.8)]",
  rose: "bg-rose-300 shadow-[0_0_12px_rgba(251,113,133,0.8)]"
} as const;

export function StatusPulse({ className, tone = "cyan", ...props }: StatusPulseProps) {
  return <span className={cn("inline-flex h-2.5 w-2.5 rounded-full status-pulse", toneMap[tone], className)} {...props} />;
}
