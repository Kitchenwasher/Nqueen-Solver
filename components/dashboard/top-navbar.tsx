"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, Brain, Clock3, Crown, FlaskConical, Theater } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type TopNavbarProps = {
  showFocusToggle?: boolean;
  focusMode?: boolean;
  onToggleFocusMode?: () => void;
};

export function TopNavbar({ showFocusToggle = false, focusMode = false, onToggleFocusMode }: TopNavbarProps) {
  const pathname = usePathname();
  const isBenchmark = pathname?.startsWith("/benchmark");

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-[1800px] items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl border border-primary/30 bg-primary/15 text-primary shadow-glow">
            <Crown className="h-5 w-5" />
          </div>
          <div>
            <p className="mono text-xs uppercase tracking-[0.2em] text-primary/80">QueenMind</p>
            <h1 className="text-lg font-semibold sm:text-xl [font-family:var(--font-space-grotesk)]">
              N-Queen Visual Solver
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {showFocusToggle && (
            <button
              type="button"
              onClick={onToggleFocusMode}
              className={cn(
                buttonVariants({ variant: focusMode ? "default" : "outline", size: "sm" }),
                "gap-1.5"
              )}
            >
              <Theater className="h-3.5 w-3.5" />
              {focusMode ? "Exit Focus" : "Focus Mode"}
            </button>
          )}
          <Link href="/" className={cn(buttonVariants({ variant: isBenchmark ? "outline" : "default", size: "sm" }))}>
            Solver
          </Link>
          <Link
            href="/benchmark"
            className={cn(buttonVariants({ variant: isBenchmark ? "default" : "outline", size: "sm" }), "gap-1.5")}
          >
            <FlaskConical className="h-3.5 w-3.5" />
            Benchmark Lab
          </Link>
          <Badge variant="secondary" className="gap-1.5 border-primary/20 bg-primary/10 text-primary">
            <Activity className="h-3.5 w-3.5" />
            {isBenchmark ? "Benchmark Live" : "Solver Live"}
          </Badge>
          <Badge variant="outline" className="hidden gap-1.5 sm:flex">
            <Brain className="h-3.5 w-3.5" />
            Multi-Algorithm
          </Badge>
          <Badge variant="outline" className="hidden gap-1.5 md:flex">
            <Clock3 className="h-3.5 w-3.5" />
            Interactive Mode
          </Badge>
        </div>
      </div>
    </header>
  );
}
