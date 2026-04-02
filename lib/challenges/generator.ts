import { findAllNQueenSolutions, solveNQueenBacktracking } from "@/lib/nqueen-solver";
import { getCellKey } from "@/lib/chessboard";

export type ChallengeMode = "partially-filled" | "constrained" | "unique-continuation" | "limited-clue";
export type ChallengeDifficulty = "easy" | "medium" | "hard";

export type GeneratedChallenge = {
  boardSize: number;
  mode: ChallengeMode;
  difficulty: ChallengeDifficulty;
  prePlacedQueens: string[];
  blockedCells: string[];
  forbiddenCells: string[];
  solutionKeys: string[];
  description: string;
};

type GenerateChallengeOptions = {
  boardSize: number;
  mode: ChallengeMode;
  difficulty: ChallengeDifficulty;
};

function shuffle<T>(values: T[]) {
  const copy = [...values];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    const temp = copy[index];
    copy[index] = copy[swapIndex];
    copy[swapIndex] = temp;
  }
  return copy;
}

/**
 * Controls clue density by difficulty.
 */
function difficultyRatio(difficulty: ChallengeDifficulty) {
  if (difficulty === "easy") {
    return 0.55;
  }
  if (difficulty === "hard") {
    return 0.22;
  }
  return 0.35;
}

function keysFromSolution(solution: number[]) {
  return solution.map((col, row) => getCellKey(row, col));
}

function sampleClues(solutionKeys: string[], difficulty: ChallengeDifficulty, minimum: number) {
  const ratio = difficultyRatio(difficulty);
  const desired = Math.max(minimum, Math.round(solutionKeys.length * ratio));
  return shuffle(solutionKeys).slice(0, Math.min(desired, solutionKeys.length));
}

async function generateBaseSolution(boardSize: number) {
  const result = await solveNQueenBacktracking({
    algorithm: "bitmask",
    boardSize,
    shouldStop: () => false,
    onFrame: undefined,
    waitForPacing: undefined
  });

  if (!result.solved) {
    throw new Error("Unable to generate base solution");
  }

  return result.queensByRow;
}

/**
 * Small bounded uniqueness check used by unique-continuation mode.
 * Stops searching when two solutions are found.
 */
async function countSolutionsUpToTwo(boardSize: number, prePlacedQueens: string[]) {
  let stopWhenMany = false;

  const result = await findAllNQueenSolutions({
    algorithm: "classic",
    boardSize,
    constraints: { prePlacedQueens },
    shouldStop: () => stopWhenMany,
    maxStoredSolutions: 2,
    countOnly: false,
    onProgress: (progress) => {
      if (progress.solutionsFound >= 2) {
        stopWhenMany = true;
      }
    }
  });

  return result.solutionsFound;
}

/**
 * Generates a playable challenge board configuration.
 * Side effects: none (pure result generation from solver outputs).
 */
export async function generateChallengeBoard({ boardSize, mode, difficulty }: GenerateChallengeOptions): Promise<GeneratedChallenge> {
  const solution = await generateBaseSolution(boardSize);
  const solutionKeys = keysFromSolution(solution);
  let prePlacedQueens = sampleClues(solutionKeys, difficulty, mode === "limited-clue" ? 1 : 2);
  let blockedCells: string[] = [];
  let forbiddenCells: string[] = [];
  let description = "Generated challenge.";

  if (mode === "limited-clue") {
    const minimum = difficulty === "easy" ? 3 : difficulty === "medium" ? 2 : 1;
    prePlacedQueens = sampleClues(solutionKeys, difficulty, minimum);
    description = `Limited clue puzzle with ${prePlacedQueens.length} clues.`;
  }

  if (mode === "partially-filled") {
    const minimum = difficulty === "easy" ? Math.max(3, Math.floor(boardSize * 0.45)) : 2;
    prePlacedQueens = sampleClues(solutionKeys, difficulty, minimum);
    description = `Partially filled board with ${prePlacedQueens.length} fixed queens.`;
  }

  if (mode === "constrained") {
    const minClues = difficulty === "hard" ? 1 : 2;
    prePlacedQueens = sampleClues(solutionKeys, difficulty, minClues);

    const allCells = Array.from({ length: boardSize * boardSize }, (_, index) => {
      const row = Math.floor(index / boardSize);
      const col = index % boardSize;
      return getCellKey(row, col);
    }).filter((key) => !solutionKeys.includes(key));

    const blockedTarget = difficulty === "easy" ? 2 : difficulty === "medium" ? 3 : 5;
    const forbiddenTarget = difficulty === "easy" ? 1 : difficulty === "medium" ? 2 : 4;
    const shuffled = shuffle(allCells);
    blockedCells = shuffled.slice(0, blockedTarget);
    forbiddenCells = shuffled.slice(blockedTarget, blockedTarget + forbiddenTarget);
    description = `Constrained challenge: ${prePlacedQueens.length} clues, ${blockedCells.length} blocked, ${forbiddenCells.length} forbidden.`;
  }

  if (mode === "unique-continuation") {
    const shuffled = shuffle(solutionKeys);
    const startingClues = difficulty === "easy" ? 4 : difficulty === "medium" ? 3 : 2;
    prePlacedQueens = shuffled.slice(0, startingClues);

    for (let index = startingClues; index < shuffled.length; index += 1) {
      const solutionCount = await countSolutionsUpToTwo(boardSize, prePlacedQueens);
      if (solutionCount === 1) {
        break;
      }
      prePlacedQueens.push(shuffled[index]);
    }

    description = `Unique continuation puzzle with ${prePlacedQueens.length} clues.`;
  }

  return {
    boardSize,
    mode,
    difficulty,
    prePlacedQueens,
    blockedCells,
    forbiddenCells,
    solutionKeys,
    description
  };
}
