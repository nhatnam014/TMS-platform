## Why

The Driver and Vehicle tables were originally standalone management modules, but they are no longer needed as independent entities. The Vehicle Record (`VehicleRecord`) module already stores all vehicle compliance data as plain strings (no FK), making the separate Vehicle/Driver tables redundant overhead. Removing them simplifies the data model, reduces maintenance surface, and eliminates the confusing dual-entry pattern where users had to manage both a Vehicle record AND a VehicleRecord entry for the same vehicle.

## What Changes

- **BREAKING** Remove `drivers` and `vehicles` database tables (and `trailers`, `vehicle_trailers`)
- **BREAKING** Remove `Driver`, `Vehicle`, `Trailer`, `VehicleTrailer` Prisma models and related enums (`VehicleType`, `VehicleStatus`, `DriverStatus`)
- **BREAKING** Migrate `TripPlan.vehicleId` (FK → Vehicle) to `TripPlan.vehiclePlate` (plain String) with data migration copying existing plate values
- Remove driver/vehicle select dropdowns from the Vehicle Record create/edit form — all fields become plain text inputs
- Remove `findOrCreateDriver` and `upsertVehicle` side-effects from the vehicle Excel import flow
- Remove `findOrCreateVehicle` side-effect from the trip-plan Excel import flow
- Replace `exportVehicles()` (queries Vehicle+Driver) with VehicleRecord-based export
- Update dashboard stats to source from `VehicleRecord` instead of `Vehicle` table
- Delete Driver and Vehicle CRUD API modules, web pages, and nav sidebar links
- Update shared types: `CreateTripPlanDto.vehicleId` → `vehiclePlate`; remove Vehicle/Driver DTOs

## Capabilities

### New Capabilities
- `vehicle-record-plain-entry`: Vehicle Record form fields (driver name, phone, vehicle type, plate, compliance dates) are always plain text inputs — no autofill from external DB tables

### Modified Capabilities
- `vehicle-record-driver-select`: Requirement removed — driver select dropdown is eliminated entirely
- `vehicle-record-vehicle-select`: Requirement removed — vehicle select dropdown is eliminated entirely
- `vehicle-excel-import`: Import no longer creates/updates Driver or Vehicle DB rows; imports directly into VehicleRecord only
- `vehicle-excel-export`: Export now sources from `VehicleRecord` rows instead of `Vehicle+Driver` join
- `trip-plan-crud`: `vehicleId` (FK) replaced by `vehiclePlate` (plain string) in create/update/filter
- `trip-plan-excel-import`: Import no longer calls `findOrCreateVehicle`; stores plate string directly on TripPlan
- `trip-plan-excel-export`: Builder reads `vehiclePlate` field instead of `vehicle.licensePlate` join
- `driver-crud`: Capability removed — entire driver CRUD flow (API, web page, nav link) is deleted
- `vehicle-crud`: Capability removed — entire vehicle CRUD flow (API, web page, nav link) is deleted

## Impact

**Database**
- Migration: add `vehicle_plate` column to `trip_plans`, copy data from joined `vehicles`, drop `vehicle_id` FK column, drop `vehicles`, `drivers`, `trailers`, `vehicle_trailers` tables

**API (NestJS)**
- Delete: `apps/api/src/modules/driver/`
- Delete: `apps/api/src/modules/vehicle/`
- Modify: `import.service.ts` — remove driver/vehicle upsert helpers
- Modify: `trip-plan.service.ts` + DTOs — vehicleId → vehiclePlate
- Modify: `export.service.ts` + `quanly-xe.builder.ts` — VehicleRecord source
- Modify: `dashboard.service.ts` — stats from VehicleRecord
- Modify: `app.module.ts` — remove DriverModule, VehicleModule

**Web (Next.js)**
- Delete: `apps/web/src/app/(authenticated)/drivers/page.tsx`
- Delete: `apps/web/src/app/(authenticated)/vehicles/page.tsx`
- Modify: `vehicle-records/page.tsx` — remove select dropdowns, remove API calls to /api/drivers and /api/vehicles
- Modify: `trip-plans/page.tsx` — vehicle combobox → plain text input
- Modify: `nav-sidebar.tsx` — remove "Phương tiện" and "Tài xế" links

**Shared types (`packages/shared/src/index.ts`)**
- Remove: `CreateVehicleDto`, `UpdateVehicleDto`, `CreateDriverDto`, `UpdateDriverDto`, `VehicleType`, `VehicleStatus`, `DriverStatus`, `VehicleConflictEntry`, `VehicleImportPreviewResult`
- Modify: `CreateTripPlanDto.vehicleId` → `vehiclePlate`, `UpdateTripPlanDto.vehicleId` → `vehiclePlate`, `TripPlanFilters.vehicleId` → `vehiclePlate`
