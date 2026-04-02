import { Compass } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type ControlSidebarProps = {
  className?: string;
};

const quickSteps = [
  "Select board size and solver algorithm in the board panel.",
  "Toggle Symmetry Optimization ON to skip mirrored root branches.",
  "Pick a search strategy: Left to Right, Center First, or Heuristic Search.",
  "For Parallel Solver, use Auto Split Depth or Manual Depth (0/1/2) to tune branch fan-out.",
  "Choose Auto-play or Step-by-step for traversal pacing.",
  "Use pruning stats in Insights to measure branches pruned and dead states avoided.",
  "Use Find First or Find All to run the selected strategy.",
  "Inspect analytics and compare Classic, Optimized, and Bitmask runs."
] as const;

export function ControlSidebar({ className }: ControlSidebarProps) {
  return (
    <aside className={className}>
      <Card className="h-full border-border/50 bg-card/70">
        <CardHeader>
          <div className="flex items-center gap-2 text-primary">
            <Compass className="h-4 w-4" />
            <span className="mono text-xs uppercase tracking-[0.16em]">Control Guide</span>
          </div>
          <CardTitle>Runbook</CardTitle>
          <CardDescription>Everything below maps directly to working controls in the center solver panel.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3.5">
          <section className="grid gap-2">
            {quickSteps.map((step, index) => (
              <article key={step} className="rounded-lg border border-border/50 bg-background/30 px-3 py-2.5">
                <p className="text-xs text-muted-foreground">Step {index + 1}</p>
                <p className="mt-1 text-sm text-foreground/90">{step}</p>
              </article>
            ))}
          </section>

        </CardContent>
      </Card>
    </aside>
  );
}
