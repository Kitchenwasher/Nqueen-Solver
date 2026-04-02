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
  },
  {
    title: "Multicore + Benchmarking",
    description:
      "QueenMind now includes parallel workers, adaptive split depth, benchmarking, and stress testing for serious performance analysis."
  },
  {
    title: "Constraint + Puzzle Systems",
    description:
      "Constraint editing and challenge generation turn N-Queen into a configurable CSP lab, not just a single fixed puzzle."
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
    id: "bitmask-solver",
    title: "Bitmask Solver",
    summary:
      "Bitmask-based search encodes occupied columns and diagonals as bits, enabling extremely fast candidate generation with low allocation overhead.",
    bullets: [
      "Bit operations replace repeated structure scans.",
      "Column and diagonal state are updated with shifts and masks.",
      "Great for larger board sizes where branch volume explodes."
    ]
  },
  {
    id: "symmetry-optimization",
    title: "Symmetry Optimization",
    summary:
      "Symmetry optimization avoids exploring mirrored first-row branches and then accounts for mirrored solutions mathematically.",
    bullets: [
      "Search can be cut roughly in half for many all-solution runs.",
      "Odd and even board sizes are handled differently around center columns.",
      "This optimization reduces redundant search, not solution correctness."
    ]
  },
  {
    id: "branch-ordering",
    title: "Branch Ordering Strategies",
    summary:
      "Column exploration order changes solver behavior. QueenMind supports left-to-right, center-first, and heuristic ordering.",
    bullets: [
      "Different orderings can dramatically alter first-solution time.",
      "Heuristic ordering aims to hit promising continuations earlier.",
      "Benchmark mode helps compare strategy impact across algorithms."
    ]
  },
  {
    id: "dead-state-pruning",
    title: "Early Dead-State Detection",
    summary:
      "Additional pruning checks identify partial states that cannot reach completion, allowing earlier branch termination.",
    bullets: [
      "Dead-end states are rejected before deep recursion.",
      "Pruning metrics show work saved and dead states detected.",
      "Improves practical runtime without changing valid result sets."
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
    id: "parallel-worker-pool",
    title: "Parallel Worker Pool",
    summary:
      "Top-level branches can be split into tasks and distributed to Web Workers so larger searches use multiple CPU cores while the UI stays responsive.",
    bullets: [
      "Work is split at shallow depth rather than every recursive call.",
      "Worker telemetry tracks active workers, tasks, and per-worker progress.",
      "Parallel mode is best suited to larger N and all-solution workloads."
    ]
  },
  {
    id: "adaptive-split-depth",
    title: "Adaptive Parallel Split Depth",
    summary:
      "Split depth can be chosen automatically based on board size and workload profile to improve load balance.",
    bullets: [
      "Small boards use shallow or no split to avoid overhead.",
      "Larger boards can split deeper for better worker utilization.",
      "Manual override remains available for controlled experiments."
    ]
  },
  {
    id: "benchmark-lab",
    title: "Benchmark + Stress Test Lab",
    summary:
      "Benchmark Lab compares algorithms and strategies across board sizes and run counts, while Stress Test mode finds upper limits under a time budget.",
    bullets: [
      "Compare solve time, calls, backtracks, pruning, and speedup ratios.",
      "Switch between first-solution and all-solution objectives.",
      "Stress mode reports max solved N and throughput-style metrics."
    ]
  },
  {
    id: "hardware-intelligence",
    title: "Hardware Intelligence + Recommendations",
    summary:
      "QueenMind detects available hardware threads and environment capabilities to recommend an appropriate solver mode and visualization range.",
    bullets: [
      "Recommendations adapt to device capability tier.",
      "Parallel suitability is surfaced before long runs.",
      "One-click apply aligns algorithm choice with detected hardware."
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
  },
  {
    id: "constraint-variants",
    title: "Constraint Variant Solver",
    summary:
      "Beyond classic N-Queen, QueenMind supports blocked cells, forbidden positions, pre-placed queens, and partial completion scenarios.",
    bullets: [
      "Constraint editor lets you shape custom search spaces.",
      "Solver behavior remains constraint-safe across supported modes.",
      "Useful for studying satisfiable vs unsatisfiable board setups."
    ]
  },
  {
    id: "challenge-generator",
    title: "Challenge / Puzzle Generator",
    summary:
      "Challenge mode generates playable puzzle configurations with adjustable difficulty and modes such as partial, constrained, unique continuation, and clue-limited setups.",
    bullets: [
      "Generate challenge, attempt manually, reveal solution when needed.",
      "Difficulty settings bias puzzle structure and guidance level.",
      "Challenge metadata helps explain puzzle intent and constraints."
    ]
  },
  {
    id: "visual-analytics",
    title: "Search Tree + Heatmap + Insights",
    summary:
      "Visual analytics make search behavior tangible: tree growth, board heatmaps, and metrics dashboards reveal where work is concentrated.",
    bullets: [
      "Tree visualizer teaches recursion and branch expansion.",
      "Heatmaps show exploration, conflict, and solution participation patterns.",
      "Insights panels connect algorithm choices to observed runtime signals."
    ]
  }
] as const;
