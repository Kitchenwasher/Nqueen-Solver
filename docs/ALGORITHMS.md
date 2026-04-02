# Algorithms

## Solver Engines

QueenMind currently exposes four solver engines:

- Classic Backtracking
- Optimized Solver
- Bitmask Solver
- Parallel Solver

Each supports objective-driven execution (`first` vs `all`) with shared analytics contracts.

## 1. Classic Backtracking

Implementation:
- `lib/nqueen-solver.ts` (`solveClassicFirst`, `findAllClassic`)

Approach:
- Recursive DFS by row.
- Safety check by scanning previous rows (`isSafePosition`).
- Can run with constraints.

Characteristics:
- Most transparent and educational.
- Highest overhead among solvers for large boards.
- Used as compatibility fallback for constrained scenarios.

## 2. Optimized Solver

Implementation:
- `lib/nqueen-solver.ts` (`solveOptimizedFirst`, `findAllOptimized`)
- Uses helpers from:
  - `lib/solvers/pruning.ts`
  - `lib/solvers/symmetry.ts`
  - `lib/solvers/branch-ordering.ts`

Approach:
- Tracks occupancy in sets:
  - columns
  - diagonals (`row - col`)
  - anti-diagonals (`row + col`)
- Adds dead-state pruning checks.
- Can use symmetry reduction in root expansion.

Characteristics:
- Faster than classic due to O(1)-style occupancy lookups.
- Good default for medium boards with rich instrumentation.

## 3. Bitmask Solver

Implementation:
- `lib/solvers/bitmaskSolver.ts`

Approach:
- Occupancy tracked with integer bitmasks:
  - columns mask
  - diagonal mask
  - anti-diagonal mask
- Candidate generation via bit operations.
- Branch ordering performed directly on available bit set.
- Supports solve-first and find-all flows.

Characteristics:
- Lower allocation overhead.
- Strong performance for larger boards.
- Integrates symmetry and pruning logic.

## 4. Parallel Solver

Implementation:
- `lib/parallel/parallel-solver.ts`
- `lib/parallel/worker-pool.ts`
- `workers/nqueen-parallel.worker.ts`

Approach:
- Splits search tree near top levels into independent tasks.
- Dispatches tasks over worker pool.
- Aggregates worker metrics and solutions.
- Supports early stop for first-solution objective.

Characteristics:
- Best multicore scaling path.
- Includes worker telemetry and load-balance analytics.
- Split depth can be adaptive or manual.

## Search Strategies

Shared strategy module:
- `lib/solvers/branch-ordering.ts`

Available strategies:
- Left to Right
  - deterministic natural column order.
- Center First
  - prioritizes columns nearest board center.
- Heuristic Search
  - prioritizes candidates with better projected continuation potential.

Applied to:
- classic
- optimized
- bitmask
- benchmark/stress runs (configurable)

## Symmetry Optimization

Module:
- `lib/solvers/symmetry.ts`

Technique:
- Explore only half of first-row placements where valid.
- Mirror counts/solutions for equivalent branches.
- Handle odd N center-column branch separately (no mirror pair).

Benefit:
- Reduces redundant root exploration.
- Improves all-solution workloads in particular.

## Early Dead-State Pruning

Module:
- `lib/solvers/pruning.ts`

Checks include:
- Remaining free column capacity vs rows left.
- Future row feasibility (detect blocked future rows before deep recursion).

Metrics tracked:
- branches pruned
- dead states detected
- estimated work saved

## Constraint-Aware Solving

Module:
- `lib/solvers/constraints.ts`

Supported constraint forms:
- blocked cells
- forbidden cells
- pre-placed queens

Process:
- normalize to row bitmasks / fixed-column map
- validate pre-placed consistency
- enforce disallowed masks during search

Note:
- Non-classic mode with active constraints can route to classic path for compatibility guarantees.

## Solving Objectives

- Fastest First Solution
  - stop when first valid full placement is found
  - tracks time to first solution

- Enumerate All Solutions
  - traverse complete search space
  - tracks time to all solutions
  - may cap stored solution arrays for UI responsiveness

## Benchmark and Stress Integration

- Benchmark harness (`lib/benchmark/run-benchmark.ts`) runs standardized comparisons.
- Stress harness (`lib/stress/run-stress-test.ts`) performs time-budgeted board sweeps.
- Both reuse main solver engines and expose comparable metrics.
