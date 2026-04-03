import { memo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Crown } from "lucide-react";

import { cn } from "@/lib/utils";
import type { CellVisualState, HeatmapMode } from "@/types/chessboard";

type ChessCellProps = {
  row: number;
  col: number;
  isDarkSquare: boolean;
  isActive: boolean;
  isActiveRow?: boolean;
  isActiveCol?: boolean;
  state: CellVisualState;
  heatmapMode?: HeatmapMode;
  heatmapLevel?: number;
  heatmapCount?: number;
  isSolvingActive?: boolean;
  disabled?: boolean;
  onClick: (row: number, col: number) => void;
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

function ChessCellComponent({
  row,
  col,
  isDarkSquare,
  isActive,
  isActiveRow = false,
  isActiveCol = false,
  state,
  heatmapMode = "off",
  heatmapLevel = 0,
  heatmapCount = 0,
  isSolvingActive = false,
  disabled = false,
  onClick
}: ChessCellProps) {
  // Compact textual markers used for non-queen solver states.
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
  const showAxisHighlight = isSolvingActive && !isQueen && (isActiveRow || isActiveCol);

  return (
    <motion.button
      type="button"
      layout
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: "spring", stiffness: 250, damping: 20 }}
      aria-label={`Row ${row + 1} Column ${col + 1}`}
      onClick={() => onClick(row, col)}
      disabled={disabled}
      className={cn(
        "group relative flex aspect-square items-center justify-center overflow-hidden rounded-[10px] border transition-all duration-250 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-95",
        isDarkSquare
          ? "border-slate-700/80 bg-[linear-gradient(160deg,rgba(8,14,30,0.98),rgba(8,16,38,0.9))]"
          : "border-cyan-100/20 bg-[linear-gradient(160deg,rgba(93,224,255,0.1),rgba(108,234,255,0.05))]",
        "before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.08),transparent_50%)] before:opacity-60",
        state === "attacked" &&
          "border-amber-300/50 bg-amber-400/10 shadow-[0_0_0_1px_rgba(251,191,36,0.2)]",
        state === "trying" &&
          "border-sky-300/55 bg-sky-500/14 shadow-[0_0_0_1px_rgba(125,211,252,0.28),0_0_14px_rgba(56,189,248,0.16)]",
        state === "invalid" &&
          "border-rose-400/65 bg-rose-500/20 shadow-[0_0_0_1px_rgba(251,113,133,0.35),0_0_12px_rgba(251,113,133,0.18)]",
        state === "backtracking" &&
          "border-fuchsia-300/50 bg-fuchsia-500/16 shadow-[0_0_0_1px_rgba(244,114,182,0.28),0_0_12px_rgba(236,72,153,0.15)]",
        state === "queen" &&
          "border-primary/55 bg-primary/15 shadow-[0_0_0_1px_rgba(86,255,229,0.32),0_0_16px_rgba(86,255,229,0.16)]",
        state === "preplaced" &&
          "border-emerald-300/60 bg-emerald-500/20 shadow-[0_0_0_1px_rgba(52,211,153,0.25),0_0_14px_rgba(110,231,183,0.14)]",
        state === "conflicting" &&
          "border-rose-400/60 bg-rose-500/18 shadow-[0_0_0_1px_rgba(251,113,133,0.35),0_0_14px_rgba(244,63,94,0.16)]",
        state === "blocked" &&
          "border-slate-500/60 bg-[repeating-linear-gradient(-45deg,rgba(51,65,85,0.72),rgba(51,65,85,0.72)_6px,rgba(30,41,59,0.72)_6px,rgba(30,41,59,0.72)_12px)]",
        state === "forbidden" &&
          "border-orange-400/60 bg-orange-500/20 shadow-[0_0_0_1px_rgba(251,146,60,0.34),0_0_10px_rgba(251,146,60,0.2)]",
        isActive && "ring-2 ring-primary/90 ring-offset-1 ring-offset-background",
        showAxisHighlight && "after:pointer-events-none after:absolute after:inset-0 after:bg-cyan-300/8",
        showHeatmap && "backdrop-brightness-[1.03]"
      )}
    >
      {isSolvingActive && state === "trying" && (
        <motion.span
          className="pointer-events-none absolute inset-0 rounded-[10px] border border-sky-300/35"
          animate={{ opacity: [0.35, 0.8, 0.35] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      {showHeatmap && (
        <span
          className={cn("pointer-events-none absolute inset-0 rounded-[10px] transition-opacity", getHeatmapOverlayClass(heatmapMode))}
          style={{ opacity: heatmapOpacity }}
        />
      )}

      <AnimatePresence mode="wait">
        {isQueen ? (
          <motion.span
            key="queen"
            initial={{ scale: 0.25, opacity: 0, y: 5, rotate: -8 }}
            animate={{ scale: 1, opacity: 1, y: 0, rotate: 0 }}
            exit={{ scale: 0.25, opacity: 0, y: -4, rotate: 8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={cn(
              "pointer-events-none drop-shadow-[0_0_10px_rgba(99,255,235,0.35)]",
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

export const ChessCell = memo(ChessCellComponent);
