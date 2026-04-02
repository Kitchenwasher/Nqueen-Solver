import * as React from "react";

import { cn } from "@/lib/utils";

type SolverPlaybackBarProps = {
  className?: string;
  children: React.ReactNode;
};

export function SolverPlaybackBar({ className, children }: SolverPlaybackBarProps) {
  return <div className={cn("rounded-lg border border-border/60 bg-background/35 p-2.5", className)}>{children}</div>;
}
