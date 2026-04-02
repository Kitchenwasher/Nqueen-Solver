import * as React from "react";

import { Card, type CardSurfaceProps } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function GlowCard({ className, ...props }: Omit<CardSurfaceProps, "variant">) {
  return <Card className={cn("glass-elevated card-lift", className)} {...props} />;
}
