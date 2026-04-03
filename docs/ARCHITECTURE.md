# Architecture

## High-Level Structure

QueenMind is a client-side interactive Next.js App Router application organized around two major surfaces:

- Solver Dashboard (`/`): interactive board, controls, logs, and insights
- Benchmark Lab (`/benchmark`): repeatable performance comparison and stress testing
- Challenge Lab (`/challenges`): dedicated advanced controls workspace focused on constraints and challenge generation
- Insights Lab (`/insights`): full-width analytics workspace with more readable telemetry density

The architecture is intentionally modular:

- UI/state orchestration in React hooks/components
- Solver engines and optimization logic in `lib/`
- Parallel execution runtime in `lib/parallel` + `workers/`
- Shared domain types in `types/`

## Runtime Layers

1. App Layer
- `app/layout.tsx`: global shell (fonts, metadata, global CSS)
- `app/(dashboard)/page.tsx`: dashboard entry
- `app/benchmark/page.tsx`: benchmark entry
- `app/challenges/page.tsx`: challenge lab entry
- `app/insights/page.tsx`: insights lab entry

2. Presentation Layer
- `components/dashboard/*`: main solver experience
- `components/chessboard/*`: board rendering primitives
- `components/benchmark/*`: benchmark + stress test UI
- `components/ui/*`: reusable styled building blocks
- `components/app-shell/*`: shell composition wrappers
- `components/shared/*`: cross-surface reusable UI primitives
- `components/solver/*`: solver-focused presentation modules
- `components/insights/*`: insights composition wrappers/cards
- `components/dashboard/dashboard-app-shell.tsx`: shared premium shell (sidebar, top bar, content rail, right context rail)
- `components/dashboard/navigation-sidebar.tsx`: shared left navigation/workspace switcher + section jumps

3. State + Control Layer
- `hooks/use-nqueen-solver.ts`: main solver state machine, metrics aggregation, mode/objective control, solution lifecycle
- `hooks/use-hardware-profile.ts`: browser capability detection and recommendation memoization
- `lib/solver-telemetry-store.ts`: persisted telemetry snapshot with selector-based subscription helper for low-overhead insights updates

4. Domain + Solver Layer
- `lib/nqueen-solver.ts`: classic and optimized recursive engines, solve-first + find-all flows
- `lib/solvers/bitmaskSolver.ts`: bitwise solver implementation
- `lib/solvers/*`: search strategy, symmetry, pruning, constraint normalization/validation, shared solver contracts

5. Parallel Runtime Layer
- `lib/parallel/parallel-solver.ts`: task generation, adaptive split depth, worker orchestration, result aggregation
- `lib/parallel/worker-pool.ts`: reusable worker pool lifecycle and scheduling
- `workers/nqueen-parallel.worker.ts`: isolated DFS worker execution

6. Feature Modules
- `lib/benchmark/*`: benchmark execution model/types
- `lib/stress/*`: stress sweep execution/types
- `lib/challenges/generator.ts`: challenge construction and uniqueness filtering
- `lib/system/hardware.ts`: capability scoring + recommendation policy

## State Flow

Primary state owner: `useNQueenSolver`.

Inputs into solver hook:
- Board size
- Constraint sets (blocked, forbidden, pre-placed)
- UI control commands (algorithm, mode, objective, strategy, symmetry, split depth)

Outputs from solver hook:
- Board activity state (active/explored cell, move state)
- Solver phase (`idle`, `solving`, `paused`, `stepping`, `enumerating`, `solved`, `failed`)
- Live logs and counters
- Stored solution navigation state
- Per-algorithm and per-strategy performance snapshots
- Parallel telemetry and worker monitor state
- Unified `SolverAnalytics` payload for the right insights panel

The board panel is the command surface. The insights sidebar is the analytics surface. `DashboardAppShell` supplies the shared structural frame (left nav, top action bar, transitions, right rail) across both routes.

Recent performance behavior:
- Solver runtime events are buffered and flushed to UI at controlled cadence (instead of per-event full React commits).
- Cadence is visibility-aware:
  - active visible lab: higher refresh frequency
  - hidden persisted labs: lower background publication frequency
- Telemetry consumers use selector-style subscription to avoid broad full-snapshot re-renders.

## UI Flow

1. User changes configuration from the left control rail in `ChessboardPanel` (Accordion groups).
   Control intents are separated via `Select`/`ToggleGroup`/`RadioGroup` patterns to reduce ambiguity.
   On main solver page, strategy/objective/parallel controls are grouped in the strategy section and visualization toggles are grouped in a dedicated visualization section.
   Constraint/challenge control-room UI is hosted in Challenge Lab route.
2. `useNQueenSolver` updates runtime mode and prepares execution context.
3. Solver emits frames/progress updates.
4. Center board hero zone updates state visuals and playback controls.
5. Diagnostics tabs (log/tree/heatmap) render supporting context below the board.
6. Right insights rail consumes analytics snapshots from shared hook output and presents them in grouped cards/tabs/accordion without changing calculation logic.
7. Benchmark Lab route uses an internal tabbed workspace:
   Benchmark tab for matrix comparisons and Stress Test tab for limit probing.
   Benchmark surfaces are panelized into reusable sections (`BenchmarkConfigPanel`, `BenchmarkResultsTable`, `StressTestPanel`).
8. Learn section uses a tabbed educational surface with concept cards and accordion deep dives, backed by static topic data and premium visual framing layers.
9. Benchmark and stress flows run independent orchestrators but reuse the same solver core.
10. Challenge Lab route reuses `ChessboardPanel` with the advanced accordion group open by default to prioritize constraint/challenge workflows.
11. Insights Lab route reuses existing analytics wiring and renders `InsightsSidebar` in full-page mode for more space without metric logic changes.
12. Persistent host (`PersistentLabsHost`) keeps all lab shells mounted and passes route visibility state so hidden pages stay connected but render more efficiently.

## Composition Strategy

- Keep stateful logic in hooks/page-level orchestration layers.
- Move presentation and layout concerns into reusable modules with consistent prop interfaces.
- Compose pages from wrappers/panels to reduce monolithic JSX and improve maintainability.

## Solver Flow

### Solve First
- Triggered by `findFirstSolution` or objective runner
- Chooses algorithm path (classic/optimized/bitmask/parallel)
- Streams metrics and events
- Stops at first valid complete board
- Stores first solution path + timing

### Find All
- Triggered by `findAllSolutions` or objective runner
- Runs exhaustive enumeration (or count-only in benchmark/stress where appropriate)
- Applies storage cap for UI safety
- Tracks all-solution timing and aggregate counts

### Constraints Handling
- Constraints are normalized and validated before recursion
- Invalid pre-placements short-circuit with unsolved result
- When constraints are active and selected engine lacks full compatibility guarantees, execution safely routes through classic path

## Parallel Execution Architecture

- Top-level branches are split into discrete tasks (depth 0/1/2)
- Task queue is distributed across a reusable worker pool
- Workers run independent bitmask DFS and report metrics
- Aggregator combines:
  - recursive calls/backtracks/solutions
  - pruning counters
  - task progress
  - live worker activity
- Early stop is supported for first-solution objective

## Data Contracts and Types

- `types/chessboard.ts`: board-level enums/types and solver mode vocabulary
- `types/dashboard.ts`: analytics model used by insights cards
- `lib/solvers/types.ts`: low-level solver events/frames/progress contracts
- `lib/parallel/types.ts`, `lib/benchmark/types.ts`, `lib/stress/types.ts`: module-specific contracts

## Design Principles Visible in Code

- Separation of concerns between UI, orchestration, and algorithms
- Shared utility modules for reusable optimization logic
- Shared visual primitives/effects for consistent premium interaction quality across routes
- Incremental observability: every feature has measurable analytics
- Responsiveness-first safeguards for larger board sizes (capping, sampling, yield points)
