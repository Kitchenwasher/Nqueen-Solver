# QueenMind

QueenMind is a **Next.js 14 + TypeScript + Tailwind CSS** premium dashboard shell for an N-Queen Visual Solver.

This version includes a polished, responsive UI scaffold only:
- Top navbar
- Left controls sidebar
- Center chessboard panel
- Right analytics/log sidebar
- Bottom educational content section

No solver logic has been implemented yet.

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui-style component setup
- Framer Motion
- Lucide React

## Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```text
QueenMind/
  app/
    (dashboard)/
      page.tsx
    globals.css
    layout.tsx
  components/
    dashboard/
      board-square.tsx
      chessboard-panel.tsx
      control-sidebar.tsx
      dashboard-shell.tsx
      education-panel.tsx
      insights-sidebar.tsx
      top-navbar.tsx
    ui/
      badge.tsx
      card.tsx
      input.tsx
      label.tsx
      scroll-area.tsx
      separator.tsx
  data/
    dashboard-data.ts
  lib/
    utils.ts
  types/
    dashboard.ts
  .eslintrc.json
  .gitignore
  components.json
  next.config.mjs
  package.json
  postcss.config.mjs
  tailwind.config.ts
  tsconfig.json
```
