import type { SymmetryStats } from "@/lib/solvers/types";

type RootBranch = {
  col: number;
  mirrorFactor: 1 | 2;
  isMiddle: boolean;
};

export function getRootBranches(boardSize: number, symmetryEnabled: boolean): RootBranch[] {
  if (!symmetryEnabled) {
    return Array.from({ length: boardSize }, (_, col) => ({ col, mirrorFactor: 1 as const, isMiddle: false }));
  }

  const half = Math.floor(boardSize / 2);
  const branches: RootBranch[] = Array.from({ length: half }, (_, col) => ({
    col,
    mirrorFactor: 2 as const,
    isMiddle: false
  }));

  if (boardSize % 2 === 1) {
    branches.push({
      col: half,
      mirrorFactor: 1,
      isMiddle: true
    });
  }

  return branches;
}

export function createSymmetryStats(boardSize: number, symmetryEnabled: boolean): SymmetryStats {
  const total = boardSize;
  const explored = symmetryEnabled ? Math.floor(boardSize / 2) + (boardSize % 2 === 1 ? 1 : 0) : boardSize;
  const skipped = Math.max(total - explored, 0);
  const reduction = total > 0 ? skipped / total : 0;
  const speedup = explored > 0 ? total / explored : 1;

  return {
    active: symmetryEnabled,
    rootBranchesTotal: total,
    rootBranchesExplored: explored,
    branchesSkipped: skipped,
    estimatedSearchReduction: reduction,
    effectiveSpeedup: speedup
  };
}

export function mirrorSolution(queensByRow: number[], boardSize: number): number[] {
  const mirrored = new Array<number>(queensByRow.length);

  for (let row = 0; row < queensByRow.length; row += 1) {
    const col = queensByRow[row];
    mirrored[row] = col >= 0 ? boardSize - 1 - col : -1;
  }

  return mirrored;
}
