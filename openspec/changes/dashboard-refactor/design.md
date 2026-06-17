## Context

The dashboard currently has a single `GET /dashboard/stats` endpoint that computes aggregates hardcoded to "today" with no parameters. The frontend is a Next.js Server Component — it renders once on page load with no interactivity. The shared type `DashboardStats` has 6 fields, two of which (`vehiclesInMaintenance` hardcoded to 0, `expiringCompliance` combining three expiry types) are inadequate for operator use. No chart library exists in the web app.

## Goals / Non-Goals

**Goals:**

- Parameterize all stat queries with date ranges
- Split expiry stats into 4 granular fields (ĐK/CàVẹt × xe/mooc)
- Add an expiry list endpoint that always includes already-expired records
- Add a trip trend endpoint returning daily counts for charting
- Render Line, Pie, and Bar charts using Recharts
- Convert dashboard page to a Client Component with interactive date pickers and entity/type filters

**Non-Goals:**

- Real-time updates (WebSocket or polling)
- Role-based dashboard views
- Export of dashboard data to Excel
- Tracking bảo hiểm (insurance) in stat cards or expiry filters

## Decisions

**D1 — Client Component for the dashboard page**

The dashboard needs two independent date range pickers (trips vs expiry) and cascading expiry filters. URL-based params with Server Component re-renders would require full page navigation on every filter change, producing poor UX. Converting to a Client Component with `useState`/`useEffect` fetch pattern (already used in `trip-plans/page.tsx`) is the consistent choice.

Alternative considered: URL search params + Suspense streaming. Rejected because it adds complexity without a meaningful benefit on a non-SEO page.

**D2 — Three separate API endpoints**

`GET /dashboard/stats` — aggregate counts for stat cards (lightweight, called on every filter change)
`GET /dashboard/trips-trend` — daily trip counts array for the Line chart (potentially larger payload, separate cache lifetime)
`GET /dashboard/expiry-list` — full list of expiry events for the table (largest payload, separate filter state)

Alternative considered: one monolithic stats endpoint returning everything. Rejected because trend data and expiry list have different filter parameters and sizes; merging them forces the client to refetch large payloads on any filter change.

**D3 — Expiry list always includes expired records**

Records where `expDate < today` are always included in `GET /dashboard/expiry-list` regardless of the `from`/`to` filter. The filter only controls which future expiry dates are returned. This prevents operators from accidentally hiding overdue compliance records.

SQL logic: `WHERE expDate < today OR (expDate >= :from AND expDate <= :to)`

**D4 — Recharts as chart library**

Recharts is a React-native composable library compatible with React 19 and Next.js 15 App Router without SSR workarounds. ApexCharts and Chart.js both require `dynamic(() => import(...), { ssr: false })` wrappers in Next.js; Recharts does not since it is pure React SVG. Recharts is the smallest viable option (~400KB gzipped).

**D5 — Expiry events flattened to one row per expiry field**

A single `VehicleRecord` can have up to 2 expiry dates (ĐK + CàVẹt) plus moocs each with 2 more. The API flattens these to individual `ExpiryItem` objects so the table shows one row per expiry event, not one row per vehicle. This makes it easy to sort by `expDate` and apply type filters without client-side unpacking.

**D6 — `DashboardStats` shared type is a breaking change**

Removing `tripsCompleted`, `vehiclesInMaintenance`, and `expiringCompliance` breaks any consumer of the type. Since the only consumer is the dashboard page (which is being rewritten), this is acceptable. The shared package must be rebuilt (`pnpm --filter @tms/shared build`) before the API can compile.

**D7 — Default expiry range: today → today+30 days**

The expiry section defaults to showing records expiring in the next 30 days, plus all already-expired records. This matches the prior behavior of the `expiringCompliance` field and is the most operationally useful default.

## Risks / Trade-offs

- **Breaking shared type** → All consumers must be updated in the same PR; the type-check step will catch any missed consumer.
- **Recharts bundle size (~400KB)** → Dashboard page is already a client-side JS page; the bundle increase is acceptable. Code-split via lazy import if needed.
- **Expiry list query complexity** → Querying VehicleRecord + VehicleRecordMooc with OR conditions across two tables is two separate Prisma queries merged in application code; acceptable for typical fleet sizes (<500 records).
- **No pagination on expiry list** → If fleet grows to thousands of vehicles, the list could become slow. Acceptable for now; add pagination when needed.

## Migration Plan

1. Update `@tms/shared` `DashboardStats` type
2. Rebuild shared package
3. Update `dashboard.service.ts` and `dashboard.controller.ts`
4. Install `recharts` in `apps/web`
5. Rewrite `dashboard/page.tsx` as Client Component
6. Run full TypeScript check across monorepo
7. Manual smoke test: verify all stat cards, all charts, expiry table filtering

No database migrations required.
