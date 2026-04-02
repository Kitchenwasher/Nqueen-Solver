import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "badge-animate inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-border bg-secondary text-secondary-foreground",
        outline: "border-border bg-transparent text-foreground",
        success: "border-emerald-300/40 bg-emerald-500/20 text-emerald-100",
        warning: "border-amber-300/40 bg-amber-500/20 text-amber-100",
        danger: "border-rose-300/40 bg-rose-500/20 text-rose-100",
        glow: "border-primary/45 bg-primary/12 text-primary shadow-[0_0_0_1px_rgba(98,255,232,0.24),0_0_18px_rgba(98,255,232,0.16)]"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
