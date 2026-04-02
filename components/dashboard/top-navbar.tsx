"use client";

import type { ReactNode } from "react";
import { Activity, Brain, Cpu, Menu, Theater, Zap } from "lucide-react";

import { StatusPulse } from "@/components/effects/status-pulse";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type TopNavbarProps = {
  title: string;
  subtitle: string;
  showFocusToggle?: boolean;
  focusMode?: boolean;
  onToggleFocusMode?: () => void;
  onOpenNavigation?: () => void;
  quickActions?: ReactNode;
  solverLiveLabel?: string;
  multiAlgorithmEnabled?: boolean;
  className?: string;
  hardwareLabel?: string;
};

export function TopNavbar({
  title,
  subtitle,
  showFocusToggle = false,
  focusMode = false,
  onToggleFocusMode,
  onOpenNavigation,
  quickActions,
  solverLiveLabel = "Solver Live",
  multiAlgorithmEnabled = true,
  className,
  hardwareLabel
}: TopNavbarProps) {
  return (
    <header className={cn("sticky top-0 z-40 border-b border-border/50 bg-slate-950/55 backdrop-blur-2xl", className)}>
      <div className="mx-auto flex w-full max-w-[2100px] items-center justify-between gap-3 px-3 py-3 sm:px-4 lg:px-6">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-xl lg:hidden"
            onClick={onOpenNavigation}
            aria-label="Open navigation"
          >
            <Menu className="h-4 w-4" />
          </Button>

          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-primary/35 bg-primary/15 text-primary shadow-[0_0_0_1px_rgba(82,255,232,0.25),0_0_26px_rgba(67,255,235,0.14)]">
            <Zap className="h-4.5 w-4.5" />
          </div>

          <div className="min-w-0">
            <p className="truncate text-[11px] uppercase tracking-[0.2em] text-primary/75 mono">QueenMind</p>
            <h1 className="truncate text-base font-semibold sm:text-lg [font-family:var(--font-space-grotesk)]">{title}</h1>
            <p className="hidden text-xs text-muted-foreground xl:block">{subtitle}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-1.5 sm:gap-2">
          {quickActions}

          {showFocusToggle && (
            <Button
              variant={focusMode ? "default" : "outline"}
              size="sm"
              onClick={onToggleFocusMode}
              className="gap-1.5"
            >
              <Theater className="h-3.5 w-3.5" />
              {focusMode ? "Exit Focus" : "Focus"}
            </Button>
          )}

          <Badge variant="secondary" className="gap-1.5 border-primary/20 bg-primary/10 text-primary">
            <StatusPulse tone="cyan" />
            <Activity className="h-3.5 w-3.5" />
            {solverLiveLabel}
          </Badge>

          <Badge variant="outline" className="hidden gap-1.5 md:flex">
            <Cpu className="h-3.5 w-3.5" />
            {hardwareLabel ?? "Hardware Detecting..."}
          </Badge>

          {multiAlgorithmEnabled && (
            <Badge variant="outline" className="hidden gap-1.5 xl:flex">
              <Brain className="h-3.5 w-3.5" />
              Multi-Algorithm
            </Badge>
          )}
        </div>
      </div>
    </header>
  );
}
