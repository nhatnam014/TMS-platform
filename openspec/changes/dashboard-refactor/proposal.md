## Why

The current dashboard is a static read-only page showing only today's trip counts with no filtering, no expiry breakdown, and no visual charts. Operators need date-range filtering, granular expiry tracking per vehicle and mooc, and trend charts to make daily fleet decisions.

## What Changes

- **REMOVE** `tripsCompleted` and `vehiclesInMaintenance` stat cards and their backing queries
- **ADD** `tripsWaiting` stat (trips with status PLANNED or DISPATCHED in the selected trip date range)
- **ADD** date-range filter for trip stats (replaces hardcoded "today" logic)
- **ADD** 4 separate expiry stat cards: đăng kiểm xe, cà vẹt xe, đăng kiểm mooc, cà vẹt mooc — each filtered by a separate expiry date range (default: today → today+30d)
- **REMOVE** all bảo hiểm (insurance) references from stats, filters, and API
- **ADD** expiry list table that always shows already-expired records plus records expiring within the selected expiry range; filterable by entity type (xe/mooc) and expiry type (đăng kiểm/cà vẹt)
- **ADD** three Recharts-based charts: Line (trips per day trend), Pie (trip status distribution), Bar (expiry breakdown by type × entity)
- **ADD** two new API endpoints: `GET /dashboard/trips-trend` and `GET /dashboard/expiry-list`
- **MODIFY** `GET /dashboard/stats` to accept `tripFrom`, `tripTo`, `expiryFrom`, `expiryTo` query params and return expanded expiry fields
- **BREAKING** `DashboardStats` shared type: remove `tripsCompleted`, `vehiclesInMaintenance`, `expiringCompliance`; add `tripsWaiting`, `expiringDangKiemXe`, `expiringCaVetXe`, `expiringDangKiemMooc`, `expiringCaVetMooc`
- **ADD** Recharts npm dependency to `apps/web`
- Convert `dashboard/page.tsx` from Server Component to Client Component to support interactive filters

## Capabilities

### New Capabilities

- `dashboard-stats`: Stat cards showing trip and expiry aggregates filtered by date ranges
- `dashboard-expiry-report`: Expiry list table with color-coded rows (expired=red, ≤7d=orange, ≤30d=yellow), filterable by entity type and expiry type; expired records always visible regardless of date filter
- `dashboard-charts`: Recharts Line, Pie, and Bar charts visualizing trip trends, status distribution, and expiry breakdown

### Modified Capabilities

- `nextjs-web-app`: Dashboard page converts from Server Component to Client Component with interactive state

## Impact

- `packages/shared/src/index.ts` — `DashboardStats` type **BREAKING** change
- `apps/api/src/modules/dashboard/dashboard.service.ts` — rewrite `getStats()`, add `getTripsTrend()`, add `getExpiryList()`
- `apps/api/src/modules/dashboard/dashboard.controller.ts` — add two new GET routes with query params
- `apps/web/src/app/(authenticated)/dashboard/page.tsx` — full rewrite as Client Component
- `apps/web/package.json` — add `recharts` dependency
- No database migrations required (all data available in existing `VehicleRecord` and `VehicleRecordMooc` tables)
