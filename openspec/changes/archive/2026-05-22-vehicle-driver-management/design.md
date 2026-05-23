## Context

The vehicles API currently exposes only `GET /vehicles` (list with driver/trailer relations) and `GET /vehicles/compliance-alerts`. The vehicles page is a Next.js server component using `serverFetch` — no client interactivity, no mutations. No driver API exists at all; drivers are only reachable as nested includes on the vehicle response.

The `Driver` model has a `vehicleId` FK (optional, unique), meaning one driver is linked to at most one vehicle at a time. Vehicle status `WAITING_DRIVER` signals no driver is assigned. The intended lifecycle is: new vehicle starts `ACTIVE` if given a driver on creation, or `WAITING_DRIVER` if created alone. Assigning a driver transitions the vehicle to `ACTIVE`; removing a driver transitions it back to `WAITING_DRIVER`.

The change follows the same service/controller/DTO/audit pattern established for customer, carrier, and location in `reference-data-crud`.

## Goals / Non-Goals

**Goals:**
- Register new vehicles and update their fields from the UI
- Manage vehicle status transitions (ACTIVE ↔ MAINTENANCE, DECOMMISSIONED)
- Convert the vehicles page to an interactive client component with search and status filter
- Create, update, and manage drivers independently
- Assign/unassign drivers to vehicles with automatic vehicle status updates
- Audit log all mutations

**Non-Goals:**
- Trailer management (VehicleTrailer join, `Trailer` model CRUD — deferred)
- Role-gating beyond JWT authentication (all authenticated users can mutate)
- Bulk operations (import from spreadsheet, bulk status change)

## Decisions

### D1: Driver FK lives on Driver, managed via Driver endpoint

`Driver.vehicleId` is the FK. Assignment is done via `PATCH /drivers/:id` with `{ vehicleId }`. Unassign via `{ vehicleId: null }`.

**Why:** The FK is on Driver, so managing it there avoids awkward cross-entity updates on the vehicle side. NestJS services can coordinate: `DriverService.assign(id, vehicleId)` updates the Driver row and then updates the Vehicle's status in the same `$transaction`.

**Alternative considered:** Expose assignment via `PATCH /vehicles/:id/assign-driver` — rejected as it creates a separate action endpoint and duplicates concern.

### D2: Vehicle status auto-transitions on driver assignment/unassignment

- `PATCH /drivers/:id` with `{ vehicleId: someId }`:
  - Sets `driver.vehicleId = someId`
  - Sets `vehicle.status = ACTIVE` (if currently WAITING_DRIVER)
- `PATCH /drivers/:id` with `{ vehicleId: null }`:
  - Clears `driver.vehicleId`
  - Sets `vehicle.status = WAITING_DRIVER` (if currently ACTIVE due to driver)

Both operations happen in a single `$transaction`.

**Why:** Vehicle status and driver assignment are tightly coupled. Separating them would leave the UI in an inconsistent state (vehicle shows WAITING_DRIVER but has a driver record).

**Edge case:** If a vehicle is in MAINTENANCE and a driver is assigned, the vehicle stays MAINTENANCE (don't auto-transition to ACTIVE). Assignment only activates WAITING_DRIVER vehicles.

### D3: New DriverModule with its own controller and service

A new `apps/api/src/modules/driver/` directory with `driver.controller.ts`, `driver.service.ts`, `driver.module.ts`, and `dto/`. Registered in `app.module.ts`.

**Why:** Follows the established module pattern. DriverService needs to inject both `PrismaService` (global) and `AuditService` (global) — no cross-module dependencies needed.

### D4: Vehicles page full rewrite SSR → `"use client"`

The existing `vehicles/page.tsx` is replaced entirely. The new version:
- Fetches `GET /api/vehicles` on mount and on `refresh` counter increment
- Renders a table with: plate, type, status badge, driver name (or "Chưa có tài"), compliance alert indicators
- Search input (client-side filter on loaded data — vehicle count is small)
- Status filter dropdown
- Create/edit modals
- Status action buttons per row

**Why client-side search/filter:** Vehicle count stays small (dozens, not thousands). No need for server-side search. Simpler implementation — one fetch on load, client filters.

### D5: Driver assignment UI on the Drivers page

The Drivers page shows a table with each driver's assigned vehicle. Assignment is done via a "Phân công xe" button that opens a select with unassigned vehicles (those with status WAITING_DRIVER). Unassign is a "Hủy phân công" button that calls the unassign path.

**Why:** Keeps vehicle page focused on vehicle data. Driver page is the natural place to manage "which driver goes to which vehicle."

### D6: Compliance date alerts on vehicles page

The vehicles page renders a visual warning indicator (⚠) next to the compliance date if it expires within 30 days or is already past. This is purely client-side calculation — no extra API call. The existing `GET /vehicles` already returns all three date fields.

## Risks / Trade-offs

- **Unique constraint on Driver.vehicleId** — only one driver per vehicle. If user tries to assign a driver to a vehicle that already has a driver, a Prisma `P2002` error fires (or a custom pre-check). → Mitigation: Check in service before assigning; return a `409 Conflict` with readable message.
- **Driver unassign while vehicle in MAINTENANCE** — vehicle is MAINTENANCE with a driver assigned (edge case). On unassign, set status to WAITING_DRIVER even if it was MAINTENANCE. → Acceptable: MAINTENANCE means mechanical issue, not driver issue. Unassigning driver should still mark it as needing a driver.
- **Vehicles page is currently SSR** — the rewrite removes `serverFetch` usage. No server component behavior to preserve; all data was public to authenticated users already.

## Open Questions

- None — scope is clear and patterns are established.
