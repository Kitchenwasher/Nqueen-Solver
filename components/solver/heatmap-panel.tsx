import * as React from "react";

import { cn } from "@/lib/utils";

type HeatmapPanelProps = {
  className?: string;
  children: React.ReactNode;
};

export function HeatmapPanel({ className, children }: HeatmapPanelProps) {
  return <div className={cn("space-y-3", className)}>{children}</div>;
}
