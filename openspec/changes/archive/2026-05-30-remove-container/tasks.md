## 1. Database Schema

- [x] 1.1 Remove `Container` model, `ContainerSize` enum, and `ContainerStatus` enum from `packages/db/prisma/schema.prisma`
- [x] 1.2 Replace `containerId String` FK on `YardMove` with `containerNumber String` (no FK, no relation)
- [x] 1.3 Replace `outboundContainerId String?` and `inboundContainerId String?` FKs on `TripPlan` with `outboundContainerNumber String?` and `inboundContainerNumber String?`
- [x] 1.4 Remove `containersHere Container[]` reverse relation from `Location` model
- [x] 1.5 Run `pnpm db:generate` to regenerate `@tms/db` Prisma client
- [ ] 1.6 Run `pnpm db:migrate` to create and apply the destructive migration

## 2. Shared Package

- [x] 2.1 Remove `ContainerSize` and `ContainerStatus` type exports from `packages/shared/src/index.ts`
- [x] 2.2 Remove `ENTITY_TYPES.CONTAINER` from the `ENTITY_TYPES` constant in `packages/shared/src/index.ts`
- [x] 2.3 Update `CreateYardMoveDto` in `packages/shared/src/index.ts`: rename `containerId: string` to `containerNumber: string`
- [x] 2.4 Remove `outboundContainerId?: string` and `inboundContainerId?: string` from `CreateTripPlanDto` in `packages/shared/src/index.ts` (keep `outboundContainerNumber?` and `inboundContainerNumber?`)

## 3. Delete Container API Module

- [x] 3.1 Delete the entire `apps/api/src/modules/container/` directory
- [x] 3.2 Remove `ContainerModule` import and entry from `apps/api/src/app.module.ts`

## 4. YardMove API

- [x] 4.1 Update `apps/api/src/modules/yard-move/dto/create-yard-move.dto.ts`: replace `containerId` field with `containerNumber` string, add `@Matches(/^[A-Z]{4}\d{7}$/, { message: 'Container number must be 4 uppercase letters followed by 7 digits' })` decorator, import `Matches` from `class-validator`
- [x] 4.2 Update `apps/api/src/modules/yard-move/yard-move.service.ts`: remove `ContainerStatus` import, remove `ZONE_TO_CONTAINER_STATUS` constant, change `containerId: dto.containerId` to `containerNumber: dto.containerNumber` in `create()`, remove `container` from all `include` clauses, remove `tx.container.update()` block from `updateStatus()` COMPLETED branch

## 5. TripPlan API

- [x] 5.1 Update `apps/api/src/modules/trip-plan/trip-plan.service.ts`: remove `ContainerStatus` import, remove container upsert blocks in `create()`, change `outboundContainerId`/`inboundContainerId` to `outboundContainerNumber`/`inboundContainerNumber` in create data
- [x] 5.2 Update `findAll()` in trip-plan service: remove `outboundContainer`/`inboundContainer` includes, update search filter to use `outboundContainerNumber`/`inboundContainerNumber` string contains
- [x] 5.3 Update `findOne()` in trip-plan service: remove `outboundContainer: true, inboundContainer: true` includes
- [x] 5.4 Remove all `tx.container.update()` status transition blocks from `updateStatus()` (DISPATCHED, IN_TRANSIT, COMPLETED, CANCELLED branches)
- [x] 5.5 Remove `getLoadedContainers()` method from trip-plan service and its corresponding `GET /trip-plans/containers` endpoint from `trip-plan.controller.ts`
- [x] 5.6 Update DROP_AND_HOOK validation in `create()`: check `outboundContainerNumber` (not `outboundContainerId`), and compare string values for the "must differ" check

## 6. Import Service

- [x] 6.1 Remove `findOrCreateContainer()` private method from `apps/api/src/modules/import/import.service.ts`
- [x] 6.2 Update `importTripPlans()` in import service: replace container upsert calls with direct `outboundContainerNumber: row.outboundContainerNumber ?? null` and `inboundContainerNumber: row.inboundContainerNumber ?? null`
- [x] 6.3 Update `apps/api/src/modules/import/parsers/kehoach-xe.parser.ts`: remove `ContainerSize` import from `@tms/shared`, remove `outboundContainerSize` and `inboundContainerSize` from `ParsedRow` interface and all usages

## 7. Export Builder

- [x] 7.1 Update `apps/api/src/modules/export/builders/kehoach-xe.builder.ts`: replace `outbound?.containerNumber` with `tp.outboundContainerNumber ?? ""` and `inbound?.containerNumber` with `tp.inboundContainerNumber ?? ""`; replace `outbound?.sizeType` and `inbound?.sizeType` with `""` (size not stored)

## 8. Web — Delete Containers Page and Nav Entry

- [x] 8.1 Delete `apps/web/src/app/(authenticated)/containers/page.tsx`
- [x] 8.2 Remove `{ href: "/containers", label: "Container" }` from `BASE_NAV_ITEMS` in `apps/web/src/components/nav-sidebar.tsx`

## 9. Web — YardMoves Page

- [x] 9.1 Update `apps/web/src/app/(authenticated)/yard-moves/page.tsx`: remove `ContainerOption` interface, remove `containers` state and fetch, rename `containerId` state to `containerNumber`, update the form field to a text input with `pattern="[A-Z]{4}[0-9]{7}"` and `placeholder="ABCD1234567"`, update form submit to send `containerNumber` instead of `containerId`

## 10. Type Check and Build

- [x] 10.1 Run `pnpm type-check` from repo root and fix any remaining TypeScript errors
- [x] 10.2 Run `pnpm build` from repo root and confirm zero errors
