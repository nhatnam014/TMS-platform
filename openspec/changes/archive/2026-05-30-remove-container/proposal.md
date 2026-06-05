## Why

The Container entity was added as a first-class tracked object but the business does not manage container lifecycle in the system — containers are referenced by number on trips and yard moves, not stored, looked up, or status-tracked. Removing the entity simplifies the schema and eliminates dead logic (status transitions, container upserts on every trip create/import).

## What Changes

- **BREAKING** Drop `Container` model and `containers` table from the database
- **BREAKING** Drop `ContainerSize` and `ContainerStatus` Prisma enums
- Replace `YardMove.containerId` (FK) with `YardMove.containerNumber` (plain string, required, regex-validated)
- Replace `TripPlan.outboundContainerId` / `inboundContainerId` (FKs) with `TripPlan.outboundContainerNumber` / `inboundContainerNumber` (plain strings, optional)
- Remove `Location.containersHere` reverse relation
- Delete `ContainerModule` (API controller + service + module files)
- Remove container status side-effect logic from `YardMoveService` and `TripPlanService`
- Remove container upsert logic from `ImportService` and `kehoach-xe.parser`
- Remove `/containers` web page and its nav sidebar entry
- Remove `ContainerSize`, `ContainerStatus` type exports and `ENTITY_TYPES.CONTAINER` from `@tms/shared`
- Add regex validation `^[A-Z]{4}\d{7}$` on all container number inputs (ISO 6346 prefix: 4 uppercase letters + 7 digits)

## Capabilities

### New Capabilities

- `container-number-validation`: Container number input validation using regex `^[A-Z]{4}\d{7}$` applied to YardMove and TripPlan fields

### Modified Capabilities

- `yard-move`: `containerId` FK replaced by plain `containerNumber` string field with regex constraint
- `container-list`: **Removed** — container listing page and API endpoint deleted
- `container-status`: **Removed** — container status tracking and transitions deleted
- `drop-hook-trip`: `outboundContainerId`/`inboundContainerId` FKs replaced by string fields; `GET /trip-plans/containers` endpoint removed
- `trip-plan-excel-import`: container upsert logic replaced by direct string storage
- `trip-plan-excel-export`: container number sourced from string fields instead of relation

## Impact

- **Database**: Destructive migration — drops `containers` table, removes FK columns, adds string columns
- **API**: `DELETE apps/api/src/modules/container/` directory; edits to yard-move, trip-plan, import, export, app.module
- **Shared package**: Removed type exports affect any consumer importing `ContainerSize`, `ContainerStatus`, or `ENTITY_TYPES.CONTAINER`
- **Web**: Delete `containers/page.tsx`; update yard-moves and trip-plans pages
