## 1. Shared Types

- [x] 1.1 Add `ContainerStatus` enum to `packages/shared/src/index.ts` (7 values: EMPTY_AVAILABLE, EMPTY_IN_TRANSIT, EMPTY_AT_YARD, BEING_LOADED, LOADED_READY, LOADED_IN_TRANSIT, DELIVERED)
- [x] 1.2 Add `TripMode` enum to `packages/shared/src/index.ts` (STANDARD, DROP_AND_HOOK)
- [x] 1.3 Add `YardMoveStatus` enum to `packages/shared/src/index.ts` (PENDING, IN_PROGRESS, COMPLETED, CANCELLED)
- [x] 1.4 Add `YardCostType` enum to `packages/shared/src/index.ts` (YARD_HANDLING, FORKLIFT, OVERTIME, OTHER)
- [x] 1.5 Add `FactoryZone` constant object to `packages/shared/src/index.ts` (STAGING_DROP, LOADING_DOCK, STAGING_READY)
- [x] 1.6 Add `CreateYardMoveDto` type to `packages/shared/src/index.ts`
- [x] 1.7 Add `YardMoveFilters` type to `packages/shared/src/index.ts`

## 2. Prisma Schema

- [x] 2.1 Add `ContainerStatus`, `TripMode`, `YardMoveStatus`, `YardCostType` enums to `packages/db/prisma/schema.prisma`
- [x] 2.2 Add `status ContainerStatus @default(EMPTY_AVAILABLE)` field to `Container` model
- [x] 2.3 Add `factoryZone String?` field to `Container` model
- [x] 2.4 Add `currentLocationId String?` FK field and `currentLocation Location?` relation to `Container` model
- [x] 2.5 Add `tripMode TripMode @default(STANDARD)` field to `TripPlan` model
- [x] 2.6 Add `outboundContainerId String?` and `inboundContainerId String?` FK fields to `TripPlan` model with relations to `Container` (already existed in schema)
- [x] 2.7 Add `YardMove` model with all required fields (id, date, containerId, fromZone, toZone, locationId, status, notes, timestamps, costs relation)
- [x] 2.8 Add `YardMoveCost` model with all required fields (id, yardMoveId with cascade delete, type, amount, note, timestamps)

## 3. Database Migration

- [x] 3.1 Run `pnpm db:generate` to regenerate Prisma client after schema changes
- [x] 3.2 Run `pnpm db:migrate --name add_drop_hook_yard_move` to create and apply the migration

## 4. Container Module Updates

- [x] 4.1 Add `status` and `locationId` query params to `ContainerController` GET handler (if container controller exists, otherwise create minimal read-only endpoint)
- [x] 4.2 Add `findAll(filters: { status?, locationId? })` method to `ContainerService` that applies Prisma where clauses for both filters

## 5. TripPlan Module Updates

- [x] 5.1 Update `CreateTripPlanDto` to accept `tripMode`, `outboundContainerId`, and `inboundContainerId` fields with validation rules (outbound required when DROP_AND_HOOK, outbound ≠ inbound)
- [x] 5.2 Add cross-field validation to `CreateTripPlanDto`: if `tripMode = DROP_AND_HOOK`, `outboundContainerId` MUST be present and MUST NOT equal `inboundContainerId`
- [x] 5.3 Add `findLoadedReady(locationId: string)` method to `TripPlanService` querying containers where `status = LOADED_READY AND currentLocationId = locationId`
- [x] 5.4 Update `TripPlanService.updateStatus()` to detect DROP_AND_HOOK trips and perform container status side-effects within a Prisma transaction:
  - DISPATCHED → outboundContainer EMPTY_IN_TRANSIT
  - IN_TRANSIT → outboundContainer EMPTY_AT_YARD
  - COMPLETED → inboundContainer DELIVERED
  - CANCELLED → outboundContainer EMPTY_AVAILABLE

## 6. YardMove Module — Core

- [x] 6.1 Create `apps/api/src/modules/yard-move/` directory structure: `yard-move.module.ts`, `yard-move.controller.ts`, `yard-move.service.ts`
- [x] 6.2 Create `apps/api/src/modules/yard-move/dto/create-yard-move.dto.ts` with class-validator decorators and `factoryZone` enum validation
- [x] 6.3 Create `apps/api/src/modules/yard-move/dto/update-yard-move-status.dto.ts` accepting `{ status: YardMoveStatus }`
- [x] 6.4 Create `apps/api/src/modules/yard-move/dto/create-yard-move-cost.dto.ts` accepting `{ type: YardCostType, amount: number, note?: string }`
- [x] 6.5 Implement `YardMoveService.create()` — inserts a new YardMove record with status PENDING
- [x] 6.6 Implement `YardMoveService.findAll(filters)` — queries with optional `locationId` and `status` filters, includes `costs` relation
- [x] 6.7 Implement `YardMoveService.updateStatus(id, status)` — updates status; when transitioning to COMPLETED, runs container status side-effect in the same Prisma transaction (toZone → ContainerStatus mapping)
- [x] 6.8 Implement `YardMoveService.addCost(id, dto)` — creates a YardMoveCost linked to the given YardMove; throws NotFoundException if YardMove not found

## 7. YardMove Module — Controller & Registration

- [x] 7.1 Implement `YardMoveController` with routes: `POST /yard-moves`, `GET /yard-moves`, `PATCH /yard-moves/:id/status`, `POST /yard-moves/:id/costs`; apply `@UseGuards(JwtAuthGuard)` and `@ApiBearerAuth()` to all handlers
- [x] 7.2 Register `YardMoveModule` in `apps/api/src/app.module.ts`

## 8. Verification

- [x] 8.1 Run `pnpm type-check` (or `tsc --noEmit`) across affected packages and fix any TypeScript errors
- [x] 8.2 Run `pnpm lint` and fix any linting errors (eslint not installed — pre-existing infra issue; tsc passes clean)
- [ ] 8.3 Manually verify `POST /yard-moves` → `PATCH /yard-moves/:id/status` (COMPLETED, toZone=STAGING_READY) → `GET /containers?status=LOADED_READY` round-trip via Swagger or curl
- [ ] 8.4 Manually verify a DROP_AND_HOOK TripPlan status flow: DISPATCHED (outbound → EMPTY_IN_TRANSIT) → IN_TRANSIT (outbound → EMPTY_AT_YARD) → COMPLETED (inbound → DELIVERED)
