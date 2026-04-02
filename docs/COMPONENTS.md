# Components

This document maps the frontend component structure and how each major UI piece is used.

## Navigation Shell

## `app/layout.tsx`
- Purpose: Global root layout for all routes.
- Props: `children: React.ReactNode`.
- Responsibilities: Applies fonts, metadata, and app-wide body styling.
- Used in: Entire app.

## `components/dashboard/top-navbar.tsx`
- Purpose: Top command bar and route status header.
- Props: `title`, `subtitle`, `showFocusToggle?`, `focusMode?`, `onToggleFocusMode?`, `onOpenNavigation?`, `quickActions?`, `solverLiveLabel?`, `hardwareLabel?`, `multiAlgorithmEnabled?`.
- Responsibilities: app title area, quick actions, live status badges, hardware badge, mobile nav trigger, focus toggle.
- Used in: Dashboard and Benchmark layouts.

## `components/dashboard/navigation-sidebar.tsx`
- Purpose: Left sidebar workspace navigation.
- Props: `className?`, `activeSection?`, `onSectionNavigate?`.
- Responsibilities: route tabs (Solver/Benchmark/Challenge Lab/Insights Lab), section tabs (Solver/Challenges/Learn/Insights/Settings), active motion indicator.
- Related logic: route detection, section jump callbacks, benchmark-to-solver deep links.
- Used in: `DashboardAppShell` (desktop and mobile sheet).

## `components/dashboard/dashboard-app-shell.tsx`
- Purpose: Shared premium dashboard frame for both main routes.
- Props: page metadata (`page`, `title`, `subtitle`), layout slots (`children`, `rightPanel`), behavior toggles (`focusMode`, `showFocusToggle`), section navigation (`activeSection`, `onSectionNavigate`), quick actions and live labels.
- Responsibilities:
  - animated premium background/effects layer
  - sticky top action bar
  - responsive sidebar behavior (desktop + mobile sheet)
  - main content transition wrapper
  - optional right context rail
- Child components: `AppTopbar`, `AppSidebar`, effect components, `Sheet`.
- Used in: `DashboardShell`, `BenchmarkLabShell`.

## `components/app-shell/*`
- Purpose: shell-level abstraction components.
- Components:
  - `app-sidebar.tsx` -> wrapper for sidebar navigation
  - `app-topbar.tsx` -> wrapper for top navigation bar
  - `page-header.tsx` -> reusable page header line
  - `section-card.tsx` -> reusable section card scaffold
- Responsibilities: separates app-wide layout composition from page logic.

## Pages and Entry Shells

## `app/(dashboard)/page.tsx`
- Purpose: Solver dashboard route entry.
- Responsibilities: Renders `DashboardShell`.

## `app/benchmark/page.tsx`
- Purpose: Benchmark route entry.
- Responsibilities: Renders `BenchmarkLabShell`.

## `app/challenges/page.tsx`
- Purpose: Challenge lab route entry.
- Responsibilities: Renders `ChallengeLabShell`.

## `app/insights/page.tsx`
- Purpose: Insights lab route entry.
- Responsibilities: Renders `InsightsPageShell`.

## `components/dashboard/dashboard-shell.tsx`
- Purpose: Main dashboard composition controller.
- Props: none.
- Responsibilities:
  - uses `DashboardAppShell` for page framing
  - board-first center content
  - optional right insights rail (context panel slot)
  - learn panel below center content
  - focus mode layout switching
- Related child components: `DashboardAppShell`, `ChessboardPanel`, `ControlSidebar`, `InsightsSidebar`, `EducationPanel`.
- Related state: `focusMode`, analytics/performance snapshots passed to insights.

## Solver UI

## `components/dashboard/chessboard-panel.tsx`
- Purpose: Primary solver interaction surface.
- Props: `className?: string`, `focusMode?: boolean`, `defaultAdvancedOpen?: boolean`, `onAnalyticsChange?: (...) => void`.
- Responsibilities:
  - board-first 3-zone composition inside the solver surface
  - left control rail with collapsible Accordion groups
  - center hero board stage with status strip + playback controls
  - tabbed diagnostics surface (Live Log / Search Tree / Heatmap)
  - search strategy, objective, and parallel split controls grouped together on main solver page
  - visualization controls grouped under a dedicated `Visualization Tools` accordion section
  - challenge generation and constraint editing (challenge page surface)
  - premium challenge control-room UI (config panel, board-context panel, metadata/actions panel) in Challenge Lab
  - premium visual treatment for challenge section (glow layering, stronger CTA emphasis, polished badges)
  - solve actions (first/all/objective, pause/resume/step/reset)
  - advanced options with tooltip guidance
- Related child components: `Chessboard`, `SearchTreeVisualizer`, `Accordion`, `Tabs`, `Tooltip`, `ScrollArea`, core UI primitives.
- Current architecture wrappers used in composition:
  - `SolverBoard`, `SolverControls`, `SolverStatusBar`, `SolverPlaybackBar`
  - `ConstraintEditor`, `AlgorithmSelector`, `StrategySelector`, `ParallelControls`
  - `SearchTreePanel`, `HeatmapPanel`
- Control surface primitives now used directly in this component:
  - `Select` (board setup)
  - `ToggleGroup` (algorithm/strategy/objective/constraint modes)
  - `RadioGroup` (solve mode/challenge difficulty)
  - `Separator` (advanced grouping)
- Related state/logic: local UI state + `useNQueenSolver` orchestration output.
- Used in: `DashboardShell` center column, `ChallengeLabShell`.

## `components/challenges/challenge-lab-shell.tsx`
- Purpose: Dedicated challenge/advanced-controls page shell.
- Props: none.
- Responsibilities:
  - Uses `DashboardAppShell` with challenge-focused page metadata.
  - Reuses `ChessboardPanel` with `focusMode` + `defaultAdvancedOpen` + `surface=\"challenge\"` to prioritize constraint/challenge controls.
  - Provides quick actions to jump back to Solver and Benchmark.
- Used in: `/challenges`.

## `components/insights/insights-page-shell.tsx`
- Purpose: Dedicated insights page shell with expanded analytics layout.
- Props: none.
- Responsibilities:
  - Uses `DashboardAppShell` with insights-focused page metadata.
  - Reuses existing analytics wiring from `ChessboardPanel` output.
  - Renders `InsightsRail` in full-page mode for higher readability.
  - Keeps metric logic unchanged while increasing available space.
- Used in: `/insights`.

## Board Rendering

## `components/chessboard/chessboard.tsx`
- Purpose: N x N board renderer.
- Props: board/solver visual props (queens, conflicts, heatmap data, active cell, click handler).
- Responsibilities: premium board frame rendering, cell-state resolution, board grid rendering, active axis emphasis support.
- Child components: `ChessCell`.
- Used in: `ChessboardPanel`.

## `components/chessboard/chess-cell.tsx`
- Purpose: Individual animated square.
- Props: row/col visual state, heatmap intensity/count, active/disabled, click callback.
- Responsibilities: premium tile styling, queen/marker rendering, animated transitions, heatmap overlays, and transient traversal highlights.
- Used in: `Chessboard`.

## Insights and Analytics

## `components/insights/*`
- Purpose: insights composition wrappers and reusable insight cards.
- Components:
  - `insights-rail.tsx` (wrapper around main rail)
  - `metric-card.tsx`
  - `insight-cards.tsx` (`HardwareCard`, `RuntimeStatsCard`, `ComparisonCard`, `WorkerMonitorCard`)
- Responsibilities: prepares insights surface for scalable card-level composition.

## `components/dashboard/insights-sidebar.tsx`
- Purpose: Right analytics rail.
- Props: `analytics`, `performance`, `strategyPerformance`, `className?`, `fullPage?`.
- Responsibilities: premium sectioned analytics dashboard (status/performance/hardware/runtime/symmetry/comparisons/parallel telemetry), with tabs, progress bars, tooltips, and advanced accordion.
- Presentation modes:
  - solver rail mode: compact sections (1 and 2 only)
  - full-page mode: full analytics stack
- Child components: `HardwareInfoCard`, `Card`, `Badge`, `Tabs`, `Accordion`, `Tooltip`, `Progress`, `Separator`.
- Used in: `DashboardShell` right rail.

## `components/dashboard/hardware-info-card.tsx`
- Purpose: Hardware detection and recommendation card.
- Props: `currentAlgorithm`, `compactCardClass`.
- Responsibilities: show hardware thread/memory/capability profile and suggested solver mode.
- Used in: `InsightsSidebar`.

## Search Visualization

## `components/dashboard/search-tree-visualizer.tsx`
- Purpose: Visual replay of search/backtracking tree.
- Props: `logs`, `phase`, `boardSize`.
- Responsibilities: build sampled tree graph, replay controls, pan/zoom/reset interactions.
- Used in: `ChessboardPanel` (toggleable).

## Learn and Guidance

## `components/dashboard/control-sidebar.tsx`
- Purpose: Quick runbook / guidance card.
- Props: `className?`.
- Responsibilities: static usage steps.
- Used in: `DashboardShell` center column under board.

## `components/dashboard/education-panel.tsx`
- Purpose: Learn/Explain module.
- Props: none.
- Responsibilities: premium educational layout with section tabs, concept cards, keyword badges, accordion deep dives, and layered glow/gradient visual framing.
- Data source: `data/dashboard-data.ts`.
- Used in: `DashboardShell` learn section.

## `components/dashboard/board-square.tsx`
- Purpose: simple board-square primitive.
- Note: currently not used in runtime rendering flow.

## Benchmarking and Stress UI

## `components/benchmark/benchmark-lab-shell.tsx`
- Purpose: Benchmark + Stress Test page shell.
- Props: none.
- Responsibilities:
  - internal lab tabs (`Benchmark` / `Stress Test`)
  - benchmark configuration and execution
  - stress-test configuration and execution
  - run-state badges/progress indicators
  - result cards, shadcn-style tables, and bar-style comparisons
  - composition through benchmark panel wrappers (`BenchmarkConfigPanel`, `BenchmarkResultsTable`, `StressTestPanel`, `BenchmarkSummaryCards`)
- Related logic: `runBenchmark`, `runStressTest`.
- Used in: `/benchmark`.

## `components/benchmark/panels/*`
- Purpose: benchmark panel-level composition building blocks.
- Components:
  - `benchmark-config-panel.tsx`
  - `benchmark-results-table.tsx`
  - `benchmark-summary-cards.tsx`
  - `stress-test-panel.tsx`
- Responsibilities: supports splitting benchmark page UI into reusable sections.

## Shared Architecture Components (`components/shared/*`)
- `status-badge.tsx`
- `glow-card.tsx`
- `section-header.tsx`
- `empty-state.tsx`
- `loading-skeleton.tsx`
- `control-group.tsx`
- `segmented-selector.tsx`
- Responsibilities: reusable visual and interaction scaffolds used across solver/benchmark/insights.

## Shared UI Primitives (`components/ui/*`)

- `button.tsx`, `badge.tsx`, `card.tsx`, `input.tsx`, `label.tsx`, `scroll-area.tsx`, `separator.tsx`
- Purpose: reusable shadcn-style primitives for consistent design system and interactions.
- Additional benchmark-heavy primitives in use:
  - `tabs.tsx`, `toggle-group.tsx`, `select.tsx`, `progress.tsx`, `tooltip.tsx`, `table.tsx`
- Recent polish updates:
  - upgraded button press/hover micro-interactions
  - badge motion polish
  - card lift/glass refinement
  - animated tab-content transitions
  - shimmer skeleton treatment

## Hook Dependencies (Frontend Wiring)

## `hooks/use-nqueen-solver.ts`
- Frontend role: central runtime state machine for solver controls, phase, metrics, logs, and solution navigation.
- Used in: `ChessboardPanel`.

## `hooks/use-hardware-profile.ts`
- Frontend role: client-only hardware profile detection + recommendation.
- Used in: `ChessboardPanel`, `HardwareInfoCard`.

## Major Group Summary

- Navigation: `TopNavbar` + `NavigationSidebar`
- Solver workspace: `DashboardShell` + `ChessboardPanel` + board primitives
- Analytics: `InsightsSidebar` + `HardwareInfoCard`
- Learning: `ControlSidebar` + `EducationPanel`
- Benchmark/Stress: `BenchmarkLabShell`
