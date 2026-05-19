## Context

The TMS has a `TripPlan` model (NestJS + Prisma) for road transport dispatch, a `Container` model with only `containerNumber` and `sizeType` (no status), and no concept of internal yard operations. Two daily workflows — Drop & Hook (Cắt kéo) road trips and Yard Move (Dọn bãi) internal shuttles — are currently untracked, leaving dispatchers blind to real-time container supply at factory yards.

The existing schema is PostgreSQL via Prisma. The API is NestJS with class-validator DTOs. Shared types live in `@tms/shared` consumed by both backend and frontend.

## Goals / Non-Goals

**Goals:**
- Track every container's state throughout the full cycle (depot → in transit → yard → loading dock → staging → in transit → delivered)
- Allow dispatchers to create Drop & Hook TripPlans and see which loaded containers are ready to hook at a given factory
- Record Yard Move operations with their own status lifecycle and internal cost structure
- Auto-update container status when TripPlan or YardMove status transitions occur

**Non-Goals:**
- Frontend pages for YardMove management or cắt kéo dispatch (follow-up change)
- Real-time push notifications when container status changes
- GPS tracking or IoT container location
- Import/SEA_IMPORT variant of Drop & Hook (deferred — SEA_EXPORT / NEO_EXPORT variants only for now)

## Decisions

### Decision 1: ContainerStatus as a field on Container, not a separate event log

**Choice**: Add `status: ContainerStatus` and `factoryZone: String?` directly to the `Container` model. No separate `ContainerStatusHistory` table.

**Rationale**: The current state is what dispatchers need to see — "how many LOADED_READY containers are at factory X right now." Historical state transitions can be derived from TripPlan and YardMove records (which already have `status` + `createdAt`/`updatedAt`). Adding a separate event log table would add query complexity without value for the current use case.

**Alternative considered**: Event-sourced `ContainerEvent` table — rejected as over-engineering for the current daily dispatch workflow.

---

### Decision 2: `factoryZone` as a plain String, not a normalized FactoryZone model

**Choice**: `Container.factoryZone` is a `String?` with well-known values: `"STAGING_DROP"`, `"LOADING_DOCK"`, `"STAGING_READY"`. No FK to a FactoryZone table.

**Rationale**: Zone names are stable within a factory and don't need their own CRUD lifecycle. Multiple factories may have different zone naming conventions — a string is flexible enough. A dedicated model would add a join for minimal benefit at this scale.

**Alternative considered**: `FactoryZone` model linked to `Location` — deferred as a future optimization if multi-factory zone management becomes a real need.

---

### Decision 3: YardMove is a separate entity, NOT a TripPlan variant

**Choice**: `YardMove` is its own Prisma model with its own status lifecycle, zone fields, and cost type. It does NOT extend or subtype `TripPlan`.

**Rationale**: YardMove lacks the core TripPlan fields: no `customer`, no `carrier`, no `serviceType`, no road-based `pickupLocation`/`dropoffLocation`, no external cost types (toll, gate fee). Forcing it into TripPlan would require making ~6 non-nullable TripPlan fields nullable, polluting the existing model and all its queries.

**Alternative considered**: `TripPlan` with `tripType: ROAD | YARD` flag — rejected because the structural difference is too large; field sets barely overlap beyond `containerId`, `date`, `status`, `costs`.

---

### Decision 4: Container status auto-transitions triggered by TripPlan.updateStatus()

**Choice**: When `TripPlanService.updateStatus()` is called on a DROP_AND_HOOK trip, it side-effects container status:

```
Trip DISPATCHED  → outboundContainer: EMPTY_IN_TRANSIT
Trip IN_TRANSIT  → outboundContainer: EMPTY_AT_YARD
                   (xe đã DROP, inboundContainer sẽ được assign sau)
Trip COMPLETED   → inboundContainer: DELIVERED
Trip CANCELLED   → outboundContainer: EMPTY_AVAILABLE (return to pool)
```

For STANDARD trips (no DROP_AND_HOOK), no container status change is triggered — containers on standard trips are tracked implicitly through TripPlan history.

**Rationale**: Keeping status transitions co-located with the domain event (trip status change) avoids a separate event bus. At this scale (tens of trips/day), a synchronous Prisma transaction is sufficient.

**Alternative considered**: Separate `ContainerService` with status management methods called explicitly — rejected as unnecessary indirection at current scale.

---

### Decision 5: YardMove completion triggers container status transition

**Choice**: When `YardMoveService.complete()` is called, it updates `Container.status` based on `toZone`:

```
toZone = "STAGING_DROP"   → status: EMPTY_AT_YARD
toZone = "LOADING_DOCK"   → status: BEING_LOADED
toZone = "STAGING_READY"  → status: LOADED_READY
```

Both TripPlan and YardMove write to `Container.status` — they are the only two mutation sources.

---

### Decision 6: Drop & Hook matching — Pre-planned, system-filtered

**Choice**: When dispatchers create a DROP_AND_HOOK TripPlan, they select the `inboundContainer` from a filtered list of containers with `status: LOADED_READY` at the target `loadUnloadLocation` (factory). The system exposes `GET /containers?status=LOADED_READY&locationId=<factory>` for this. The `inboundContainerId` MAY be null at creation (deferred matching — dispatcher fills it in later).

**Rationale**: Pre-planned matching gives dispatchers control and visibility. `inboundContainerId` nullable at creation handles the case where the yard hasn't finished loading when the trip is being planned.

**Alternative considered**: Automatic FIFO assignment — rejected because dispatchers need to control which container goes to which customer/port booking.

---

### Decision 7: TripMode added to TripPlan, default STANDARD

**Choice**: `TripPlan.tripMode: TripMode @default(STANDARD)`. Existing trips get STANDARD by migration default — no data migration needed. Validation added at API layer: if `tripMode = DROP_AND_HOOK` then `outboundContainerId != inboundContainerId` when both are provided.

## Risks / Trade-offs

- **Concurrent container status updates** → Two trips competing for the same `LOADED_READY` container (double-booking). Mitigation: Add a database-level unique constraint or optimistic locking at the `inboundContainerId` assignment point in a Prisma transaction. For MVP, accept the risk (low probability at current trip volume) and detect post-hoc via audit.

- **YardMove orphans if TripPlan is cancelled** → If a cắt kéo trip is cancelled after the empty container is already at the yard and a YardMove is in progress, the YardMove continues but has no downstream consumer. Mitigation: YardMove is self-contained; completed containers simply remain `LOADED_READY` until the next cắt kéo trip picks them up. No orphan risk — the yard cycle continues independently.

- **`factoryZone` is unvalidated string** → Typos in zone names won't be caught at the database level. Mitigation: Define zone values as constants in `@tms/shared` and validate via class-validator enum-check in the DTO.

- **Container status can become stale if trips are not updated** → If a dispatcher forgets to update trip status, container status stays at the wrong state. Mitigation: Accept for MVP; a future change can add scheduled status reconciliation.

## Migration Plan

1. Run `pnpm db:generate` after schema changes
2. Run `pnpm db:migrate --name add_drop_hook_yard_move`
   - Adds `status` column to `containers` with default `EMPTY_AVAILABLE` (safe for all existing container rows)
   - Adds `trip_mode` column to `trip_plans` with default `STANDARD` (safe for all existing trip rows)
   - Creates new `yard_moves` and `yard_move_costs` tables
3. Run `pnpm install` to pick up any new package updates
4. No seed changes required

**Rollback**: Drop `yard_moves`, `yard_move_costs` tables; remove `status`, `factory_zone`, `current_location_id` from `containers`; remove `trip_mode` from `trip_plans`.

## Open Questions

- **Multi-dock naming**: Should `LOADING_DOCK` zones be numbered (e.g., `LOADING_DOCK_1`, `LOADING_DOCK_2`)? For now, treating loading dock as a single zone and accepting free-text via `factoryZone` string. Revisit when multi-dock reporting is needed.
- **SEA_IMPORT Drop & Hook**: Trucks bringing inbound cargo to a factory and hooking an empty out — does this need the same DROP_AND_HOOK mode? Deferred; the `TripMode` enum is easily extended.
