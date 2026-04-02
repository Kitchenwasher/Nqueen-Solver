import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const cardVariants = cva(
  "rounded-xl border text-card-foreground backdrop-blur-sm transition-all duration-250 card-lift",
  {
    variants: {
      variant: {
        default: "border-border/70 bg-card/85 shadow-glow hover:border-border/90",
        glass: "glass-panel hover:border-primary/35",
        elevated: "border-border/70 bg-card/90 shadow-[0_22px_54px_rgba(1,7,32,0.55)] hover:shadow-[0_28px_64px_rgba(1,7,32,0.62)]"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "card-lift rounded-xl border border-border/70 bg-card/85 text-card-foreground shadow-glow backdrop-blur-sm transition-all duration-250 hover:border-border/90 hover:shadow-[0_0_0_1px_rgba(120,122,255,0.22),0_24px_44px_rgba(5,8,25,0.58)]",
        className
      )}
      {...props}
    />
  )
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("space-y-1.5 p-5", className)} {...props} />
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn("font-semibold leading-none tracking-tight", className)} {...props} />
  )
);
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
  )
);
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("p-5 pt-0", className)} {...props} />
);
CardContent.displayName = "CardContent";

export interface CardSurfaceProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const CardSurface = React.forwardRef<HTMLDivElement, CardSurfaceProps>(({ className, variant, ...props }, ref) => (
  <div ref={ref} className={cn(cardVariants({ variant }), className)} {...props} />
));
CardSurface.displayName = "CardSurface";

export { Card, CardContent, CardDescription, CardHeader, CardTitle, CardSurface, cardVariants };
