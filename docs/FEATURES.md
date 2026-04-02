# Features

## Overview

QueenMind is an interactive N-Queen platform with solving, analysis, benchmarking, stress testing, and challenge-generation workflows.

## Main App Sections

## 1. Solver Dashboard (`/`)

### Board and Play

- Interactive board with click-to-place queen editing
- Board sizes: `4, 6, 8, 10, 12, 16`
- Real-time board validation states:
  - valid
  - invalid
  - in-progress
- Active explored-cell highlighting during solves
- Live attacked/conflicting visualization

### Algorithms

- Classic Backtracking
- Optimized Solver
- Bitmask Solver
- Parallel Solver

### Solve Modes

- Auto-play
- Step-by-step (disabled for parallel mode)

### Solving Objectives

- Fastest First Solution
- Enumerate All Solutions

### Search Controls

- Symmetry Optimization ON/OFF
- Search Strategy:
  - Left to Right
  - Center First
  - Heuristic Search

### Parallel Controls

- Auto Split Depth
- Manual Split Depth (Depth 0 / 1 / 2)

### Constraint Variant Editor

- Play Queens
- Pre-place Queens
- Block Cells
- Forbid Cells
- Erase Cell

Supported constraint scenarios:
- blocked cells
- forbidden positions
- pre-placed queens
- continuation from partial boards

### Challenge / Puzzle Generator

Challenge modes:
- Partial Fill
- Constrained
- Unique Continuation
- Limited Clue

Difficulty:
- Easy
- Medium
- Hard

Actions:
- Generate Challenge
- Reveal Solution

### Visualizers

- Search Tree Visualizer
  - Toggle ON/OFF
  - Replay slider
  - Pan and zoom
- Search Heatmap modes
  - Off
  - Exploration
  - Conflict
  - Solution Frequency

Note: heatmap is disabled for parallel algorithm selection.

### Runtime Controls

- Find First Solution
- Find All Solutions
- Run Selected Objective
- Pause / Resume
- Next Step
- Reset
- Clear Board
- Validate Board
- Previous / Next stored solution navigation

### Focus Mode

- Board-emphasized cinematic mode
- Reduced side clutter for demo and presentation flows

## 2. Insights Sidebar

Live cards include:
- Current algorithm
- Performance score and qualitative badges
- Solver status
- Hardware intelligence and recommendations
- Symmetry metrics
- Search strategy timing
- Solving objective timing (first/all)
- Dead-state pruning metrics
- Constraint analytics
- Algorithm comparison (classic/optimized/bitmask)
- Core counters (calls/backtracks/elapsed/etc.)
- Parallel runtime telemetry
- Live worker monitor (per-worker status/task/duration/solutions)

## 3. Benchmark Lab (`/benchmark`)

### Benchmark Mode

Configurable:
- board sizes
- algorithm selection
- mode: first solution vs all solutions
- run count
- symmetry toggle
- search strategy
- split depth controls

Results:
- tabular metrics per case
- visual bar comparison
- speedup vs classic baseline
- run-level averages and best-time reporting

### Stress Test Mode

Configurable:
- algorithm
- board range
- solve target
- time limit
- worker mode/count (parallel)

Outputs:
- max solved N
- total nodes explored
- elapsed time
- peak worker usage
- total solutions found
- nodes/sec and avg ms/board
- per-N step table

## 4. Educational Panel

- Guided conceptual cards on N-Queen, backtracking, recursion, optimization, complexity, and CSP framing

## 5. Hardware-Aware UX

- Detects hardware threads, memory hints, worker support, security context, and capability tier
- Recommends best solver mode and suggested board range
- One-click Apply Recommended Solver action in controls
