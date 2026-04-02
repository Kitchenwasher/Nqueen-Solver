import { Sparkles } from "lucide-react";

import { GlowCard } from "@/components/shared/glow-card";

type EmptyStateProps = {
  title: string;
  description: string;
};

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <GlowCard className="rounded-xl p-4">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <p className="text-sm font-medium">{title}</p>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
    </GlowCard>
  );
}
