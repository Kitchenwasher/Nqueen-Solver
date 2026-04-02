import { Activity, Brain, Clock3, Crown } from "lucide-react";

import { Badge } from "@/components/ui/badge";

export function TopNavbar() {
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
          <Badge variant="secondary" className="gap-1.5 border-primary/20 bg-primary/10 text-primary">
            <Activity className="h-3.5 w-3.5" />
            Solver Live
          </Badge>
          <Badge variant="outline" className="hidden gap-1.5 sm:flex">
            <Brain className="h-3.5 w-3.5" />
            Dual Algorithms
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
