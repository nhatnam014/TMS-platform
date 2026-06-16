## 1. Database Migration

- [x] 1.1 Write Prisma migration: add nullable `vehicle_plate` column to `trip_plans` table
- [x] 1.2 Write migration SQL: `UPDATE trip_plans SET vehicle_plate = (SELECT license_plate FROM vehicles WHERE id = trip_plans.vehicle_id)`
- [x] 1.3 Write migration SQL: drop FK constraint and `vehicle_id` column from `trip_plans`
- [x] 1.4 Write migration SQL: drop tables in order — `vehicle_trailers`, `trailers`, `drivers`, `vehicles`
- [x] 1.5 Update `schema.prisma`: remove `Vehicle`, `Driver`, `Trailer`, `VehicleTrailer` models
- [x] 1.6 Update `schema.prisma`: remove `VehicleType`, `VehicleStatus`, `DriverStatus` enums
- [x] 1.7 Update `schema.prisma`: change `TripPlan.vehicleId` FK → `vehiclePlate String?` field (no relation)
- [x] 1.8 Run `prisma migrate dev` and verify migration applies cleanly

## 2. Shared Types

- [x] 2.1 In `packages/shared/src/index.ts`: change `CreateTripPlanDto.vehicleId: string` → `vehiclePlate?: string`
- [x] 2.2 In `packages/shared/src/index.ts`: change `UpdateTripPlanDto.vehicleId?: string` → `vehiclePlate?: string`
- [x] 2.3 In `packages/shared/src/index.ts`: change `TripPlanFilters.vehicleId?: string` → `vehiclePlate?: string`
- [x] 2.4 Remove `CreateVehicleDto`, `UpdateVehicleDto` from `packages/shared/src/index.ts`
- [x] 2.5 Remove `CreateDriverDto`, `UpdateDriverDto` from `packages/shared/src/index.ts`
- [x] 2.6 Remove `VehicleType`, `VehicleStatus`, `DriverStatus` enums from `packages/shared/src/index.ts`
- [x] 2.7 Remove `VehicleConflictEntry`, `VehicleImportPreviewResult` from `packages/shared/src/index.ts`
- [x] 2.8 Remove `ENTITY_TYPES.VEHICLE` and `ENTITY_TYPES.DRIVER` entries from `packages/shared/src/index.ts`

## 3. Delete Driver and Vehicle API Modules

- [x] 3.1 Delete `apps/api/src/modules/driver/` directory (all files: controller, service, module, DTOs)
- [x] 3.2 Delete `apps/api/src/modules/vehicle/` directory (all files: controller, service, module, DTOs)
- [x] 3.3 Remove `DriverModule` and `VehicleModule` imports from `apps/api/src/app.module.ts`

## 4. Update Trip Plan API

- [x] 4.1 In `apps/api/src/modules/trip-plan/dto/create-trip-plan.dto.ts`: replace `vehicleId` with `vehiclePlate` (optional string, `@IsOptional() @IsString()`)
- [x] 4.2 In `apps/api/src/modules/trip-plan/dto/update-trip-plan.dto.ts`: replace `vehicleId` with `vehiclePlate`
- [x] 4.3 In `apps/api/src/modules/trip-plan/trip-plan.service.ts`: remove `vehicle` from `TRIP_PLAN_INCLUDE` constant
- [x] 4.4 In `trip-plan.service.ts`: replace all `vehicleId: dto.vehicleId` → `vehiclePlate: dto.vehiclePlate` in `create()` and `update()` methods
- [x] 4.5 In `trip-plan.service.ts`: update `findAll()` filter — replace `where.vehicleId` with `where.vehiclePlate` contains filter
- [x] 4.6 In `trip-plan.service.ts`: update search `OR` clause — replace `{ vehicle: { licensePlate: { contains: s } } }` with `{ vehiclePlate: { contains: s, mode: 'insensitive' } }`
- [x] 4.7 In `trip-plan.service.ts`: update `mapped` result — remove `serviceType: tp.serviceTypeMaster` vehicle join references

## 5. Update Import Service

- [x] 5.1 In `apps/api/src/modules/import/import.service.ts`: remove the `findOrCreateDriver()` private method
- [x] 5.2 In `import.service.ts`: remove the `detectVehicleConflict()` private method
- [x] 5.3 In `import.service.ts`: remove the `upsertVehicle()` private method
- [x] 5.4 In `import.service.ts`: remove the `findOrCreateVehicle()` private method
- [x] 5.5 In `import.service.ts`: simplify `importVehicles()` — remove driver upsert and vehicle upsert calls from execute phase
- [x] 5.6 In `import.service.ts`: simplify `importVehicles()` preview phase — remove conflict detection, return `{ toCreate, warnings: [], errors }` only
- [x] 5.7 In `import.service.ts`: update `importTripPlans()` — replace `findOrCreateVehicle(row.vehiclePlate)` + `vehicleId: vehicle.id` with `vehiclePlate: row.vehiclePlate ?? null`

## 6. Update Export Service and Builders

- [x] 6.1 In `apps/api/src/modules/export/export.service.ts`: rewrite `exportVehicles()` to query `prisma.vehicleRecord.findMany({ include: { moocs: true } })` instead of Vehicle+Driver
- [x] 6.2 In `apps/api/src/modules/export/builders/quanly-xe.builder.ts`: rewrite `buildQuanLyXe()` to accept `VehicleRecord[]` with moocs; map columns to `tenTaiXe`, `sdt`, `bienSo`, `loaiXe`, `hanDangKiem`, `hanBaoHiem`, `hanCaVet`, and first mooc fields
- [x] 6.3 In `apps/api/src/modules/export/builders/kehoach-xe.builder.ts`: change line 81 from `tp.vehicle?.licensePlate ?? ""` to `tp.vehiclePlate ?? ""`

## 7. Update Dashboard Service

- [x] 7.1 In `apps/api/src/modules/dashboard/dashboard.service.ts`: replace `prisma.vehicle.count({ where: { status: "ACTIVE" } })` with `prisma.vehicleRecord.count()`
- [x] 7.2 In `dashboard.service.ts`: replace `prisma.vehicle.count({ where: { status: "MAINTENANCE" } })` with hardcoded `0`
- [x] 7.3 In `dashboard.service.ts`: replace the Vehicle expiry query with a `prisma.vehicleRecord.count()` query filtering rows where `hanDangKiem`, `hanBaoHiem`, or `hanCaVet` is within the next 30 days

## 8. Update Vehicle Record Form (Web)

- [x] 8.1 In `apps/web/src/app/(authenticated)/vehicle-records/page.tsx`: remove `DriverOption` and `VehicleOption` interfaces
- [x] 8.2 In `vehicle-records/page.tsx`: remove `drivers` and `vehicles` state variables (`useState<DriverOption[]>`, `useState<VehicleOption[]>`)
- [x] 8.3 In `vehicle-records/page.tsx`: remove `selectedDriverId`, `setSelectedDriverId`, `createSelectedDriverId`, `setCreateSelectedDriverId`, `editSelectedDriverId`, `setEditSelectedDriverId` state
- [x] 8.4 In `vehicle-records/page.tsx`: remove `selectedVehicleId`, `setSelectedVehicleId`, `createSelectedVehicleId`, `setCreateSelectedVehicleId`, `editSelectedVehicleId`, `setEditSelectedVehicleId` state
- [x] 8.5 In `vehicle-records/page.tsx`: delete the `fetchDropdownData()` function entirely
- [x] 8.6 In `vehicle-records/page.tsx`: simplify `openCreate()` — remove `await fetchDropdownData()` call
- [x] 8.7 In `vehicle-records/page.tsx`: simplify `openEdit()` — remove `fetchDropdownData()` call and driver/vehicle matching logic
- [x] 8.8 In `vehicle-records/page.tsx`: update `RecordFormFields` component — remove `drivers`, `vehicles`, `selectedDriverId`, `setSelectedDriverId`, `selectedVehicleId`, `setSelectedVehicleId` props and their types
- [x] 8.9 In `vehicle-records/page.tsx`: remove `SelectField` for "Chọn tài xế" and `handleDriverSelect` function from `RecordFormFields`
- [x] 8.10 In `vehicle-records/page.tsx`: remove `SelectField` for "Chọn xe" and `handleVehicleSelect` function from `RecordFormFields`
- [x] 8.11 In `vehicle-records/page.tsx`: remove `driverLocked` and `vehicleLocked` variables; remove `disabled` prop from all `TextField` components in the form
- [x] 8.12 In `vehicle-records/page.tsx`: update the two `Modal` usages to remove the driver/vehicle props from `RecordFormFields`

## 9. Update Trip Plans Form (Web)

- [x] 9.1 In `apps/web/src/app/(authenticated)/trip-plans/page.tsx`: remove `VehicleOption` interface
- [x] 9.2 In `trip-plans/page.tsx`: remove `vehicles` state (`useState<VehicleOption[]>`) from the `refs` or component state
- [x] 9.3 In `trip-plans/page.tsx`: remove `fetch("/api/vehicles")` call from the reference data loading effect
- [x] 9.4 In `trip-plans/page.tsx`: remove `vehicles` from the refs object passed to form components
- [x] 9.5 In `trip-plans/page.tsx`: replace `vehicleId` state with `vehiclePlate` state (string) in both create and edit form state
- [x] 9.6 In `trip-plans/page.tsx`: replace the vehicle `Combobox` component with a plain text `<input>` for license plate in the create form section
- [x] 9.7 In `trip-plans/page.tsx`: replace the vehicle `Combobox` component with a plain text `<input>` for license plate in the edit form section
- [x] 9.8 In `trip-plans/page.tsx`: update form submit handlers — send `vehiclePlate` instead of `vehicleId`
- [x] 9.9 In `trip-plans/page.tsx`: remove the "pre-select first vehicle" `useEffect` logic
- [x] 9.10 In `trip-plans/page.tsx`: update the table display column — show `trip.vehiclePlate ?? "—"` instead of `trip.vehicle?.licensePlate`

## 10. Delete Web Pages and Update Navigation

- [x] 10.1 Delete `apps/web/src/app/(authenticated)/drivers/page.tsx`
- [x] 10.2 Delete `apps/web/src/app/(authenticated)/vehicles/page.tsx`
- [x] 10.3 In `apps/web/src/components/nav-sidebar.tsx`: remove `{ href: "/vehicles", label: "Phương tiện" }` from `BASE_NAV_ITEMS`
- [x] 10.4 In `apps/web/src/components/nav-sidebar.tsx`: remove `{ href: "/drivers", label: "Tài xế" }` from `BASE_NAV_ITEMS`

## 11. Verify and Clean Up

- [x] 11.1 Run `pnpm build` (or `pnpm type-check`) across the monorepo and fix all TypeScript errors related to removed Vehicle/Driver types
- [x] 11.2 Verify no remaining imports of `DriverModule`, `VehicleModule`, `/api/drivers`, `/api/vehicles` in source files
- [ ] 11.3 Verify the trip-plans page creates a trip with `vehiclePlate` and the value appears correctly in the table
- [ ] 11.4 Verify the vehicle-records form opens without any driver/vehicle dropdown and all fields are editable
- [ ] 11.5 Verify the quanly-xe Excel export downloads and contains VehicleRecord data (not Vehicle+Driver data)
- [ ] 11.6 Verify the dashboard stats load without errors (vehiclesActive from VehicleRecord count)
