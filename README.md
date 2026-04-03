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
  - Premium puzzle control-room UI with structured config, metadata, and reveal flow
- Premium Learn tab experience:
  - Sectioned concept tracks (N-Queen, Backtracking, Recursion, Optimization, Complexity, CSP framing)
  - Accordion deep dives and concept callout cards
  - Startup-style glow/gradient visual polish for learning surfaces
- Final global premium UI polish:
  - subtle spotlight/grid layering
  - glassmorphism panel refinement
  - smoother micro-interactions, status pulses, and premium tab/panel transitions
  - Easy / Medium / Hard
- Search Tree Visualizer (toggleable)
- Search Heatmap overlays:
  - Off
  - Exploration
  - Conflict
  - Solution Frequency
- Focus Mode (cinematic board-first mode)
- Premium dashboard shell:
  - left sidebar navigation with route/section tabs
  - top action bar with quick actions and live status badges
  - optional right context rail for analytics/context cards
  - responsive mobile navigation sheet
- Persistent lab runtime behavior:
  - solver/challenge/benchmark/insights surfaces stay mounted across route switches
  - hidden pages run with reduced non-critical update cadence to preserve responsiveness
  - visible page keeps board/control interactions prioritized
- Solver workspace UX:
  - left collapsible control rail (accordion groups)
  - grouped professional controls (Select/ToggleGroup/RadioGroup/Tooltip/Separator)
  - center board-first hero stage with polished playback controls
  - tabbed diagnostics surface (log/tree/heatmap) below the board
- Hardware detection with intelligent solver recommendation
- One-click Apply Recommended Solver
- Live analytics dashboard with sectioned metric cards, comparison tabs, advanced metrics accordion, and worker monitor
- Benchmark Lab mode for cross-algorithm comparison
- Stress Test mode for limit pushing and runtime profiling
- Dedicated Challenge Lab page (`/challenges`) for objective, constraints, challenge generation, and advanced controls
- Dedicated Insights Lab page (`/insights`) for full-width analytics review
- Insights telemetry delivery:
  - coalesced/throttled live updates during solving to keep dashboard responsive while still visibly updating

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
7. Use Challenge Lab (`/challenges`) for a dedicated advanced challenge workspace.
8. Use Insights Lab (`/insights`) for expanded analytics space.
9. Use Stress Test mode to evaluate upper limits.
10. Use constraint editor/challenge generator for variant puzzles.
11. Toggle Search Tree / Heatmap for visual exploration insight.

Board size options currently available in solver controls:
- `4, 6, 8, 10, 12, 14, 16, 18, 20`

Main solver page note:
- `Solving Objective` and `Parallel Split Depth` are grouped under `Search Strategy`.
- `Search Tree` and `Heatmap` toggles are grouped under `Visualization Tools`.

## Folder Structure

```text
QueenMind/
  app/
    (dashboard)/
      page.tsx
    benchmark/
      page.tsx
    challenges/
      page.tsx
    insights/
      page.tsx
    globals.css
    layout.tsx
  components/
    benchmark/
      benchmark-lab-shell.tsx
    challenges/
      challenge-lab-shell.tsx
    insights/
      insights-page-shell.tsx
    chessboard/
      chessboard.tsx
      chess-cell.tsx
    dashboard/
      board-square.tsx
      chessboard-panel.tsx
      control-sidebar.tsx
      dashboard-app-shell.tsx
      dashboard-shell.tsx
      education-panel.tsx
      hardware-info-card.tsx
      insights-sidebar.tsx
      navigation-sidebar.tsx
      search-tree-visualizer.tsx
      top-navbar.tsx
    effects/
      animated-grid-background.tsx
      glow-border.tsx
      gradient-overlay.tsx
      spotlight-background.tsx
      status-pulse.tsx
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
