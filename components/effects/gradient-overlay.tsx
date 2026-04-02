import * as React from "react";

import { cn } from "@/lib/utils";

type GradientOverlayProps = React.HTMLAttributes<HTMLDivElement>;

export function GradientOverlay({ className, ...props }: GradientOverlayProps) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(88,224,255,0.12),transparent_34%),radial-gradient(circle_at_80%_0%,rgba(99,255,236,0.09),transparent_40%),radial-gradient(circle_at_80%_80%,rgba(92,128,255,0.13),transparent_50%)]",
        className
      )}
      {...props}
    />
  );
}
