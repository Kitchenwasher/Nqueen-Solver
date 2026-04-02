# Codebase Map

This document explains the current QueenMind codebase folder-by-folder and file-by-file, focused on what each important file does, why it exists, and what part of the app it affects.

## Quick Orientation

QueenMind is a Next.js App Router project with two main user surfaces:

- Solver Dashboard (`/`): interactive board, controls, analytics, visualizers
- Benchmark Lab (`/benchmark`): algorithm benchmarking + stress testing

Core architecture is split across:

- `app/` for routes/pages
- `components/` for UI
- `hooks/` for state/orchestration
- `lib/` for solver and domain logic
- `workers/` for Web Worker execution
- `types/` for shared contracts

## Root Configuration Files

### `.eslintrc.json`
- What: ESLint config extending Next.js + TypeScript rules.
- Why: Enforces code quality and consistency.
- Affects: Entire codebase lint behavior.

### `.gitignore`
- What: Git ignore rules.
- Why: Prevents build artifacts/dependencies from being committed.
- Affects: Repository hygiene.

### `package.json`
- What: Project metadata, scripts, dependencies.
- Why: Defines runtime/build toolchain and commands.
- Affects: Installation, dev server, production build/start.

### `package-lock.json`
- What: Exact dependency lockfile.
- Why: Reproducible installs.
- Affects: Dependency resolution stability.

### `tsconfig.json`
- What: TypeScript compiler settings (`strict`, path alias `@/*`, noEmit, etc.).
- Why: Strong typing + import ergonomics.
- Affects: Type checking and import paths.

### `next.config.mjs`
- What: Next.js configuration (`reactStrictMode: true`).
- Why: Enables stricter React checks in development.
- Affects: Global Next runtime behavior.

### `postcss.config.mjs`
- What: PostCSS setup for Tailwind processing.
- Why: Required Tailwind pipeline integration.
- Affects: CSS build pipeline.

### `tailwind.config.ts`
- What: Tailwind theme extension, content globs, CSS variable-based colors.
- Why: Central design system and utility generation.
- Affects: Styling utilities across all components.

### `components.json`
- What: shadcn/ui-style registry config.
- Why: Standardizes component aliases/theme integration.
- Affects: UI component scaffolding conventions.

### `next-env.d.ts`
- What: Next TypeScript environment declarations.
- Why: Framework-generated TS compatibility.
- Affects: TS compilation correctness.

### `README.md`
- What: Project overview and setup docs.
- Why: Onboarding and usage guidance.
- Affects: Developer onboarding.

### `CHANGELOG.md`
- What: Current-state and feature history summary.
- Why: Tracks major implemented capabilities.
- Affects: Release/context clarity.

## Pages (`app/`)

### `app/layout.tsx`
- What: Global app shell, metadata, fonts, and base body classes.
- Why: Shared layout and typography for all routes.
- Affects: Every page’s visual baseline.

### `app/globals.css`
- What: Global Tailwind layers, CSS variables, base styling, custom utility class (`mono`).
- Why: Defines app-wide theme tokens and global visual language.
- Affects: All styling and design consistency.

### `app/(dashboard)/page.tsx`
- What: Dashboard route entrypoint.
- Why: Keeps page-level route file thin and delegates to component shell.
- Affects: Main solver screen.

### `app/benchmark/page.tsx`
- What: Benchmark route entrypoint.
- Why: Separates benchmark/stress lab into dedicated route.
- Affects: Performance lab screen.

## Components (`components/`)

## Dashboard Components (`components/dashboard/`)

### `dashboard-shell.tsx`
- What: Top-level layout for dashboard mode.
- Why: Orchestrates major dashboard regions and focus mode toggling.
- Affects: How board, control sidebar, and insights sidebar are composed.

### `top-navbar.tsx`
- What: Sticky top navigation with route links and focus mode toggle.
- Why: Unified app-level navigation and state badges.
- Affects: Dashboard and benchmark navigation UX.

### `chessboard-panel.tsx`
- What: Main interaction panel: board controls, solver actions, constraints, challenge generator, heatmap/tree toggles, live log.
- Why: Central user command surface for solving.
- Affects: Most interactive runtime behavior of solver dashboard.

### `insights-sidebar.tsx`
- What: Analytics card stack (solver stats, pruning, symmetry, objective timings, worker monitor, performance score).
- Why: Turns raw solver state into actionable insights.
- Affects: Right analytics pane and system-awareness UX.

### `hardware-info-card.tsx`
- What: Hardware capability + recommendation card.
- Why: Makes solver mode adaptive to user device.
- Affects: Recommendation visibility inside insights.

### `search-tree-visualizer.tsx`
- What: Search-tree reconstruction from logs with replay/zoom/pan.
- Why: Teaches backtracking behavior visually.
- Affects: Advanced visualization panel under board.

### `control-sidebar.tsx`
- What: Static “runbook” instructions.
- Why: Beginner guidance without changing solver logic.
- Affects: Left guidance sidebar.

### `education-panel.tsx`
- What: Educational content tabs/highlights for N-Queen concepts.
- Why: Built-in learning context for users.
- Affects: Bottom knowledge section.

### `board-square.tsx`
- What: Simple square UI primitive with queen marker support.
- Why: Likely early/auxiliary board visual component.
- Affects: Currently not connected to active runtime flows.

## Chessboard Components (`components/chessboard/`)

### `chessboard.tsx`
- What: Board grid renderer resolving per-cell visual state and heatmap intensity.
- Why: Isolates board rendering from control logic.
- Affects: Main board visuals and click interaction routing.

### `chess-cell.tsx`
- What: Individual animated cell with queen markers/state styles/heatmap overlay.
- Why: Encapsulates per-cell motion and visual semantics.
- Affects: Board readability and animation quality.

## Benchmark Components (`components/benchmark/`)

### `benchmark-lab-shell.tsx`
- What: Benchmark and stress test UI plus results rendering.
- Why: Dedicated performance-lab workspace separate from interactive solver UI.
- Affects: `/benchmark` functionality end-to-end.

## UI Primitives (`components/ui/`)

### `badge.tsx`, `button.tsx`, `card.tsx`, `input.tsx`, `label.tsx`, `scroll-area.tsx`, `separator.tsx`
- What: Reusable styled primitives.
- Why: Consistent design tokens/composition across app.
- Affects: Visual consistency and code reuse across all screens.

## Hooks (`hooks/`)

### `use-nqueen-solver.ts`
- What: Core solver orchestration hook and runtime state machine.
- Why: Keeps complex solving/metrics behavior out of UI components.
- Affects:
  - algorithm selection and execution
  - phase transitions (`idle`, `solving`, `paused`, etc.)
  - logs, metrics, solution storage/navigation
  - objective timing
  - strategy/performance snapshots
  - parallel worker live state

### `use-hardware-profile.ts`
- What: Client hook that detects hardware profile and computes recommendation.
- Why: Encapsulates browser capability detection logic.
- Affects: Hardware info card and recommended solver UX.

## Utilities and Domain Logic (`lib/`)

## General Utilities

### `lib/utils.ts`
- What: Utility helpers (className merging helper used across components).
- Why: Common UI helper centralization.
- Affects: Styling utility usage in most components.

### `lib/chessboard.ts`
- What: Board-level helpers (cell key parsing, attacked cells, conflicts, validation).
- Why: Shared board math used by interactive UI and validation.
- Affects: Board state interpretation and status badges.

## Solver Core and Algorithms

### `lib/nqueen-solver.ts`
- What: High-level solve-first and find-all orchestration for classic/optimized paths, plus compatibility entrypoints.
- Why: Central interface to solver engines used by hooks and benchmark/stress.
- Affects: Base solver behavior and frame/progress emission.

### `lib/solvers/types.ts`
- What: Shared solver contracts (events, frames, options, results, symmetry/pruning stats).
- Why: Type-safe interfaces between solvers and orchestration layers.
- Affects: All solver modules + hook integration.

### `lib/solvers/bitmaskSolver.ts`
- What: Bitmask-based solver implementation (first and all solutions).
- Why: High-performance branch exploration with bit operations.
- Affects: Bitmask algorithm mode and related benchmark/stress runs.

### `lib/solvers/branch-ordering.ts`
- What: Search strategy ordering for columns/bits (left-to-right, center-first, heuristic).
- Why: Strategy logic reused across classic/optimized/bitmask/benchmark paths.
- Affects: Branch ordering and solve efficiency.

### `lib/solvers/constraints.ts`
- What: Constraint normalization/validation and row disallowed masks.
- Why: Supports blocked/forbidden/pre-placed variants cleanly.
- Affects: Constraint solving correctness and fallback behavior.

### `lib/solvers/pruning.ts`
- What: Dead-state detection and pruning effectiveness calculations.
- Why: Cuts impossible branches earlier and quantifies savings.
- Affects: Optimized/bitmask/parallel pruning performance and analytics.

### `lib/solvers/symmetry.ts`
- What: Root symmetry branch generation, mirror stats, mirror solution helper.
- Why: Reduces redundant mirrored search.
- Affects: Symmetry optimization behavior and analytics.

## Parallel Solver Runtime

### `lib/parallel/types.ts`
- What: Task/result/progress contracts for worker execution.
- Why: Typed boundary between main thread and workers.
- Affects: Parallel solver data shape integrity.

### `lib/parallel/worker-pool.ts`
- What: Reusable worker pool (task queueing, progress, stop/terminate lifecycle).
- Why: Multi-worker scheduling abstraction.
- Affects: Parallel throughput and lifecycle safety.

### `lib/parallel/parallel-solver.ts`
- What: Task splitting, adaptive depth, worker count selection, aggregation of results/metrics.
- Why: Main-thread parallel orchestration layer.
- Affects: Parallel solver mode performance and telemetry.

### `workers/nqueen-parallel.worker.ts`
- What: Worker-side DFS execution using bitmask pruning logic.
- Why: Moves expensive branch computation off UI thread.
- Affects: Smooth UI during parallel solves and multicore utilization.

## Benchmark and Stress

### `lib/benchmark/types.ts`
- What: Benchmark config/result/progress types.
- Why: Standardized benchmark contracts.
- Affects: Benchmark mode data integrity.

### `lib/benchmark/run-benchmark.ts`
- What: Benchmark runner across board sizes/algorithms/runs/objectives.
- Why: Repeatable algorithm comparison engine.
- Affects: Benchmark table/bar-chart data.

### `lib/stress/types.ts`
- What: Stress test config/result/progress types.
- Why: Defines stress-mode metrics and step outputs.
- Affects: Stress UI schema and summary cards.

### `lib/stress/run-stress-test.ts`
- What: Time-budgeted board-range sweep runner.
- Why: Determines max solvable N and performance envelope.
- Affects: Stress Test mode behavior and outputs.

## Challenge and System Modules

### `lib/challenges/generator.ts`
- What: Challenge board generator for multiple puzzle modes + difficulty.
- Why: Adds game-like replayable puzzle content.
- Affects: Challenge generation, reveal, and description flows in dashboard.

### `lib/system/hardware.ts`
- What: Hardware/profile detection and recommendation policy.
- Why: Adapts solver suggestions to device capability.
- Affects: Recommendation logic used by hardware hook/card.

## Shared Types (`types/`)

### `types/chessboard.ts`
- What: Board-size constants and domain enums (algorithm, strategy, mode, objective, heatmap types).
- Why: Canonical vocabulary across UI + solver logic.
- Affects: Type-safe config wiring across the app.

### `types/dashboard.ts`
- What: Analytics and performance map models for insights rendering.
- Why: Stable contract between `useNQueenSolver` and analytics UI.
- Affects: Insights panel and benchmark-like summary cards.

## Data (`data/`)

### `data/dashboard-data.ts`
- What: Static educational content shown in the Learn panel.
- Why: Keeps content separate from presentation code.
- Affects: Education panel copy/topics.

## State Management Map

There is no Redux/Zustand global store. State is managed through React state/hooks:

- `useNQueenSolver` = primary runtime state container for solving and analytics.
- Local UI state lives inside `chessboard-panel.tsx` (constraints, challenge controls, visualizer toggles).
- `dashboard-shell.tsx` holds top-level `analytics/performance/strategyPerformance` for passing into insights.
- `useHardwareProfile` handles hardware capability state.

## Styles Map

- Global tokens and base styles: `app/globals.css`
- Tailwind theme setup: `tailwind.config.ts`
- Component-level styling: Tailwind utility classes in TSX files
- UI primitive styles: `components/ui/*`

## Assets Map

Current repository has no dedicated static asset folder (`public/`) in use for images/icons in source files.

The UI relies on:
- vector icons from `lucide-react`
- CSS-based gradients/backgrounds
- component-level styling and motion effects

## Potentially Confusing or Duplicate Structures

1. `components/dashboard/board-square.tsx` appears unused
- It is not imported by runtime pages/components based on current source search.
- It may be a legacy or experimental component.

2. Two board-related component areas
- `components/chessboard/*` is the active board rendering stack.
- `components/dashboard/*` still contains board-adjacent helpers and controls.
- This split is valid but can be confusing for new contributors if not documented.

3. Constraint fallback behavior is implicit in hook logic
- In constrained runs, non-classic algorithm selections can route to classic for compatibility.
- This is correct behavior, but should be kept visible in docs/UI copy to avoid confusion.
