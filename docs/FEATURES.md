# Features

## Overview

QueenMind is an interactive N-Queen platform with solving, analysis, benchmarking, stress testing, and challenge-generation workflows.
The UI now includes a final premium polish layer with subtle spotlight/glow effects, refined micro-interactions, and upgraded glass surfaces.

## Main App Sections

## 1. Solver Dashboard (`/`)

### Navigation and Layout

- Left sidebar navigation with quick tabs:
  - Solver
  - Benchmark Lab
  - Challenge Lab
  - Insights Lab
  - Learn (jump)
- Settings (jump)
- Top action bar with:
  - page title/subtitle
  - quick actions
  - focus mode toggle
  - live solver badge
  - hardware status badge
  - multi-algorithm badge
- Board-first center layout with optional right context rail
- Focus mode still available for cinematic board emphasis
- Responsive behavior:
  - desktop persistent sidebar
  - mobile slide-out navigation sheet
  - animated active tab/section indicators
- Solver workspace structure:
  - Left Control Rail with collapsible groups (Board Setup, Algorithm, Mode, Strategy, Symmetry, Visualization Tools)
  - Center Board Zone with hero board container, status strip, and polished playback area
  - Right Insights Rail for analytics and hardware intelligence

### Board and Play

- Interactive board with click-to-place queen editing
- Board sizes: `4, 6, 8, 10, 12, 14, 16, 18, 20`
- Real-time board validation states:
  - valid
  - invalid
  - in-progress
- Active explored-cell highlighting during solves
- Live attacked/conflicting visualization
- Premium board presentation layer:
  - glass spotlight frame and subtle cinematic glow
  - polished alternating tiles and hover feedback
  - animated queen placement/removal motion
  - clearer overlays for attacked/blocked/forbidden/conflicting states
  - optional active row/column emphasis from solver traversal

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
- Solving Objective controls are grouped under Search Strategy
- Parallel split-depth controls are grouped under Search Strategy
- Professional grouped control system:
  - shadcn-based grouped sections with accordion hierarchy
  - select/toggle/radio style controls based on intent
  - active-state visual feedback with cyan accent glow
  - separators and microcopy for better scanability

### Visualizers

- Visualization Tools section includes:
  - Search Tree Visualizer toggle
  - Search Heatmap modes (Off, Exploration, Conflict, Solution Frequency)

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
- Speed slider in a dedicated tactile control pod beneath the board

### Diagnostics Tabs

- Tabbed diagnostics panel below the board:
  - Live Log
  - Search Tree
  - Heatmap legend/validation context

### Focus Mode

- Board-emphasized cinematic mode
- Reduced side clutter for demo and presentation flows

## 2. Insights Sidebar

Live cards include:
- 1. Solver Status
- 2. Runtime Counters
- In Solver page right rail, only sections 1 and 2 are shown for compact readability.
- Tooltip hints and progress bars for readability.

## 3. Insights Lab (`/insights`)

- Dedicated full-page analytics view for higher readability.
- Reuses the same metrics and calculations as the sidebar.
- Shows expanded analytics sections (Performance, Hardware, Symmetry/Pruning, Strategy/Algorithm comparison, Parallel telemetry, Advanced Metrics).
- Board and control panels are intentionally not shown on this page.
- Live telemetry publishing is throttled/coalesced so updates remain visible during active solving without overloading render throughput.

## 4. Benchmark Lab (`/benchmark`)

The page is organized as an internal two-tab lab:
- Benchmark
- Stress Test

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
- estimated speedup
- peak worker usage
- total solutions found
- nodes/sec and avg ms/board
- per-N step table
- live run-state indicator + progress bar

## 5. Challenge Lab (`/challenges`)

- Dedicated page for:
  - Constraint Editor controls
  - constraint editor workflows
  - challenge generator workflows
  - challenge metadata/actions
- Uses existing solver logic and interactions from the main solver surface.
- Opens with the advanced controls group expanded by default for faster access.

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

## 6. Educational Panel

- Premium learning experience with tabbed concept tracks and accordion deep dives
- Dedicated sections:
  - What is N-Queen?
  - Backtracking
  - Recursion
  - Optimization
  - Complexity
  - Constraint Satisfaction framing
- Includes:
  - concept cards with mini callout blocks
  - highlighted keyword badges
  - collapsible explanation modules for each section
  - premium glow/gradient card treatment and refined tab hierarchy for dashboard-quality presentation

## 7. Hardware-Aware UX

- Detects hardware threads, memory hints, worker support, security context, and capability tier
- Recommends best solver mode and suggested board range
- One-click Apply Recommended Solver action in controls

## 8. Runtime Performance Behavior (User-Visible)

- Persistent lab pages remain mounted across route switches.
- Hidden lab pages continue running active processes in background, with reduced UI update cadence.
- Visible pages prioritize responsiveness (board/control surface first), while non-critical panels update adaptively.
