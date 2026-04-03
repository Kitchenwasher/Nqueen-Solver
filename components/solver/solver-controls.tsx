import * as React from "react";

import { cn } from "@/lib/utils";

type SolverControlsProps = {
  className?: string;
  children: React.ReactNode;
};

function SolverControlsComponent({ className, children }: SolverControlsProps) {
  return <div className={cn("space-y-2 rounded-xl border border-border/50 bg-background/35 p-3", className)}>{children}</div>;
}

export const SolverControls = React.memo(SolverControlsComponent);
