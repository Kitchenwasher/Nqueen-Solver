import * as React from "react";

import { cn } from "@/lib/utils";

type AnimatedGridBackgroundProps = React.HTMLAttributes<HTMLDivElement>;

export function AnimatedGridBackground({ className, ...props }: AnimatedGridBackgroundProps) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 bg-grid-noise [background-size:24px_24px] opacity-20 animate-grid-drift",
        className
      )}
      {...props}
    />
  );
}
