import { AnimatePresence, motion } from "framer-motion";
import { Crown } from "lucide-react";

import { cn } from "@/lib/utils";
import type { CellVisualState, HeatmapMode } from "@/types/chessboard";

type ChessCellProps = {
  row: number;
  col: number;
  isDarkSquare: boolean;
  isActive: boolean;
  state: CellVisualState;
  heatmapMode?: HeatmapMode;
  heatmapLevel?: number;
  heatmapCount?: number;
  disabled?: boolean;
  onClick: () => void;
};

function getHeatmapOverlayClass(mode: HeatmapMode) {
  if (mode === "exploration") {
    return "bg-cyan-400/80";
  }
  if (mode === "conflict") {
    return "bg-rose-400/80";
  }
  if (mode === "solution-frequency") {
    return "bg-emerald-400/80";
  }
  return "";
}

export function ChessCell({
  row,
  col,
  isDarkSquare,
  isActive,
  state,
  heatmapMode = "off",
  heatmapLevel = 0,
  heatmapCount = 0,
  disabled = false,
  onClick
}: ChessCellProps) {
  const isQueen = state === "queen" || state === "conflicting" || state === "preplaced";
  const marker =
    state === "invalid"
      ? "!"
      : state === "backtracking"
        ? "<"
        : state === "blocked"
          ? "#"
          : state === "forbidden"
            ? "!"
            : state === "trying" || state === "attacked"
              ? "x"
              : ".";
  const showHeatmap = heatmapMode !== "off" && heatmapLevel > 0;
  const heatmapOpacity = Math.min(0.12 + heatmapLevel * 0.72, 0.84);

  return (
    <motion.button
      type="button"
      layout
      whileHover={{ scale: 1.015 }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: "spring", stiffness: 250, damping: 20 }}
      aria-label={`Row ${row + 1} Column ${col + 1}`}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "relative flex aspect-square items-center justify-center overflow-hidden rounded-[8px] border transition-all duration-250 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-95",
        isDarkSquare
          ? "border-slate-700/90 bg-slate-900/92"
          : "border-cyan-100/30 bg-cyan-50/[0.12]",
        state === "attacked" &&
          "border-amber-400/40 bg-amber-400/10 shadow-[0_0_0_1px_rgba(251,191,36,0.16)]",
        state === "trying" && "border-sky-300/45 bg-sky-500/12 shadow-[0_0_0_1px_rgba(125,211,252,0.2)]",
        state === "invalid" && "border-rose-400/65 bg-rose-500/20 shadow-[0_0_0_1px_rgba(251,113,133,0.35)]",
        state === "backtracking" &&
          "border-fuchsia-300/50 bg-fuchsia-500/15 shadow-[0_0_0_1px_rgba(244,114,182,0.28)]",
        state === "queen" && "border-primary/50 bg-primary/15",
        state === "preplaced" && "border-emerald-300/60 bg-emerald-500/20 shadow-[0_0_0_1px_rgba(52,211,153,0.25)]",
        state === "conflicting" &&
          "border-rose-400/60 bg-rose-500/18 shadow-[0_0_0_1px_rgba(251,113,133,0.35)]",
        state === "blocked" && "border-slate-500/60 bg-slate-800/75",
        state === "forbidden" && "border-orange-400/60 bg-orange-500/18 shadow-[0_0_0_1px_rgba(251,146,60,0.3)]",
        isActive && "ring-2 ring-primary/85 ring-offset-1 ring-offset-background",
        showHeatmap && "backdrop-brightness-[1.03]"
      )}
    >
      {showHeatmap && (
        <span
          className={cn("pointer-events-none absolute inset-0 rounded-[8px] transition-opacity", getHeatmapOverlayClass(heatmapMode))}
          style={{ opacity: heatmapOpacity }}
        />
      )}

      <AnimatePresence mode="wait">
        {isQueen ? (
          <motion.span
            key="queen"
            initial={{ scale: 0.25, opacity: 0, y: 5 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.25, opacity: 0, y: -4 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className={cn(
              "pointer-events-none",
              state === "conflicting" ? "text-rose-200" : state === "preplaced" ? "text-emerald-200" : "text-primary"
            )}
          >
            <Crown className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6" />
          </motion.span>
        ) : (
          <motion.span
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={cn(
              "text-[10px] sm:text-xs",
              state === "attacked" && "text-amber-300/70",
              state === "trying" && "text-sky-100/90",
              state === "invalid" && "text-rose-100",
              state === "backtracking" && "text-fuchsia-100/90",
              state === "blocked" && "text-slate-200/80",
              state === "forbidden" && "text-orange-100/90",
              state === "empty" && "text-slate-300/70"
            )}
          >
            {marker}
          </motion.span>
        )}
      </AnimatePresence>

      {showHeatmap && (
        <span className="pointer-events-none absolute right-1 top-1 rounded bg-background/70 px-1 py-[1px] text-[9px] text-foreground/90">
          {heatmapCount}
        </span>
      )}
    </motion.button>
  );
}
