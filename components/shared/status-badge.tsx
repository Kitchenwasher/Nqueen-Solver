import * as React from "react";

import { Badge, type BadgeProps } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type StatusBadgeProps = BadgeProps & {
  active?: boolean;
};

export function StatusBadge({ className, active = false, ...props }: StatusBadgeProps) {
  return <Badge className={cn("badge-animate", active && "glow-border", className)} {...props} />;
}
