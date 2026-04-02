import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 hover-shine will-change-transform active:translate-y-px active:scale-[0.985]",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-[0_0_0_1px_rgba(82,255,234,0.25),0_10px_24px_rgba(4,10,35,0.45)] hover:-translate-y-[1px] hover:brightness-110 hover:shadow-[0_0_0_1px_rgba(82,255,234,0.32),0_16px_30px_rgba(4,10,35,0.52)]",
        secondary: "bg-secondary text-secondary-foreground hover:-translate-y-[1px] hover:bg-secondary/80 hover:shadow-[0_10px_24px_rgba(3,8,28,0.38)]",
        outline: "border border-input bg-background/60 hover:-translate-y-[1px] hover:bg-accent hover:text-accent-foreground hover:shadow-[0_10px_22px_rgba(3,8,28,0.34)]",
        ghost: "hover:bg-accent/60 hover:text-accent-foreground",
        glass: "glass-panel text-foreground hover:border-primary/45",
        danger: "bg-rose-500/90 text-white hover:bg-rose-500"
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-lg px-3",
        lg: "h-11 rounded-xl px-8",
        icon: "h-10 w-10"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, type = "button", ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} type={type} {...props} />;
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
