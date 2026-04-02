# Deployment

## Local Development

### Prerequisites

- Node.js 18+
- npm 9+

### Install Dependencies

```bash
npm install
```

### Start Dev Server

```bash
npm run dev
```

Default local URL:
- `http://localhost:3000`

## Build and Run Production Locally

### Build

```bash
npm run build
```

### Start

```bash
npm run start
```

### Lint (recommended before deploy)

```bash
npm run lint
```

## Build/Runtime Notes

- Framework: Next.js 14 App Router
- UI and solving orchestration run client-side for interactive visualization
- Parallel solver uses browser Web Workers (`workers/nqueen-parallel.worker.ts`)
- Hardware capabilities are detected at runtime in browser context

## Environment Configuration

No required custom environment variables are defined for base functionality in the current codebase.

If deploying to managed hosts, keep defaults unless introducing external services.

## Deploying to Vercel

1. Push repository to GitHub.
2. Import project in Vercel.
3. Use detected defaults:
   - Framework preset: Next.js
   - Build command: `npm run build`
   - Output: Next.js standard output
4. Deploy.

## Deploying to Other Platforms

Any Node-compatible host supporting Next.js production mode can run QueenMind.

Required runtime commands:

- Install: `npm install`
- Build: `npm run build`
- Start: `npm run start`

Examples:
- Railway
- Render
- AWS (custom Node host)
- VPS with PM2/systemd + reverse proxy

## Performance and Hosting Considerations

- Parallel mode performance depends on client browser hardware thread count.
- Stress and benchmark operations can be compute-intensive in-browser.
- For demos, prefer modern Chromium/Firefox builds and secure contexts.

## Verification Checklist Before Release

- `npm run lint` passes
- `npm run build` succeeds
- Dashboard route loads
- Benchmark route loads
- At least one solve run per algorithm succeeds
- Parallel worker mode initializes and reports telemetry
- Search Tree toggle and Heatmap modes behave correctly
