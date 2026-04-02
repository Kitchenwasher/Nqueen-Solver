import { motion } from "framer-motion";

import { ChessCell } from "@/components/chessboard/chess-cell";
import { getCellKey } from "@/lib/chessboard";
import { cn } from "@/lib/utils";
import type { CellCoordinate, CellVisualState, HeatmapMode, SolverMoveState } from "@/types/chessboard";

type ChessboardProps = {
  boardSize: number;
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

function getBoardMaxWidth(boardSize: number) {
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

export function Chessboard({
  boardSize,
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
  const boardMaxWidth = getBoardMaxWidth(boardSize);
  const gridGapClass = boardSize >= 12 ? "gap-1 sm:gap-1.5" : "gap-1.5 sm:gap-2";

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
          "mx-auto w-full rounded-2xl border border-primary/35 bg-gradient-to-b from-slate-950/88 to-slate-950/65 p-2.5 shadow-[0_0_0_1px_rgba(112,238,221,0.2),0_30px_60px_rgba(2,6,26,0.7)] sm:p-3 md:p-4",
          isSolvingActive && "shadow-[0_0_0_1px_rgba(120,255,236,0.44),0_0_34px_rgba(98,255,231,0.2),0_30px_60px_rgba(2,6,26,0.75)]"
        )}
      >
        <div
          className={cn("grid", gridGapClass)}
          style={{ gridTemplateColumns: `repeat(${boardSize}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: boardSize * boardSize }).map((_, index) => {
            const row = Math.floor(index / boardSize);
            const col = index % boardSize;
            const key = getCellKey(row, col);
            const isActive = activeCell?.row === row && activeCell?.col === col;
            const isExploredCell = exploredCell?.row === row && exploredCell?.col === col;
            const isDarkSquare = (row + col) % 2 === 1;
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

            return (
              <ChessCell
                key={key}
                row={row}
                col={col}
                state={state}
                isActive={isActive}
                isDarkSquare={isDarkSquare}
                heatmapMode={heatmapMode}
                heatmapLevel={heatmapLevel}
                heatmapCount={heatmapCount}
                disabled={isInteractionLocked}
                onClick={() => onCellClick({ row, col })}
              />
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
