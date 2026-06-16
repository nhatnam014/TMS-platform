## Context

The TMS platform has two parallel vehicle management concepts:
1. **Vehicle table** (`vehicles`) — a normalized entity with FK relationships. `TripPlan.vehicleId` is a required FK pointing here. Also linked to `Driver` (1:1), `Trailer` (M:N via `vehicle_trailers`).
2. **VehicleRecord table** (`vehicle_records`) — a standalone flat record with no FKs. Stores driver name, phone, plate, vehicle type, and compliance dates as plain strings, plus a nested `vehicle_record_moocs` table.

The Vehicle/Driver tables were originally intended as master data for the vehicle fleet, but in practice the VehicleRecord module handles all operational compliance tracking. The Vehicle table's main remaining consumer is `TripPlan.vehicleId`.

**Dependency graph before:**
```
Driver ──(1:1)──► Vehicle ◄──(required FK)── TripPlan
                     │
             VehicleTrailer ──► Trailer

VehicleRecord (no FK to Vehicle/Driver)
```

**After:**
```
TripPlan.vehiclePlate (plain String?)

VehicleRecord (unchanged, still standalone)
```

## Goals / Non-Goals

**Goals:**
- Remove `vehicles`, `drivers`, `trailers`, `vehicle_trailers` tables from the database with zero data loss on `TripPlan` records (plate string is preserved)
- Eliminate the driver/vehicle select dropdowns from the VehicleRecord form — all fields become plain editable text
- Stop Excel import (quanly-xe) from writing to Vehicle/Driver tables
- Stop trip-plan import from calling `findOrCreateVehicle` — store plate string directly
- Replace Vehicle-based dashboard stats with VehicleRecord-based stats
- Replace Vehicle+Driver export with VehicleRecord export
- Remove Driver and Vehicle CRUD API modules and web pages entirely

**Non-Goals:**
- No changes to VehicleRecord data model (schema stays the same)
- No changes to other trip plan fields or business logic
- No UI redesign of the trip-plans page beyond the vehicle field change
- No data archiving — existing Vehicle/Driver data is discarded after migration copies plates

## Decisions

### D1: Migrate vehicleId FK → vehiclePlate String?

**Decision**: Change `TripPlan.vehicleId` (required FK) to `vehiclePlate String?` (nullable plain string).

**Rationale**: The only value TripPlan actually uses from Vehicle is `licensePlate`. Storing the plate directly eliminates the FK dependency entirely, matches how VehicleRecord already works, and is safe for migration (copy plate before dropping FK).

**Alternative considered**: Keep Vehicle table but make it a thin lookup (licensePlate only). Rejected — adds complexity, doesn't solve the problem of redundant master data management.

**Nullable**: `vehiclePlate` is nullable (`String?`) to maintain API consistency with other optional fields, and because legacy data may have edge cases. The trip-plans form enforces non-empty at the UI level.

### D2: Dashboard stats — source from VehicleRecord

**Decision**: Replace the three Vehicle-based dashboard stats with VehicleRecord-based equivalents:
- `vehiclesActive` → total count of `VehicleRecord` rows
- `vehiclesInMaintenance` → hardcoded `0` (concept no longer exists in data model)
- `expiringCompliance` → count of `VehicleRecord` rows where any of `hanDangKiem`, `hanBaoHiem`, or `hanCaVet` falls within the next 30 days

**Rationale**: VehicleRecord is the source of truth for compliance dates. The field names in `DashboardStats` interface are kept the same to avoid breaking the dashboard UI component.

### D3: VehicleRecord export — reuse existing columns

**Decision**: Rewrite `buildQuanLyXe` to accept `VehicleRecord[]` (with moocs) and map columns to VehicleRecord fields: `tenTaiXe`, `sdt`, `bienSo`, `loaiXe`, `hanDangKiem`, `hanBaoHiem`, `hanCaVet`, plus mooc data from the first mooc row.

**Rationale**: The VehicleRecord already contains all the information the export template needs. The export column structure remains the same.

### D4: Trip-plan import — store plate directly, no Vehicle lookup

**Decision**: In `importTripPlans`, replace `findOrCreateVehicle(row.vehiclePlate)` with direct `vehiclePlate: row.vehiclePlate` on the `tripPlan.create` call.

**Rationale**: Once Vehicle table is gone, there is no vehicle entity to look up. The plate string from the Excel row maps directly to `TripPlan.vehiclePlate`.

### D5: Migration order — data copy before drop

**Decision**: The Prisma migration must follow this order:
1. Add `vehicle_plate` column (nullable) to `trip_plans`
2. Run UPDATE to copy `license_plate` from joined `vehicles` table
3. Drop FK constraint + `vehicle_id` column from `trip_plans`
4. Drop tables in dependency order: `vehicle_trailers`, `trailers`, `drivers`, `vehicles`

**Rationale**: Steps 1-2 must happen while Vehicle table still exists. If reversed, data would be lost.

### D6: Remove VehicleImportPreviewResult conflict detection

**Decision**: Remove the entire conflict detection phase from `importVehicles`. The preview response becomes a simple `{ toCreate, errors }` (using the existing `ImportResult` shape instead of `VehicleImportPreviewResult`).

**Rationale**: Conflict detection existed to warn about Vehicle table updates. Without Vehicle upsert, there are no conflicts to detect. The import UI on the frontend already handles the `ImportResult` shape.

## Risks / Trade-offs

**[Risk: Existing data loss in Vehicle/Driver tables]** → Mitigation: The migration only copies `license_plate` from `vehicles` to `trip_plans.vehicle_plate`. Driver details, trailer assignments, and vehicle compliance data in the Vehicle table are discarded. Acceptable because VehicleRecord is the authoritative compliance source.

**[Risk: Trip plans with no matching vehicle in DB]** → Mitigation: Migration uses LEFT JOIN semantics — if `vehicle_id` has no match (shouldn't happen with FK, but defensive), `vehicle_plate` is set to NULL. The UI handles null gracefully.

**[Risk: Frontend still calling /api/vehicles or /api/drivers after deploy]** → Mitigation: Both API modules are removed simultaneously. Stale browser sessions will get 404s from the BFF proxy, which degrade gracefully (empty arrays in the removed dropdowns).

**[Risk: Shared type breakage]** → Mitigation: `vehicleId` → `vehiclePlate` is a rename, not a new field. Any code still referencing `vehicleId` will fail TypeScript compilation — caught before deploy.

## Migration Plan

**Steps:**
1. Write and run Prisma migration SQL (see D5 above)
2. Verify `trip_plans.vehicle_plate` populated correctly before dropping Vehicle table
3. Deploy API changes (new schema + updated modules)
4. Deploy web changes (updated forms, removed pages)

**Rollback:**
- Before migration runs: no changes needed
- After migration but before deploy: restore from DB backup (Vehicle table data is gone)
- After deploy: revert is not practical — treat as forward-only migration

**Open Questions:**
- None — all decisions confirmed by user in explore phase
