import { memo, useCallback, useMemo } from "react";
import { motion } from "framer-motion";

import { ChessCell } from "@/components/chessboard/chess-cell";
import { getCellKey } from "@/lib/chessboard";
import { cn } from "@/lib/utils";
import type { CellCoordinate, CellVisualState, HeatmapMode, SolverMoveState } from "@/types/chessboard";

type ChessboardProps = {
  boardSize: number;
  focusMode?: boolean;
  queens: Set<string>;
  prePlacedQueens?: Set<string>;
  blockedCells?: Set<string>;
  forbiddenCells?: Set<string>;
  attackedCells: Set<string>;
  conflictingQueens: Set<string>;
  activeCell: CellCoordinate | null;
  exploredCell?: CellCoordinate | null;
  exploredState?: SolverMoveState;
  heatmapMode?: HeatmapMode;
  heatmapCounts?: Record<string, number>;
  heatmapMax?: number;
  isSolvingActive?: boolean;
  isInteractionLocked?: boolean;
  onCellClick: (cell: CellCoordinate) => void;
};

function getBoardMaxWidth(boardSize: number, focusMode: boolean) {
  if (focusMode) {
    if (boardSize <= 4) {
      return 1320;
    }
    if (boardSize <= 6) {
      return 1260;
    }
    if (boardSize <= 8) {
      return 1180;
    }
    if (boardSize <= 10) {
      return 1080;
    }
    if (boardSize <= 12) {
      return 980;
    }
    return 900;
  }

  if (boardSize <= 4) {
    return 980;
  }
  if (boardSize <= 6) {
    return 930;
  }
  if (boardSize <= 8) {
    return 860;
  }
  if (boardSize <= 10) {
    return 800;
  }
  if (boardSize <= 12) {
    return 740;
  }
  return 680;
}

/**
 * Resolves visual state for one cell.
 * Ordering matters: transient solver states should override static board tags.
 */
function getCellState(
  key: string,
  isExploredCell: boolean,
  exploredState: SolverMoveState,
  queens: Set<string>,
  prePlacedQueens: Set<string>,
  blockedCells: Set<string>,
  forbiddenCells: Set<string>,
  attackedCells: Set<string>,
  conflictingQueens: Set<string>
): CellVisualState {
  if (isExploredCell && exploredState === "trying") {
    return "trying";
  }
  if (isExploredCell && exploredState === "invalid") {
    return "invalid";
  }
  if (isExploredCell && exploredState === "backtracking") {
    return "backtracking";
  }
  if (blockedCells.has(key)) {
    return "blocked";
  }
  if (forbiddenCells.has(key)) {
    return "forbidden";
  }
  if (conflictingQueens.has(key)) {
    return "conflicting";
  }
  if (prePlacedQueens.has(key)) {
    return "preplaced";
  }
  if (queens.has(key)) {
    return "queen";
  }
  if (attackedCells.has(key)) {
    return "attacked";
  }
  return "empty";
}

function ChessboardComponent({
  boardSize,
  focusMode = false,
  queens,
  prePlacedQueens = new Set<string>(),
  blockedCells = new Set<string>(),
  forbiddenCells = new Set<string>(),
  attackedCells,
  conflictingQueens,
  activeCell,
  exploredCell = null,
  exploredState = null,
  heatmapMode = "off",
  heatmapCounts = {},
  heatmapMax = 0,
  isSolvingActive = false,
  isInteractionLocked = false,
  onCellClick
}: ChessboardProps) {
  const boardMaxWidth = useMemo(() => getBoardMaxWidth(boardSize, focusMode), [boardSize, focusMode]);
  const gridGapClass = boardSize >= 12 ? "gap-1 sm:gap-1.5" : "gap-1.5 sm:gap-2";
  const activeAxisCell = exploredCell ?? activeCell;
  const activeRow = activeAxisCell?.row ?? null;
  const activeCol = activeAxisCell?.col ?? null;
  const handleCellClick = useCallback(
    (row: number, col: number) => {
      onCellClick({ row, col });
    },
    [onCellClick]
  );

  const cells = useMemo(() => {
    return Array.from({ length: boardSize * boardSize }).map((_, index) => {
      const row = Math.floor(index / boardSize);
      const col = index % boardSize;
      const key = getCellKey(row, col);
      const isDarkSquare = (row + col) % 2 === 1;
      const isActive = activeCell?.row === row && activeCell?.col === col;
      const isExploredCell = exploredCell?.row === row && exploredCell?.col === col;
      const state = getCellState(
        key,
        isExploredCell,
        exploredState,
        queens,
        prePlacedQueens,
        blockedCells,
        forbiddenCells,
        attackedCells,
        conflictingQueens
      );
      const heatmapCount = heatmapCounts[key] ?? 0;
      const heatmapLevel = heatmapMax > 0 ? Math.min(heatmapCount / heatmapMax, 1) : 0;
      const isActiveRow = activeRow !== null && activeRow === row;
      const isActiveCol = activeCol !== null && activeCol === col;

      return {
        key,
        row,
        col,
        state,
        isDarkSquare,
        isActive,
        isActiveRow,
        isActiveCol,
        heatmapCount,
        heatmapLevel
      };
    });
  }, [
    activeCell?.col,
    activeCell?.row,
    activeCol,
    activeRow,
    attackedCells,
    blockedCells,
    boardSize,
    conflictingQueens,
    exploredCell?.col,
    exploredCell?.row,
    exploredState,
    forbiddenCells,
    heatmapCounts,
    heatmapMax,
    prePlacedQueens,
    queens
  ]);

  return (
    <div className="mx-auto w-full">
      <motion.div
        key={`board-${boardSize}`}
        layout
        initial={{ opacity: 0, scale: 0.975 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.38, ease: "easeOut" }}
        style={{
          maxWidth: `${boardMaxWidth}px`
        }}
        className={cn(
          "relative mx-auto w-full overflow-hidden rounded-3xl border border-primary/35 bg-gradient-to-b from-slate-950/90 via-slate-950/82 to-slate-950/62 p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_0_0_1px_rgba(112,238,221,0.2),0_30px_60px_rgba(2,6,26,0.7)] sm:p-3 md:p-4",
          focusMode && "border-primary/55 p-3 sm:p-4 md:p-5",
          isSolvingActive &&
            "shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_0_0_1px_rgba(120,255,236,0.44),0_0_34px_rgba(98,255,231,0.2),0_30px_60px_rgba(2,6,26,0.75)]"
        )}
      >
        <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(84,255,229,0.18),transparent_38%),radial-gradient(circle_at_0%_100%,rgba(64,123,255,0.12),transparent_40%)]" />
        <span className="pointer-events-none absolute inset-[1px] rounded-[calc(1.4rem-1px)] border border-white/5" />
        <div
          className={cn("relative grid", gridGapClass)}
          style={{ gridTemplateColumns: `repeat(${boardSize}, minmax(0, 1fr))` }}
        >
          {cells.map((cell) => (
            <ChessCell
              key={cell.key}
              row={cell.row}
              col={cell.col}
              state={cell.state}
              isActive={cell.isActive}
              isDarkSquare={cell.isDarkSquare}
              isActiveRow={cell.isActiveRow}
              isActiveCol={cell.isActiveCol}
              heatmapMode={heatmapMode}
              heatmapLevel={cell.heatmapLevel}
              heatmapCount={cell.heatmapCount}
              disabled={isInteractionLocked}
              isSolvingActive={isSolvingActive}
              onClick={handleCellClick}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}

export const Chessboard = memo(ChessboardComponent);
