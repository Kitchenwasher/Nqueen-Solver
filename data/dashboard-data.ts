export const educationHighlights = [
  {
    title: "Core Goal",
    description:
      "Place N queens on an N x N board so no two queens share a row, column, or diagonal attack line."
  },
  {
    title: "Learning Lens",
    description:
      "The problem is a clean model for recursion, state-space search, pruning, and constraint satisfaction."
  },
  {
    title: "Performance Mindset",
    description:
      "Optimization comes from reducing candidate checks and pruning impossible branches as early as possible."
  }
] as const;

export const educationTopics = [
  {
    id: "nqueen-problem",
    title: "What Is the N-Queen Problem?",
    summary:
      "The challenge is to place N queens on an N x N board so no queen attacks another. Queens attack along rows, columns, and diagonals.",
    bullets: [
      "Every row must contain exactly one queen.",
      "No two queens can share the same column.",
      "No two queens can lie on the same diagonal."
    ]
  },
  {
    id: "backtracking",
    title: "How Backtracking Works",
    summary:
      "Backtracking explores one decision at a time. If a placement leads to a dead-end, it undoes that move and tries the next option.",
    bullets: [
      "Pick a row and try columns left to right.",
      "Place queen only when constraints are satisfied.",
      "If no column works, return to previous row and change earlier decisions."
    ]
  },
  {
    id: "recursion",
    title: "Why Recursion Is Used",
    summary:
      "Each row decision creates a smaller subproblem for the next row. Recursion naturally models this repeated structure.",
    bullets: [
      "The call stack stores partial placements.",
      "Base case appears when all rows are successfully filled.",
      "Unwinding naturally supports move retraction during backtracking."
    ]
  },
  {
    id: "optimization",
    title: "How Optimization Improves Performance",
    summary:
      "Optimized solvers track occupied columns and diagonals in sets (or bitmasks) so safety checks become constant-time lookups.",
    bullets: [
      "Column checks avoid scanning earlier rows.",
      "Diagonal keys `(row-col)` and anti-diagonal keys `(row+col)` remove repeated calculations.",
      "Fewer checks per node means faster search overall."
    ]
  },
  {
    id: "time-complexity",
    title: "Time Complexity",
    summary:
      "Worst-case complexity is exponential, often approximated by O(N!). Even with pruning, growth is still steep for larger N.",
    bullets: [
      "Naive exploration scales explosively.",
      "Pruning dramatically reduces practical runtime.",
      "Algorithmic improvements mostly lower constants and explored nodes."
    ]
  },
  {
    id: "space-complexity",
    title: "Space Complexity",
    summary:
      "Space mainly comes from recursion depth and placement tracking. Depth is O(N), and supporting sets/arrays are also O(N).",
    bullets: [
      "Recursion stack height equals board size.",
      "Column/diagonal occupancy structures are linear.",
      "Storing all solutions can dominate memory for larger N."
    ]
  },
  {
    id: "csp",
    title: "Constraint Satisfaction Perspective",
    summary:
      "N-Queen is a classic CSP where variables are rows, domains are columns, and constraints enforce non-attacking placements.",
    bullets: [
      "Variables: one per row.",
      "Domain: valid columns for each row.",
      "Constraints: unique columns and safe diagonals."
    ]
  },
  {
    id: "real-world",
    title: "Real-World Relevance",
    summary:
      "Backtracking and search appear in scheduling, resource allocation, route planning, puzzle solving, verification, and compiler design.",
    bullets: [
      "Used in timetabling and planning engines.",
      "Useful in SAT/CSP-style decision systems.",
      "Builds intuition for pruning and state-space reasoning in AI systems."
    ]
  }
] as const;
