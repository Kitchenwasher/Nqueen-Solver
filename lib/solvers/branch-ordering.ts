import type { SearchStrategy } from "@/types/chessboard";

type ColumnScoreFn = (col: number) => number;
type BitScoreFn = (bit: number) => number;

function centerDistance(col: number, boardSize: number) {
  const center = (boardSize - 1) / 2;
  return Math.abs(col - center);
}

export function getSearchStrategyLabel(strategy: SearchStrategy) {
  if (strategy === "center-first") {
    return "Center First";
  }
  if (strategy === "heuristic") {
    return "Heuristic Search";
  }
  return "Left to Right";
}

export function orderColumnsByStrategy(
  columns: number[],
  boardSize: number,
  strategy: SearchStrategy,
  scoreColumn?: ColumnScoreFn
): number[] {
  if (columns.length <= 1 || strategy === "left-to-right") {
    return columns;
  }

  if (strategy === "center-first") {
    return [...columns].sort((a, b) => {
      const distance = centerDistance(a, boardSize) - centerDistance(b, boardSize);
      return distance !== 0 ? distance : a - b;
    });
  }

  const scorer = scoreColumn ?? (() => 0);
  return [...columns].sort((a, b) => {
    const score = scorer(b) - scorer(a);
    if (score !== 0) {
      return score;
    }

    const distance = centerDistance(a, boardSize) - centerDistance(b, boardSize);
    return distance !== 0 ? distance : a - b;
  });
}

export function orderBitsByStrategy(
  availableMask: number,
  boardSize: number,
  strategy: SearchStrategy,
  scoreBit?: BitScoreFn
): number[] {
  const bits: number[] = [];
  let current = availableMask;

  while (current !== 0) {
    const bit = current & -current;
    current ^= bit;
    bits.push(bit);
  }

  if (bits.length <= 1 || strategy === "left-to-right") {
    return bits;
  }

  if (strategy === "center-first") {
    return bits.sort((a, b) => {
      const aCol = 31 - Math.clz32(a);
      const bCol = 31 - Math.clz32(b);
      const distance = centerDistance(aCol, boardSize) - centerDistance(bCol, boardSize);
      return distance !== 0 ? distance : aCol - bCol;
    });
  }

  const scorer = scoreBit ?? (() => 0);
  return bits.sort((a, b) => {
    const score = scorer(b) - scorer(a);
    if (score !== 0) {
      return score;
    }

    const aCol = 31 - Math.clz32(a);
    const bCol = 31 - Math.clz32(b);
    const distance = centerDistance(aCol, boardSize) - centerDistance(bCol, boardSize);
    return distance !== 0 ? distance : aCol - bCol;
  });
}

export function countSetBits(value: number) {
  let x = value;
  let count = 0;

  while (x !== 0) {
    x &= x - 1;
    count += 1;
  }

  return count;
}
