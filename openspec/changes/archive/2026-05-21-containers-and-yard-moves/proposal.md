## Why

The TMS platform needs visibility into container inventory and yard logistics. Operators need to see which containers are on-site and in what state, and be able to record, progress, and cost yard moves (container movements between factory zones) — completing the operational loop after trip plan management.

## What Changes

- Add a Containers list page (`/containers`) showing all containers with status and current location, with filters by status and location
- Add a Yard Moves page (`/yard-moves`) with full interactive flow: create yard move, advance status (PENDING → IN_PROGRESS → COMPLETED/CANCELLED), add costs
- Add nav sidebar entries for both new pages
- No new backend work needed — all API endpoints already exist

## Capabilities

### New Capabilities

- `container-list`: Read-only view of container inventory with status lifecycle and location data
- `yard-move-interactions`: Full CRUD interactive flow for yard moves including status transitions and cost tracking

### Modified Capabilities

- `auth-me`: No requirement change
- `reference-data`: Containers endpoint used as a data source when creating yard moves (already exists, no spec change needed)

## Impact

- **Frontend only** — zero backend changes required
- New pages: `apps/web/src/app/(authenticated)/containers/page.tsx`, `apps/web/src/app/(authenticated)/yard-moves/page.tsx`
- Updated: `apps/web/src/components/nav-sidebar.tsx` (add two nav links)
- Reuses existing API endpoints: `GET /containers`, `GET /yard-moves`, `POST /yard-moves`, `PATCH /yard-moves/:id/status`, `POST /yard-moves/:id/costs`
- Reuses existing reference data: `GET /locations` (already implemented for trip plans)
