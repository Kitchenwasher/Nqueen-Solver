/// <reference lib="webworker" />

import { hasFutureFeasibleRowsBitmask, hasRemainingColumnCapacityBitmask } from "../lib/solvers/pruning";
import type { ParallelSolveTask, ParallelSolveTaskResult } from "../lib/parallel/types";

type SolveMessage = {
  type: "solve";
  task: ParallelSolveTask;
};

function bitToColumn(bit: number) {
  return Math.log2(bit) | 0;
}

function solveTask(task: ParallelSolveTask): ParallelSolveTaskResult {
  const { n, startRow, colsMask, diagMask, antiDiagMask, placements, findAll, maxStoredSolutions, id } = task;
  const fullMask = (1 << n) - 1;

  const queensByRow = [...placements];
  let recursiveCalls = 0;
  let backtracks = 0;
  let solutionsFound = 0;
  let branchesPruned = 0;
  let deadStatesDetected = 0;
  let capped = false;
  const storedSolutions: number[][] = [];

  function recordSolution() {
    solutionsFound += 1;

    if (storedSolutions.length < maxStoredSolutions) {
      storedSolutions.push([...queensByRow]);
    } else {
      capped = true;
    }
  }

  function dfs(row: number, columns: number, diagonals: number, antiDiagonals: number): boolean {
    recursiveCalls += 1;

    if (row === n) {
      recordSolution();
      return !findAll;
    }

    if (!hasRemainingColumnCapacityBitmask(n, row, columns, fullMask)) {
      branchesPruned += 1;
      deadStatesDetected += 1;
      return false;
    }

    if (!hasFutureFeasibleRowsBitmask(row, n, fullMask, columns, diagonals, antiDiagonals)) {
      branchesPruned += 1;
      deadStatesDetected += 1;
      return false;
    }

    let available = fullMask & ~(columns | diagonals | antiDiagonals);
    while (available !== 0) {
      const bit = available & -available;
      available -= bit;
      queensByRow[row] = bitToColumn(bit);

      const solvedFirst = dfs(row + 1, columns | bit, ((diagonals | bit) << 1) & fullMask, (antiDiagonals | bit) >> 1);
      if (solvedFirst) {
        return true;
      }

      queensByRow[row] = -1;
      backtracks += 1;
    }

    return false;
  }

  dfs(startRow, colsMask, diagMask, antiDiagMask);

  return {
    taskId: id,
    recursiveCalls,
    backtracks,
    solutionsFound,
    branchesPruned,
    deadStatesDetected,
    storedSolutions,
    capped
  };
}

self.onmessage = (event: MessageEvent<SolveMessage>) => {
  if (event.data.type !== "solve") {
    return;
  }

  const result = solveTask(event.data.task);
  self.postMessage(result);
};

export {};
