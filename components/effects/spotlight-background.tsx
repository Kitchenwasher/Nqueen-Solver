import * as React from "react";

import { cn } from "@/lib/utils";

type SpotlightBackgroundProps = React.HTMLAttributes<HTMLDivElement>;

export function SpotlightBackground({ className, ...props }: SpotlightBackgroundProps) {
  return (
    <div
      className={cn("pointer-events-none absolute inset-0 bg-spotlight-radial opacity-80", className)}
      {...props}
    />
  );
}
