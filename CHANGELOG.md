# Changelog

All notable changes to QueenMind are documented in this file.

## [Current State] - 2026-04-03

### Improved

- Performance and persistence tuning across persistent labs:
  - throttled/coalesced runtime-to-UI updates during active solving
  - adaptive update cadence for visible vs hidden lab surfaces
  - selector-style telemetry subscriptions for reduced re-render scope in insights surfaces
  - additional memo boundaries on heavy insights/solver presentation wrappers
- Insights live update responsiveness:
  - insights now publish continuous telemetry during solves (without UI starvation from repeated timer resets)
- Tooltip rendering reliability:
  - moved tooltip content to portal rendering to prevent clipped/bleeding hint text inside overflowed cards
- Expanded board-size support surfaced in controls:
  - `4, 6, 8, 10, 12, 14, 16, 18, 20`

### Notes

- Solver algorithms and solving logic were not changed in this update.
- Persistence behavior remains enabled and backward-compatible; only update cadence and render flow were optimized.

## [Current State] - 2026-04-02

### Added

- Multi-algorithm solving support:
  - Classic Backtracking
  - Optimized Solver
  - Bitmask Solver
  - Parallel Solver (Web Worker pool)
- Solving objectives:
  - Fastest First Solution
  - Enumerate All Solutions
- Search strategy system:
  - Left to Right
  - Center First
  - Heuristic Search
- Symmetry optimization support with analytics
- Early dead-state pruning with branch-pruning analytics
- Adaptive parallel split depth with manual override
- Live worker monitor for parallel execution
- Hardware detection and solver recommendations
- One-click Apply Recommended Solver action
- Benchmark Lab mode (`/benchmark`) with result table + chart bars
- Stress Test mode with time-bounded board-range sweeps
- Constraint variant support:
  - blocked cells
  - forbidden cells
  - pre-placed queens
  - continuation solving
- Challenge/Puzzle generator:
  - partially-filled
  - constrained
  - unique continuation
  - limited clue
  - difficulty levels (easy/medium/hard)
- Search Tree Visualizer panel with pan/zoom/replay
- Search Heatmap overlays (exploration/conflict/solution frequency)
- Focus Mode (cinematic board-first presentation)
- Performance score / efficiency badge system

### Improved

- Solver analytics depth and breadth (timings, objective metrics, strategy snapshots, symmetry/pruning metrics, parallel telemetry)
- Visual and interaction polish for board-first workflows
- Large-board responsiveness with solution storage capping
- Premium UI architecture refactor:
  - new left navigation sidebar across dashboard and benchmark views
  - top action bar visual redesign with live solver/hardware/multi-algorithm badges
  - shared dashboard app shell (`DashboardAppShell`) for consistent layout and transitions
  - responsive mobile navigation sheet + desktop sidebar behavior
  - animated active page/section indicators in navigation
  - optional right context rail integrated into benchmark and solver pages
  - board-first glassmorphism layout with improved spacing and hierarchy
  - solver page upgraded to a 3-zone board-first workspace:
    - collapsible left control rail (Accordion groups)
    - cinematic center board zone with polished playback controls
    - right insights rail context pairing
  - diagnostics below board now use tabbed surfaces (Live Log / Search Tree / Heatmap)
  - advanced options now include hover tooltips for quicker discoverability
  - control panel upgraded to grouped professional controls using shadcn-style primitives:
    - `Select` for board setup
    - `ToggleGroup` for algorithm/strategy/objective/constraint modes
    - `RadioGroup` for solve mode and challenge difficulty
    - `Separator` and microcopy for clearer hierarchy
  - collapsible advanced controls in solver panel
  - board presentation redesigned with premium cinematic styling:
    - glass/spotlight board container with inner glow
    - enhanced tile contrast and hover polish
    - upgraded queen icon animation and visual depth
    - richer state overlays (attacked/blocked/forbidden/conflicting/trying)
    - subtle active row/column emphasis during traversal
  - feature jump links for Challenges, Insights, Learn, and Settings sections
  - insights sidebar upgraded to sectioned analytics dashboard:
    - grouped cards for status/performance/hardware/runtime/symmetry/comparisons/parallel telemetry
    - tabbed comparison views and advanced metrics accordion
    - status badges, metric tooltips, and progress bars for better scanability
  - insights visual polish pass:
    - animated entry and subtle gradient backdrop layering
    - compact scrollable metrics column for dense telemetry
    - hover-shine card feedback and stronger KPI number emphasis

### Documentation

- Added meaningful internal docstrings/comments across core frontend and solver code to improve maintainability:
  - solver orchestration hook and runtime state flow
  - classic/optimized/bitmask/parallel solver internals
  - worker-pool and worker-side execution assumptions
  - complex UI logic (board panel controls, search tree visualizer, board state rendering)
  - utility/system modules (constraints, pruning, symmetry, hardware detection, benchmark/stress runners)

### Notes

- Heatmap overlays are disabled in Parallel Solver mode to avoid inaccurate merged telemetry.
- Constraint-heavy solves safely fall back to classic compatibility path where required.

### Benchmark Lab UI Upgrade

- Refactored `Benchmark Lab` into an internal tabbed workspace:
  - `Benchmark` tab for matrix runs and comparisons
  - `Stress Test` tab for load-limit exploration
- Upgraded benchmark/stress controls to shadcn interaction primitives:
  - `Tabs`, `Select`, `ToggleGroup`, `Tooltip`, `Progress`
- Upgraded data surfaces to shadcn-style tables with scroll containers:
  - benchmark results table
  - per-N stress breakdown table
- Added animated run-state indicators and progress bars for both benchmark and stress execution.
- Added compact stress summary emphasis including:
  - max solved N
  - total time
  - estimated speedup
  - nodes/sec
  - total solutions

### Challenge Generator UI Polish

- Refactored challenge/puzzle generator controls into a premium “Puzzle Control Room” layout.
- Added structured three-zone challenge interface:
  - left: challenge configuration (mode + difficulty)
  - center: challenge-board context panel with active mode/difficulty/edit-state badges
  - right: metadata, constraint counts, and actions
- Upgraded challenge actions with premium CTA styling:
  - `Generate Challenge` as primary glow action
  - `Reveal Solution` as secondary outlined action
- Added contextual tooltips and compact challenge details accordion for better readability.
- No challenge generation logic or solver behavior was changed.

### Challenge Generator Visual Premium Pass

- Applied a second premium polish pass focused on startup-dashboard aesthetics:
  - richer glass gradients and layered glow treatment
  - stronger section hierarchy and spacing rhythm
  - improved difficulty pill presentation and metadata readability
  - refined action row with premium primary CTA styling
- Scope remained UI-only in `ChessboardPanel`; challenge logic and handlers were unchanged.

### Learn Tab Educational Refactor

- Refactored Learn tab into a modern educational experience with premium shadcn-style layout.
- Added dedicated concept sections:
  - What is N-Queen?
  - Backtracking
  - Recursion
  - Optimization
  - Complexity
  - Constraint Satisfaction framing
- Upgraded content surfaces with:
  - section tabs
  - concept cards and keyword badges
  - collapsible deep-dive accordions
  - polished callout blocks and separators
- No backend or solver logic changes; UI/content rendering refactor only.

### Learn Tab Visual Premium Pass

- Applied a focused visual polish pass to the Learn tab for stronger funded-startup dashboard aesthetics.
- Added layered visual depth with gradient overlays and glow framing.
- Refined concept cards, tab strip presentation, and deep-dive panels for cleaner hierarchy and readability.
- Enhanced educational callout and snapshot cards with premium shadows/border accents.
- Logic and learning data flow remained unchanged.

### Final Global Premium Visual Polish

- Applied a final design-system level polish pass across the app using subtle Magic UI / Aceternity-inspired effects.
- Improved global visual foundation:
  - refined spotlight/gradient layering
  - enhanced glassmorphism panel treatment
  - subtle card lift and premium border glow utilities
- Upgraded shared primitives for consistent micro-interactions:
  - smoother button hover/press states with shine and lift
  - animated badge transitions
  - premium tab content transitions
  - shimmer-enhanced skeleton loading surface
- Improved live-state clarity:
  - status pulse added to active solver phase badge
- Enhanced benchmark empty/loading experience with premium empty-state + skeleton placeholders.
- No business logic or algorithm behavior was changed.

### Frontend Architecture Refactor (Composable UI Layers)

- Reorganized frontend into reusable component layers to separate layout composition from feature logic.
- Added new folders and reusable modules:
  - `components/app-shell/*` for shell-level composition wrappers
  - `components/shared/*` for cross-surface UI building blocks
  - `components/solver/*` for solver-focused presentational modules
  - `components/insights/*` for insights composition wrappers/cards
  - `components/benchmark/panels/*` for benchmark surface modules
- Wired key screens to architecture wrappers without changing behavior:
  - `DashboardAppShell` now uses app-shell wrappers (`AppTopbar`, `AppSidebar`)
  - `DashboardShell` now uses `InsightsRail` wrapper
  - `ChessboardPanel` now composes with solver-level wrappers (`SolverBoard`, `SolverControls`, `SolverStatusBar`, `SolverPlaybackBar`, `ConstraintEditor`, `AlgorithmSelector`, `StrategySelector`, `ParallelControls`, `SearchTreePanel`, `HeatmapPanel`)
  - Benchmark tab surfaces now compose via `BenchmarkConfigPanel` and `BenchmarkResultsTable`
  - Stress tab surfaces now compose via `StressTestPanel`
  - Benchmark summary cards use panelized summary components
- Solver algorithms and runtime behavior were not modified.

### Dedicated Challenge Lab Page

- Added new route: `/challenges` with a dedicated page shell for advanced controls/challenge workflows.
- Added `ChallengeLabShell` (`components/challenges/challenge-lab-shell.tsx`) using existing solver UI logic.
- Reused `ChessboardPanel` with UI-only prop `defaultAdvancedOpen` so the E-H advanced accordion opens by default on the challenge page.
- Extended sidebar page navigation to include `Challenge Lab`.
- No solver algorithms, runtime outputs, or event-handler logic were changed.

### Main Solver Control Layout Cleanup

- Removed the E-H advanced challenge section from the main solver page.
- Kept `Constraint Editor` and `Challenge Generator` in dedicated `/challenges` page only.
- Moved `Solving Objective` and `Parallel Split Depth` controls under `D. Search Strategy` on main solver page.
- Grouped `Search Tree Visualizer` and `Search Heatmap` into a unified `E. Visualization Tools` section on main solver page.
- Sidebar workspace `Challenges` item on solver page now routes to `/challenges`.
- Logic/algorithms/state behavior unchanged; UI composition only.

### Insights Lab Page + Metrics Reordering

- Added new route: `/insights` with a dedicated full-page analytics workspace.
- Added `InsightsPageShell` (`components/insights/insights-page-shell.tsx`) reusing existing analytics wiring from solver panel output.
- Extended sidebar page navigation to include `Insights Lab`.
- Added `fullPage` presentation mode to `InsightsSidebar` to remove tight-height constraints on dedicated page.
- Reordered insight cards so `Runtime Counters` appears as section `2` (after Solver Status).
- Solver page right insights rail now intentionally shows only sections `1` and `2` for compact readability.
- Insights Lab page now shows analytics only (board/control surfaces removed).
- Compact solver insights rail no longer keeps unnecessary fixed-height empty space when showing only primary sections.
- No metric computation logic, solver behavior, or algorithms were changed.

### Cross-Page Navigation UX

- Added quick navigation actions on Benchmark page header area:
  - Open Solver
  - Open Challenge Lab
  - Open Insights
- Added `Open Insights` quick action to Challenge Lab page.
- Purpose: ensure easy movement between major labs without relying on context-specific workspace links.
