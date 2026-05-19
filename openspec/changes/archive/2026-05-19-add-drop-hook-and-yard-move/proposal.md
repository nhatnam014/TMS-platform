## Why

The TMS currently has no way to model Drop & Hook (Cắt kéo) trips or internal Yard Move (Dọn bãi) operations — two interdependent logistics workflows that run daily at customer factories. Without tracking these, dispatchers cannot see how many loaded containers are ready to be hooked, cannot plan cắt kéo trips against real-time yard supply, and cannot account for internal yard costs.

## What Changes

- **Add `ContainerStatus` lifecycle to the `Container` model** — a state machine tracking each container from `EMPTY_AVAILABLE` through yard processing to `DELIVERED`, including a `factoryZone` field to locate containers within factory zones (bãi cắt kéo / máng kho / bãi chờ).
- **Add `TripMode` to `TripPlan`** — a new `tripMode` field (`STANDARD` | `DROP_AND_HOOK`) distinguishing regular trips (xe chờ đóng hàng) from cắt kéo trips (DROP one empty, HOOK one loaded — CONT ĐI ≠ CONT VỀ always).
- **Add `YardMove` model** — a new entity representing internal yard shuttle operations, with its own status lifecycle, factory zones, and cost structure (separate from TripPlan costs which cover road transport).
- **Add `YardMove` NestJS module** — CRUD API for yard moves, including container status transitions triggered by move completion.
- **Add container status filter to TripPlan dispatch API** — when creating a DROP_AND_HOOK TripPlan, the API exposes loaded containers available for hooking (`LOADED_READY` at the target factory) to support dispatcher matching.
- **Auto-update container status on TripPlan status changes** — when a cắt kéo trip moves to `IN_TRANSIT`, the outbound container becomes `EMPTY_IN_TRANSIT`; when it reaches the factory (dispatched), it moves to `EMPTY_AT_YARD`; when hooked and delivered, inbound container becomes `DELIVERED`.

## Capabilities

### New Capabilities

- `container-status`: Container lifecycle state machine — `ContainerStatus` enum, `factoryZone` field, and all status transition rules across cắt kéo and dọn bãi operations
- `drop-hook-trip`: Drop & Hook trip mode for `TripPlan` — `TripMode` enum, validation that outbound ≠ inbound container, container status auto-updates on trip status changes, and filtered container lookup for dispatch
- `yard-move`: Yard Move entity and API — internal yard shuttle operations with status lifecycle, zone-to-zone moves, internal cost tracking, and container status transitions on completion

### Modified Capabilities

<!-- none — no existing specs cover container status or trip modes -->

## Impact

- **`packages/db/prisma/schema.prisma`** — new `ContainerStatus`, `TripMode`, `YardMoveStatus`, `YardCostType` enums; new `YardMove` and `YardMoveCost` models; added fields on `Container` (`status`, `factoryZone`, `currentLocationId`) and `TripPlan` (`tripMode`)
- **`packages/db/prisma/seed.ts`** — no changes required (container status defaults handle new fields)
- **`apps/api/src/modules/trip-plan/trip-plan.service.ts`** — container status auto-update on `updateStatus()` calls; new `findLoadedReady()` method for drop-hook dispatch support
- **`apps/api/src/modules/`** — new `yard-move/` module (controller, service, module)
- **`packages/shared/src/index.ts`** — new exported types: `ContainerStatus`, `TripMode`, `YardMoveStatus`, `YardCostType`, `CreateYardMoveDto`, `YardMoveFilters`
- **`apps/web`** — (out of scope for this change; frontend pages for yard moves and cắt kéo dispatch will be added in a follow-up change)
