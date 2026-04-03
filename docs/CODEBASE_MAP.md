# Codebase Map

This document explains the current QueenMind codebase folder-by-folder and file-by-file, focused on what each important file does, why it exists, and what part of the app it affects.

## Quick Orientation

QueenMind is a Next.js App Router project with two main user surfaces:

- Solver Dashboard (`/`): interactive board, controls, analytics, visualizers
- Benchmark Lab (`/benchmark`): algorithm benchmarking + stress testing
- Challenge Lab (`/challenges`): dedicated advanced controls and challenge workflow surface
- Insights Lab (`/insights`): dedicated expanded analytics workspace

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

### `app/challenges/page.tsx`
- What: Challenge Lab route entrypoint.
- Why: Gives advanced controls/challenge workflows a dedicated full-space page.
- Affects: Challenge-centric solving UX.

### `app/insights/page.tsx`
- What: Insights Lab route entrypoint.
- Why: Gives dense telemetry a full-width dedicated page.
- Affects: Analytics readability and navigation flow.

## Components (`components/`)

## App Shell Components (`components/app-shell/`)

### `app-sidebar.tsx`
- What: `NavigationSidebar` wrapper.
- Why: Decouples shell composition from dashboard-specific component naming.
- Affects: Shared app-shell wiring in `DashboardAppShell`.

### `app-topbar.tsx`
- What: `TopNavbar` wrapper.
- Why: Keeps app shell API stable while allowing topbar implementation swaps.
- Affects: Shared page header/action bar composition.

### `page-header.tsx`
- What: Reusable page header abstraction.
- Why: Standardized title/subtitle + right-slot pattern for future section pages.
- Affects: Cross-page heading consistency where adopted.

### `section-card.tsx`
- What: Generic section card scaffold with title/description/header slot.
- Why: Avoids repeating Card header/content skeletons.
- Affects: Benchmark and future feature panel composition.

## Dashboard Components (`components/dashboard/`)

### `dashboard-shell.tsx`
- What: Top-level layout for dashboard mode.
- Why: Orchestrates major dashboard regions and focus mode toggling.
- Affects: How board, control sidebar, and insights sidebar are composed.
- Runtime note: passes route visibility to solver surface so hidden persisted pages can lower non-critical update cadence.

### `components/challenges/challenge-lab-shell.tsx`
- What: Dedicated challenge page shell using existing solver surface.
- Why: Provides a route-level workspace for constraint/challenge controls without changing solver logic.
- Affects: `/challenges` layout and navigation flow.

### `components/insights/insights-page-shell.tsx`
- What: Dedicated insights page shell using existing analytics wiring.
- Why: Provides route-level space for dense metrics while preserving logic.
- Affects: `/insights` layout and analytics presentation.

### `dashboard-app-shell.tsx`
- What: Shared premium shell used by dashboard and benchmark routes.
- Why: Centralizes left sidebar, top action bar, content transitions, responsive mobile sheet, and optional right context rail.
- Affects: Overall app information architecture and page-level layout consistency.

### `top-navbar.tsx`
- What: Sticky top action bar with title, quick actions, and live badges.
- Why: Unified command surface with responsive navigation entry and status telemetry.
- Affects: Dashboard and benchmark navigation UX.
### `navigation-sidebar.tsx`
- What: Left workspace navigation panel with route tabs, section jump actions, and active motion indicators.
- Why: Provides cleaner information architecture for solver/benchmark/challenges/insights/learn flows.
- Affects: Dashboard and benchmark page layout/navigation ergonomics.

### `chessboard-panel.tsx`
- What: Main interaction panel with a board-first 3-zone layout.
- Why: Keeps the board as the visual hero while still exposing all controls.
- Affects:
  - Left control rail on main page (Accordion groups for setup/algorithm/mode/symmetry/strategy/visualization)
  - Main-page strategy section includes solving objective + parallel split controls
  - Main-page visualization section includes tree + heatmap toggles
  - Challenge Lab surface renders the premium challenge control-room UI (3-panel challenge configuration/context/metadata-actions surface)
  - Center board zone (status strip, cinematic board container, playback controls)
  - Diagnostics tabs below board (Live Log, Search Tree, Heatmap context)
  - Uses structured shadcn primitives (`Select`, `ToggleGroup`, `RadioGroup`, `Separator`) for clearer control intent
  - Supports `defaultAdvancedOpen` prop so advanced accordion can be expanded by default on challenge-focused surfaces
  - Uses `isVisible` to adapt telemetry publish cadence for persistent multi-page mode

### `insights-sidebar.tsx`
- What: Sectioned analytics dashboard with grouped cards, comparison tabs, progress visuals, and advanced accordion metrics.
- Why: Turns dense solver telemetry into scan-friendly panels.
- Affects: Right analytics pane and system-awareness UX; supports full-page mode when mounted in Insights Lab.
- Runtime note: wrapped via memoized insights rail wrapper to reduce re-renders from parent updates.

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
- Affects: Bottom knowledge section with premium tabbed concept tracks, keyword badges, accordion deep dives, and upgraded glow/gradient visual polish.

### `board-square.tsx`
- What: Simple square UI primitive with queen marker support.
- Why: Likely early/auxiliary board visual component.
- Affects: Currently not connected to active runtime flows.

## Chessboard Components (`components/chessboard/`)

### `chessboard.tsx`
- What: Board grid renderer resolving per-cell visual state and heatmap intensity inside a premium glass/spotlight frame.
- Why: Isolates board rendering from control logic.
- Affects: Main board visuals and click interaction routing.

### `chess-cell.tsx`
- What: Individual animated cell with premium tile styling, queen markers, state overlays, and heatmap overlay.
- Why: Encapsulates per-cell motion and visual semantics.
- Affects: Board readability and animation quality.

## Benchmark Components (`components/benchmark/`)

### `benchmark-lab-shell.tsx`
- What: Benchmark and stress test UI plus results rendering.
- Why: Dedicated performance-lab workspace separate from interactive solver UI.
- Affects: `/benchmark` functionality end-to-end, including internal `Benchmark`/`Stress Test` tab flows.

### `components/benchmark/panels/*`
- What: reusable benchmark UI sections.
- Why: splits large benchmark JSX into maintainable panel units.
- Affects:
  - `benchmark-config-panel.tsx`: benchmark configuration surface wrapper
  - `benchmark-results-table.tsx`: results + comparison surface wrapper
  - `stress-test-panel.tsx`: stress-run configuration/result wrapper
  - `benchmark-summary-cards.tsx`: summary KPI card composition

## Solver Presentation Components (`components/solver/`)

### `solver-board.tsx`
- What: `Chessboard` wrapper with stable solver-facing prop surface.
- Why: isolates board presentation from solver panel internals.
- Affects: center board zone composition in `chessboard-panel.tsx`.
- Runtime note: memoized wrapper to avoid avoidable parent-triggered board rerenders.

### `solver-controls.tsx`
- What: left-rail control container wrapper.
- Why: standardizes control-rail framing/styling.
- Affects: solver control panel hierarchy.

### `solver-status-bar.tsx`
- What: status-badge row wrapper.
- Why: centralizes status strip layout semantics.
- Affects: board header telemetry layout.

### `solver-playback-bar.tsx`
- What: playback/action row wrapper.
- Why: keeps action-toolbar visuals reusable and consistent.
- Affects: solve/run action section under board.

### `algorithm-selector.tsx`, `strategy-selector.tsx`, `constraint-editor.tsx`
- What: segmented-selector wrappers for control intents.
- Why: consistent selector contracts across solver control groups.
- Affects: algorithm/strategy/constraint UI wiring.

### `parallel-controls.tsx`
- What: grouped wrapper for parallel-specific controls.
- Why: isolates advanced parallel UI from generic control flow.
- Affects: split-depth/manual-depth control section.

### `search-tree-panel.tsx`
- What: visibility-aware wrapper around search tree visualizer.
- Why: keeps tree toggling/render fallback logic encapsulated.
- Affects: diagnostics tab composition.

### `heatmap-panel.tsx`
- What: grouped wrapper for heatmap selector controls.
- Why: isolates heatmap control block for reuse/extensibility.
- Affects: heatmap mode controls and disabled-state messaging.

### `challenge-panel.tsx`
- What: reusable challenge card scaffold.
- Why: supports future extraction of challenge UI into a dedicated module.
- Affects: challenge UX composition readiness.

## Insights Composition Components (`components/insights/`)

### `insights-rail.tsx`
- What: `InsightsSidebar` wrapper.
- Why: decouples dashboard shell from concrete insights implementation.
- Affects: right-rail composition API.

### `metric-card.tsx`, `insight-cards.tsx`
- What: reusable metric/card abstractions for insights sections.
- Why: prepares insights UI for smaller componentized cards.
- Affects: scalable analytics panel composition.

## Shared Architecture Primitives (`components/shared/`)

### `status-badge.tsx`
- What: standardized status badge renderer.
- Why: avoids duplicated badge semantics across sections.
- Affects: cross-feature status labeling consistency.

### `glow-card.tsx`
- What: reusable glow-card wrapper.
- Why: shared premium visual treatment without duplicating classes.
- Affects: metrics and summary cards.

### `section-header.tsx`
- What: reusable title + description row.
- Why: keeps section heading hierarchy consistent.
- Affects: cards/panels requiring lightweight headers.

### `empty-state.tsx`
- What: generic empty-state surface.
- Why: standard fallback messaging for data panels.
- Affects: benchmark/insights/log views where adopted.

### `loading-skeleton.tsx`
- What: reusable skeleton loader composition.
- Why: avoids repeated skeleton markup.
- Affects: loading placeholders in benchmark/solver flows.

### `control-group.tsx`
- What: reusable control-group wrapper with title/description.
- Why: structured grouping for dense control panels.
- Affects: advanced/parallel configuration sections.

### `segmented-selector.tsx`
- What: generic segmented control abstraction.
- Why: one selector API for algorithms, strategies, and modes.
- Affects: consistent selection UI behavior.

## UI Primitives (`components/ui/`)

### `badge.tsx`, `button.tsx`, `card.tsx`, `input.tsx`, `label.tsx`, `scroll-area.tsx`, `separator.tsx`
- What: Reusable styled primitives.
- Why: Consistent design tokens/composition across app.
- Affects: Visual consistency and code reuse across all screens.

### `table.tsx`
- What: Shared table primitive wrappers (`Table`, `TableHeader`, `TableRow`, `TableCell`, etc.).
- Why: Keeps data-heavy analytics views consistent and easy to compose.
- Affects: Benchmark results and stress per-N breakdown rendering.

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
- Current supported sizes: `4, 6, 8, 10, 12, 14, 16, 18, 20`.

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
- `lib/solver-telemetry-store.ts` holds persisted analytics snapshots shared between solver shell and insights shells.
- Insights shells consume telemetry via selector-style subscription helper to reduce broad rerenders.
- `useHardwareProfile` handles hardware capability state.

## Styles Map

- Global tokens and base styles: `app/globals.css`
- Tailwind theme setup: `tailwind.config.ts`
- Component-level styling: Tailwind utility classes in TSX files
- UI primitive styles: `components/ui/*`
- Includes premium utility layer for subtle motion/effects:
  - card lift
  - glass elevation
  - hover shine
  - status pulse
  - shimmer skeleton

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

