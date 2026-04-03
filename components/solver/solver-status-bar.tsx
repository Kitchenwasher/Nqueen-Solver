import * as React from "react";

import { cn } from "@/lib/utils";

type SolverStatusBarProps = {
  className?: string;
  children: React.ReactNode;
};

function SolverStatusBarComponent({ className, children }: SolverStatusBarProps) {
  return <div className={cn("flex flex-wrap gap-2", className)}>{children}</div>;
}

export const SolverStatusBar = React.memo(SolverStatusBarComponent);
