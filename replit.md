# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Artifacts

### WearBridge - Wear OS for iOS (`artifacts/wearos-ios`)
Expo mobile app for iPhone that connects and manages Wear OS smartwatches.

**Features:**
- Bluetooth device scanning and pairing simulation
- Home dashboard with connected watch health stats (heart rate, steps, calories, sleep)
- Live animated heart rate chart
- Watch detail screen with full health metrics and notifications
- Notification mirroring (WhatsApp, Gmail, Messages, etc.)
- Devices management screen (add, remove, connect)
- Settings screen (notification sync, health sync, do not disturb, etc.)
- Dark/light navy + teal color theme

**Screens:**
- `app/(tabs)/index.tsx` — Home dashboard
- `app/(tabs)/devices.tsx` — Device management
- `app/(tabs)/settings.tsx` — App settings
- `app/watch/[id].tsx` — Individual watch detail

**State:** `context/WatchContext.tsx` with AsyncStorage persistence

### API Server (`artifacts/api-server`)
Express 5 backend at `/api` path.

### Canvas Mockup Sandbox (`artifacts/mockup-sandbox`)
UI prototyping sandbox at `/__mockup`.

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
