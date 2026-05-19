## 1. Database — User Model & Migration

- [x] 1.1 Add `Role` enum and `User` model to `packages/db/prisma/schema.prisma`
- [x] 1.2 Run `pnpm db:generate` to regenerate the Prisma client
- [x] 1.3 Run `pnpm db:migrate --name add_users` to create and apply the migration
- [x] 1.4 Add bcrypt import and admin user seed to `packages/db/prisma/seed.ts` (reads `SEED_ADMIN_PASSWORD` env var, throws if unset)

## 2. NestJS — JWT Authentication Module

- [x] 2.1 Add auth dependencies to `apps/api/package.json`: `@nestjs/jwt`, `@nestjs/passport`, `passport`, `passport-jwt`, `bcrypt`, `@types/passport-jwt`, `@types/bcrypt`
- [x] 2.2 Add `JWT_SECRET` and `ACCESS_TOKEN_EXPIRY` to `.env.example`
- [x] 2.3 Create `apps/api/src/modules/auth/dto/login.dto.ts` with `LoginDto` (username + password, class-validator decorators)
- [x] 2.4 Create `apps/api/src/modules/auth/jwt.strategy.ts` implementing `PassportStrategy(Strategy)` — extracts Bearer token, validates against `JWT_SECRET`, returns payload
- [x] 2.5 Create `apps/api/src/modules/auth/jwt-auth.guard.ts` extending `AuthGuard('jwt')`
- [x] 2.6 Create `apps/api/src/modules/auth/auth.service.ts` — `validateUser()` (bcrypt compare) and `login()` (signs JWT with `sub`, `username`, `role`)
- [x] 2.7 Create `apps/api/src/modules/auth/auth.controller.ts` — `POST /auth/login` using `LoginDto`, returns `{ access_token }`
- [x] 2.8 Create `apps/api/src/modules/auth/auth.module.ts` — imports `JwtModule.register(...)`, `PassportModule`, registers service/controller/strategy
- [x] 2.9 Import `AuthModule` in `apps/api/src/app.module.ts`
- [x] 2.10 Apply `@UseGuards(JwtAuthGuard)` to all methods in `TripPlanController`, `VehicleController`, and `DashboardController`

## 3. Shared Packages Initialization

- [x] 3.1 Add `package.json` to `packages/ui` (name: `@tms/ui`, version `1.0.0`, private, main: `./src/index.ts`) with build script using `tsup`
- [x] 3.2 Add stub `packages/ui/src/index.ts` (export placeholder comment)
- [x] 3.3 Add `package.json` to `packages/utils` (name: `@tms/utils`, version `1.0.0`, private, main: `./src/index.ts`) with build script using `tsup`
- [x] 3.4 Add stub `packages/utils/src/index.ts` (export placeholder comment)

## 4. Next.js App Scaffold — Core Setup

- [x] 4.1 Create `apps/web/package.json` (name: `@tms/web`, Next.js 15, React 19, depends on `@tms/shared workspace:*`)
- [x] 4.2 Create `apps/web/next.config.ts` (basic config, `reactStrictMode: true`)
- [x] 4.3 Create `apps/web/tsconfig.json` (extends `../../tsconfig.json`, includes path alias `@/*` → `./src/*`)
- [x] 4.4 Create `apps/web/.env.example` with `API_BASE_URL=http://localhost:4000/api/v1` and `NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1`
- [x] 4.5 Run `pnpm install` at monorepo root to link all workspace packages

## 5. Next.js — Route Middleware & Auth BFF

- [x] 5.1 Create `apps/web/middleware.ts` — checks `tms_token` cookie, redirects to `/login` if absent; excludes `/login`, `/api/auth/*`, `/_next/*`, `/favicon.ico`
- [x] 5.2 Create `apps/web/src/lib/server-fetch.ts` — `serverFetch(path, options?)` utility that reads `tms_token` via `cookies()` and fetches from `API_BASE_URL`
- [x] 5.3 Create `apps/web/src/app/api/auth/login/route.ts` — proxies POST to NestJS, sets `tms_token` httpOnly cookie on success, returns 401 on failure
- [x] 5.4 Create `apps/web/src/app/api/auth/logout/route.ts` — expires the `tms_token` cookie, redirects to `/login`

## 6. Next.js — App Layout & Login Page

- [x] 6.1 Create `apps/web/src/app/globals.css` with basic reset styles
- [x] 6.2 Create `apps/web/src/app/layout.tsx` — root layout with `<html>`, `<body>`, imports global CSS
- [x] 6.3 Create `apps/web/src/components/nav-sidebar.tsx` — client component with navigation links to `/dashboard`, `/trip-plans`, `/vehicles`, and a logout button
- [x] 6.4 Create `apps/web/src/app/(authenticated)/layout.tsx` — route group layout that renders `NavSidebar` + `{children}` for all protected pages
- [x] 6.5 Create `apps/web/src/app/login/page.tsx` — login form (username + password), calls `POST /api/auth/login`, shows error on failure, redirects to `/dashboard` on success

## 7. Next.js — Dashboard Page

- [x] 7.1 Create `apps/web/src/app/(authenticated)/dashboard/page.tsx` — RSC that calls `serverFetch('/dashboard/stats')`, renders `DashboardStats` as stat cards
- [x] 7.2 Add error boundary / error.tsx for the dashboard route to handle API failures gracefully

## 8. Next.js — Trip Plans Page

- [x] 8.1 Create `apps/web/src/app/(authenticated)/trip-plans/page.tsx` — RSC that fetches paginated trip plans via `serverFetch('/trip-plans')`, renders a table with: date, number, service type label (from `SERVICE_TYPE_LABELS`), vehicle, customer, status

## 9. Next.js — Vehicles Page

- [x] 9.1 Create `apps/web/src/app/(authenticated)/vehicles/page.tsx` — RSC that fetches vehicles via `serverFetch('/vehicles')`, renders a table with: license plate, type, status, inspection/insurance/registration expiry dates

## 10. Turbo & Workspace Wiring

- [x] 10.1 Verify `turbo dev` starts both `apps/api` (port 4000) and `apps/web` (port 3000) without conflicts
- [x] 10.2 Verify `turbo build` completes successfully for both apps
- [x] 10.3 Verify `turbo type-check` passes for both `apps/api` and `apps/web`
- [x] 10.4 Update `.env.example` at the monorepo root to include `JWT_SECRET`, `ACCESS_TOKEN_EXPIRY`, and `SEED_ADMIN_PASSWORD`
