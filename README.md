# QueenMind

QueenMind is a production-style N-Queen platform built with Next.js, TypeScript, Tailwind CSS, Framer Motion, and shadcn/ui patterns. It combines interactive board play, multiple solver engines, multicore parallel execution, rich analytics, benchmark tooling, stress testing, and learning-focused visualizations.

## Core Features

- Interactive chessboard with manual queen placement
- Multiple solver algorithms:
  - Classic Backtracking
  - Optimized Solver (set-based pruning)
  - Bitmask Solver (bitwise occupancy)
  - Parallel Solver (Web Worker pool)
- Solving objectives:
  - Fastest First Solution
  - Enumerate All Solutions
- Search strategy controls:
  - Left to Right
  - Center First
  - Heuristic Search
- Symmetry optimization toggle
- Adaptive/manual parallel split depth
- Constraint variants:
  - Blocked cells
  - Forbidden cells
  - Pre-placed queens
  - Partial continuation solving
- Challenge generator:
  - Partially Filled
  - Constrained
  - Unique Continuation
  - Limited Clue
  - Easy / Medium / Hard
- Search Tree Visualizer (toggleable)
- Search Heatmap overlays:
  - Off
  - Exploration
  - Conflict
  - Solution Frequency
- Focus Mode (cinematic board-first mode)
- Hardware detection with intelligent solver recommendation
- One-click Apply Recommended Solver
- Live analytics + worker monitor + performance score cards
- Benchmark Lab mode for cross-algorithm comparison
- Stress Test mode for limit pushing and runtime profiling

## Screenshots

Add screenshots here as needed:

- Main solver dashboard
- Benchmark Lab
- Stress Test results
- Search Tree Visualizer
- Heatmap modes
- Focus Mode

## Tech Stack

- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- Framer Motion
- Radix/shadcn-style UI components
- Web Workers for parallel solver execution

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Install

```bash
npm install
```

### Run in Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Production Build

```bash
npm run build
npm run start
```

### Lint

```bash
npm run lint
```

## Usage Overview

1. Select board size in the main board panel.
2. Choose algorithm and search strategy.
3. Choose solving objective (first vs all).
4. Toggle symmetry and optional split depth controls.
5. Run solve actions and inspect live logs + analytics.
6. Use Benchmark Lab (`/benchmark`) for repeatable comparisons.
7. Use Stress Test mode to evaluate upper limits.
8. Use constraint editor/challenge generator for variant puzzles.
9. Toggle Search Tree / Heatmap for visual exploration insight.

## Folder Structure

```text
QueenMind/
  app/
    (dashboard)/
      page.tsx
    benchmark/
      page.tsx
    globals.css
    layout.tsx
  components/
    benchmark/
      benchmark-lab-shell.tsx
    chessboard/
      chessboard.tsx
      chess-cell.tsx
    dashboard/
      board-square.tsx
      chessboard-panel.tsx
      control-sidebar.tsx
      dashboard-shell.tsx
      education-panel.tsx
      hardware-info-card.tsx
      insights-sidebar.tsx
      search-tree-visualizer.tsx
      top-navbar.tsx
    ui/
      badge.tsx
      button.tsx
      card.tsx
      input.tsx
      label.tsx
      scroll-area.tsx
      separator.tsx
  data/
    dashboard-data.ts
  hooks/
    use-hardware-profile.ts
    use-nqueen-solver.ts
  lib/
    benchmark/
      run-benchmark.ts
      types.ts
    challenges/
      generator.ts
    parallel/
      parallel-solver.ts
      types.ts
      worker-pool.ts
    solvers/
      bitmaskSolver.ts
      branch-ordering.ts
      constraints.ts
      pruning.ts
      symmetry.ts
      types.ts
    stress/
      run-stress-test.ts
      types.ts
    system/
      hardware.ts
    chessboard.ts
    nqueen-solver.ts
    utils.ts
  types/
    chessboard.ts
    dashboard.ts
  workers/
    nqueen-parallel.worker.ts
```

## Documentation Index

- [Architecture](docs/ARCHITECTURE.md)
- [Features](docs/FEATURES.md)
- [Components](docs/COMPONENTS.md)
- [Algorithms](docs/ALGORITHMS.md)
- [Deployment](docs/DEPLOYMENT.md)
- [Changelog](CHANGELOG.md)

## Notes

- Heatmap overlays are intentionally disabled when Parallel Solver is selected for data accuracy and consistency.
- In constraint scenarios, non-classic modes are safely routed to classic solving for full constraint compatibility.
