## 1. Shared Types

- [x] 1.1 Add `CreateVehicleDto`, `UpdateVehicleDto` interfaces to `packages/shared/src/index.ts`
- [x] 1.2 Add `CreateDriverDto`, `UpdateDriverDto` interfaces to `packages/shared/src/index.ts`
- [x] 1.3 Confirm `ENTITY_TYPES.VEHICLE` exists; add `ENTITY_TYPES.DRIVER` to `packages/shared/src/index.ts`

## 2. Backend — Vehicle

- [x] 2.1 Create `apps/api/src/modules/vehicle/dto/create-vehicle.dto.ts` with `class-validator` decorators (`licensePlate` required, `vehicleType` required enum, optional compliance date fields)
- [x] 2.2 Create `apps/api/src/modules/vehicle/dto/update-vehicle.dto.ts` with all fields optional (including `status` enum)
- [x] 2.3 In `vehicle.service.ts`, add `create(dto)`: create record with `status: WAITING_DRIVER`, wrap in `$transaction`, audit log `CREATE`, handle Prisma `P2002` as `409 ConflictException`
- [x] 2.4 In `vehicle.service.ts`, add `update(id, dto)`: find record (throw `404` if not found), wrap in `$transaction`, update record, audit log `UPDATE`, handle `P2002` as `409`
- [x] 2.5 In `vehicle.controller.ts`, add `@Post()` for `create` and `@Patch(':id')` for `update`

## 3. Backend — Driver Module (new)

- [x] 3.1 Create `apps/api/src/modules/driver/` directory with `driver.module.ts`, `driver.service.ts`, `driver.controller.ts`
- [x] 3.2 Create `apps/api/src/modules/driver/dto/create-driver.dto.ts` (`fullName` required, `phone` and `notes` optional)
- [x] 3.3 Create `apps/api/src/modules/driver/dto/update-driver.dto.ts` with all fields optional (`fullName`, `phone`, `status` enum, `notes`, `vehicleId` nullable string)
- [x] 3.4 In `driver.service.ts`, implement `findAll()`: return all drivers ordered by `fullName`, include `vehicle: { select: { id, licensePlate, vehicleType } }`
- [x] 3.5 In `driver.service.ts`, implement `create(dto)`: create record with `status: ACTIVE`, wrap in `$transaction`, audit log `CREATE`
- [x] 3.6 In `driver.service.ts`, implement `update(id, dto)`: find record (throw `404` if not found), handle `vehicleId` assignment/unassignment separately — if `vehicleId` is provided (non-undefined), run assign/unassign logic in transaction; update other fields; audit log `UPDATE`
- [x] 3.7 In `driver.service.ts`, implement assign logic: if `vehicleId` is a string, check vehicle exists (throw `404`) and has no other driver (throw `409`), set `driver.vehicleId`, if vehicle status is `WAITING_DRIVER` set it to `ACTIVE`
- [x] 3.8 In `driver.service.ts`, implement unassign logic: if `vehicleId` is `null` and driver had a vehicle, clear `driver.vehicleId` and set vehicle status to `WAITING_DRIVER`
- [x] 3.9 In `driver.controller.ts`, add `@Get()`, `@Post()`, and `@Patch(':id')` endpoints with `@UseGuards(JwtAuthGuard)`, `@ApiTags`, `@ApiBearerAuth`
- [x] 3.10 Register `DriverModule` in `apps/api/src/app.module.ts`

## 4. Frontend — Vehicles Page Rewrite

- [x] 4.1 Rewrite `apps/web/src/app/(authenticated)/vehicles/page.tsx` as `"use client"` component that fetches `GET /api/vehicles` and renders a table (columns: licensePlate, vehicleType, status badge, driver name, compliance indicators, actions)
- [x] 4.2 Add client-side search input that filters by `licensePlate` and `driver.fullName` (case-insensitive, no debounce needed — client-side)
- [x] 4.3 Add status filter dropdown (all VehicleStatus values + blank "Tất cả")
- [x] 4.4 Add compliance expiry warning: show ⚠ next to each date cell if the date is within 30 days from today or already past
- [x] 4.5 Add create modal with fields: licensePlate (required), vehicleType select (required), inspectionExpiry date, insuranceExpiry date, registrationExpiry date, notes — calls `POST /api/vehicles`
- [x] 4.6 Add edit modal pre-filled from row data — calls `PATCH /api/vehicles/:id`
- [x] 4.7 Add inline status transition buttons per row: ACTIVE vehicle → "Bảo dưỡng" button; MAINTENANCE vehicle → "Kích hoạt" button; non-DECOMMISSIONED → "Ngừng hoạt động" button (confirmation required)

## 5. Frontend — Drivers Page (new)

- [x] 5.1 Create `apps/web/src/app/(authenticated)/drivers/page.tsx` as `"use client"` component that fetches `GET /api/drivers` and renders a table (columns: name, phone, status badge, assigned vehicle or "Chưa phân công", actions)
- [x] 5.2 Add create modal with fields: fullName (required), phone, notes — calls `POST /api/drivers`
- [x] 5.3 Add edit modal pre-filled from row data — calls `PATCH /api/drivers/:id` with non-assignment fields only
- [x] 5.4 For unassigned drivers: show "Phân công xe" button that opens an inline select populated from all WAITING_DRIVER vehicles; on confirm calls `PATCH /api/drivers/:id` with `{ vehicleId }`
- [x] 5.5 For assigned drivers: show "Hủy phân công" button that calls `PATCH /api/drivers/:id` with `{ vehicleId: null }` after confirmation
- [x] 5.6 Show API errors inline in modals and action buttons; refresh list after successful mutation

## 6. Frontend — Navigation

- [x] 6.1 Add `{ href: "/drivers", label: "Tài xế" }` to `BASE_NAV_ITEMS` in `apps/web/src/components/nav-sidebar.tsx`

## 7. Verification

- [x] 7.1 Run `npx tsc --noEmit -p apps/api/tsconfig.json` and fix any type errors
- [x] 7.2 Run `npx tsc --noEmit -p apps/web/tsconfig.json` and fix any type errors
- [ ] 7.3 Manually verify: create a vehicle (WAITING_DRIVER), create a driver, assign driver to vehicle (vehicle becomes ACTIVE), unassign driver (vehicle back to WAITING_DRIVER), set vehicle to MAINTENANCE
