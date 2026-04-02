# Changelog

All notable changes to QueenMind are documented in this file.

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
