### Requirement: Next.js app exists as a Turborepo workspace package
The system SHALL include `apps/web` as a valid pnpm workspace package with name `@tms/web`. It MUST be buildable via `turbo build` and runnable via `turbo dev` alongside `apps/api` without port conflicts.

#### Scenario: Dev server starts on port 3000
- **WHEN** `turbo dev` is run at the monorepo root
- **THEN** `apps/web` starts on port 3000 and `apps/api` starts on port 4000 concurrently

#### Scenario: Build succeeds via Turbo
- **WHEN** `turbo build` is run at the monorepo root
- **THEN** `apps/web` produces a `.next/` build output without TypeScript errors

---

### Requirement: App uses Next.js App Router with a root layout
The system SHALL use the App Router (not Pages Router). A root `layout.tsx` MUST define the HTML shell, apply global styles, and wrap all pages.

#### Scenario: All pages share the root layout
- **WHEN** any page under `app/` is rendered
- **THEN** the root layout HTML shell (html, body, nav) wraps the page content

---

### Requirement: Navigation sidebar links to all main sections
The system SHALL render a persistent sidebar or top navigation with links to Dashboard, Trip Plans, and Vehicles.

#### Scenario: Navigation is visible on authenticated pages
- **WHEN** an authenticated user visits any protected page
- **THEN** navigation links to `/dashboard`, `/trip-plans`, and `/vehicles` are visible

---

### Requirement: Dashboard page displays stats from the API
The system SHALL have a `/dashboard` page that fetches `DashboardStats` from NestJS via RSC and renders: total trips today, completed, in-transit, active vehicles, vehicles in maintenance, and expiring compliance count.

#### Scenario: Stats render on page load
- **WHEN** an authenticated user navigates to `/dashboard`
- **THEN** the page shows numeric values for all six `DashboardStats` fields without a client-side loading state

#### Scenario: API error is handled gracefully
- **WHEN** the NestJS API returns a non-200 response
- **THEN** the dashboard shows a readable error message instead of an unhandled exception

---

### Requirement: Trip Plans list page displays paginated trips
The system SHALL have a `/trip-plans` page that fetches and displays a paginated list of trip plans. Each row MUST show: trip date, trip number, service type (using `SERVICE_TYPE_LABELS`), vehicle, customer, status.

#### Scenario: Trip list renders with data
- **WHEN** an authenticated user navigates to `/trip-plans`
- **THEN** a table of trip plans is displayed with all required columns

#### Scenario: Service type uses display label
- **WHEN** a trip plan with `serviceType: "SEA_EXPORT"` is displayed
- **THEN** the label shown is "SEA - EX (Xuất khẩu đường biển)"

---

### Requirement: Vehicles page displays the vehicle list
The system SHALL have a `/vehicles` page that fetches and displays all vehicles with their license plate, type, status, and upcoming compliance expiry dates.

#### Scenario: Vehicle list renders
- **WHEN** an authenticated user navigates to `/vehicles`
- **THEN** a list of vehicles is displayed with license plate, type, status, and expiry dates

---

### Requirement: `serverFetch` utility for RSC data fetching
The system SHALL provide a `lib/server-fetch.ts` utility that reads the `tms_token` cookie via Next.js `cookies()` and performs authenticated fetch calls to NestJS. It MUST not be importable in client components (no `"use client"` directive allowed in server utilities).

#### Scenario: Authenticated RSC fetch includes Bearer token
- **WHEN** a Server Component calls `serverFetch('/dashboard')`
- **THEN** the outgoing HTTP request includes `Authorization: Bearer <token>` and targets `http://localhost:4000/api/v1/dashboard`

---

### Requirement: `packages/ui` and `packages/utils` are initialized as workspace packages
The system SHALL add `package.json` to `packages/ui` (name: `@tms/ui`) and `packages/utils` (name: `@tms/utils`) so they are valid pnpm workspace packages. Both MUST export a stub `src/index.ts` to avoid import errors.

#### Scenario: packages/ui can be referenced as a workspace dependency
- **WHEN** `"@tms/ui": "workspace:*"` is listed in `apps/web/package.json`
- **THEN** `pnpm install` resolves without error and the package is linked correctly
