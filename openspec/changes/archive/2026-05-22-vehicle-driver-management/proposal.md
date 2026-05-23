## Why

Vehicles and drivers are core dispatch resources but are entirely read-only in the current system — there is no UI to register a new truck, update compliance dates, change a vehicle's status, or manage drivers. Dispatchers must go directly to the database for any fleet change, which blocks day-to-day operations when equipment or personnel changes occur.

## What Changes

- Convert the `/vehicles` page from a server component (SSR) to a `"use client"` interactive component with search and status filter
- Add `POST /vehicles` and `PATCH /vehicles/:id` endpoints to create and update vehicles (fields + status transitions)
- Add a new `GET /drivers`, `POST /drivers`, and `PATCH /drivers/:id` API to manage drivers
- Add driver-vehicle assignment: `PATCH /drivers/:id` accepts `vehicleId` to assign or unassign a driver; when a driver is assigned to a vehicle, the vehicle status changes to `ACTIVE`; when unassigned, it reverts to `WAITING_DRIVER`
- Add a new `/drivers` frontend page for driver CRUD and assignment
- Add `VEHICLE` and `DRIVER` to `ENTITY_TYPES` for audit logging (already partially exists — verify)
- Add `CreateVehicleDto`, `UpdateVehicleDto`, `CreateDriverDto`, `UpdateDriverDto` to `@tms/shared`
- Add `{ href: "/drivers", label: "Tài xế" }` to sidebar navigation

## Capabilities

### New Capabilities

- `vehicle-crud`: Create, update, and manage vehicle status; compliance date tracking; interactive management page at `/vehicles` (converted from SSR)
- `driver-crud`: Create, update, manage driver status; assign/unassign drivers to vehicles with automatic vehicle status transitions; management page at `/drivers`

### Modified Capabilities

<!-- None — vehicles page was read-only SSR with no mutation requirements. -->

## Impact

- `apps/api/src/modules/vehicle/` — new DTO files, extended controller and service (create, update, status)
- `apps/api/src/modules/` — new `driver/` module (controller, service, module, DTOs)
- `apps/api/src/app.module.ts` — register new DriverModule
- `packages/shared/src/index.ts` — new `CreateVehicleDto`, `UpdateVehicleDto`, `CreateDriverDto`, `UpdateDriverDto`; confirm `ENTITY_TYPES.VEHICLE` and add `ENTITY_TYPES.DRIVER`
- `apps/web/src/app/(authenticated)/vehicles/page.tsx` — full rewrite: SSR → client, add search/filter, add CRUD modals
- `apps/web/src/app/(authenticated)/drivers/page.tsx` — new file
- `apps/web/src/components/nav-sidebar.tsx` — add Tài xế link
- Trailer management is explicitly out of scope (deferred)
