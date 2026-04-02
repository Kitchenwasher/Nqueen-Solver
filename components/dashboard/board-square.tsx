import { Crown } from "lucide-react";

import { cn } from "@/lib/utils";

type BoardSquareProps = {
  isDark: boolean;
  hasQueen: boolean;
  isHighlighted: boolean;
  label: string;
};

export function BoardSquare({ isDark, hasQueen, isHighlighted, label }: BoardSquareProps) {
  return (
    <div
      aria-label={label}
      className={cn(
        "relative flex aspect-square items-center justify-center rounded-[6px] border text-xs transition-all duration-300",
        isDark
          ? "border-slate-700/70 bg-slate-900/80 text-slate-400"
          : "border-cyan-200/20 bg-cyan-50/5 text-slate-300",
        isHighlighted && "border-primary/60 shadow-[0_0_0_1px_rgba(55,255,220,0.45)]",
        hasQueen && "text-primary"
      )}
    >
      {hasQueen ? <Crown className="h-4 w-4 sm:h-5 sm:w-5" /> : <span className="opacity-40">.</span>}
    </div>
  );
}
