## Why

The TMS platform has a fully-functional NestJS API (`apps/api`) but no user-facing interface. Dispatchers and operators currently have no way to view the dashboard, manage trip plans, or track vehicles without hitting the API directly. Adding `apps/web` — a Next.js App Router frontend — closes this gap and makes the platform usable by non-technical staff.

## What Changes

- **Add `apps/web`** — a new Next.js 15 App Router application at `apps/web/` under the existing `apps/*` Turborepo workspace
- **Add JWT authentication to `apps/api`** — `User` model in Prisma schema, `AuthModule` with login endpoint, `JwtAuthGuard` applied to all existing controllers (trip-plan, vehicle, dashboard)
- **BFF proxy layer in `apps/web`** — Next.js route handlers at `/api/*` proxy browser mutations to NestJS, forwarding the JWT from an httpOnly cookie
- **RSC direct fetch** — Server Components fetch NestJS directly (server-to-server, no CORS), reading the JWT from cookies
- **Initialize `packages/ui` and `packages/utils`** — add `package.json` so `apps/web` can consume shared React components and utilities as the platform grows
- **Seed the first admin user** — add a hashed admin credential to the existing Prisma seed script

## Capabilities

### New Capabilities

- `nextjs-web-app`: Next.js App Router application at `apps/web` — layout, routing, pages for dashboard/trip-plans/vehicles, shared server/client fetch utilities
- `jwt-authentication`: End-to-end JWT auth — Prisma `User` model, NestJS `AuthModule` (login endpoint + JwtStrategy + guard), Next.js login page + httpOnly cookie management + route middleware protection
- `bff-api-proxy`: Next.js API route handlers that proxy browser requests to NestJS, extracting the JWT from the httpOnly cookie and forwarding it as `Authorization: Bearer`

### Modified Capabilities

<!-- none — no existing specs exist yet -->

## Impact

- **`packages/db/prisma/schema.prisma`** — new `User` model + `Role` enum; requires new migration
- **`packages/db/prisma/seed.ts`** — add hashed admin user seed
- **`apps/api/src/modules/`** — new `auth/` module; existing `trip-plan`, `vehicle`, `dashboard` controllers gain `@UseGuards(JwtAuthGuard)`
- **`apps/api/package.json`** — add `@nestjs/jwt`, `@nestjs/passport`, `passport`, `passport-jwt`, `bcrypt`
- **`apps/web/`** — new Next.js app; depends on `@tms/shared` for types
- **`packages/ui/`**, **`packages/utils/`** — add `package.json` to make them valid workspace packages
- **`pnpm-lock.yaml`** — updated by pnpm install after new deps
