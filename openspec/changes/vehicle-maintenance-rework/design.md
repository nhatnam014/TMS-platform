## Context

The existing `vehicle_maintenance_records` table was introduced as a standalone entity soft-linked to `vehicle_records` via a nullable FK. It duplicates `bienSo`, `tenTaiXe`, `sdt`, and `loaiXe` from `vehicle_records`, and captures only a single maintenance event per vehicle with three fixed km columns. The business requirement is a 1-1 relationship (one vehicle = one maintenance profile), with a growing number of km checkpoints (rounds) that accumulate over time. The current data is test-only and can be discarded.

## Goals / Non-Goals

**Goals:**
- Replace the ad-hoc maintenance table with a clean `VehicleRecord`-owned km rounds model
- Make the bảo dưỡng xe page a filtered view of `VehicleRecord` (no separate entity)
- Enable dynamic N km columns that expand from import data without schema changes
- Rework Excel import/export to source from `VehicleRecord`, with loaiXe-based sheet grouping and a UI selector popup

**Non-Goals:**
- Storing full maintenance history (parts replaced, cost, technician notes) — only km round checkpoints are tracked
- Soft deletes or audit trail for km rounds
- Multi-tenant or per-user filtering beyond existing auth

## Decisions

### D1: KM rounds as a separate child table (not JSON, not fixed columns)

**Decision:** Add `vehicle_maintenance_km_rounds(id, vehicle_record_id, round_number, km_con)` with a unique constraint on `(vehicle_record_id, round_number)`.

**Rationale:**
- Fixed columns (km_lan_1..4) require a migration every time a new round is needed — rejected.
- JSON column (e.g., `kmRounds: Decimal[]`) cannot be queried for MAX(round_number) per loaiXe group in SQL; requires full table scan in application code — rejected for export logic.
- Separate table allows `SELECT MAX(round_number) FROM vehicle_maintenance_km_rounds WHERE vehicle_record_id IN (...)` for both export column count and page dynamic column logic.

**Upsert key:** `(vehicleRecordId, roundNumber)` — ensures idempotent import (re-running the same Excel file is safe).

### D2: Add donViSuaChua and ngayLam to VehicleRecord (not a thin 1-1 table)

**Decision:** Add two nullable columns directly to `vehicle_records`: `don_vi_sua_chua` and `ngay_lam`.

**Rationale:**
- A separate 1-1 `VehicleMaintenanceMeta` table adds a JOIN on every page load with no query-isolation benefit.
- Both fields are attributes of the vehicle's current maintenance state, not a separate aggregate.
- Eliminates the possibility of a vehicle having no maintenance meta row (the page must show all vehicles).

### D3: Dynamic column count — computed per pagination batch, minimum 4

**Decision:** The frontend fetches a page of `VehicleRecord` objects each including their `kmRounds[]` array. It computes `maxRound = max(record.kmRounds.length)` across the batch, then renders `max(4, maxRound)` km columns.

**Rationale:** Column count changes page-to-page based on what data exists in that batch, which matches the business expectation ("the view adapts to the data"). Minimum 4 ensures new vehicles always see a useful empty grid.

### D4: Export popup sources loaiXe from VehicleRecord (not from maintenance table)

**Decision:** `GET /api/vehicle-records/distinct-loai-xe` returns distinct `loaiXe` values from `vehicle_records`. The export page shows a multi-select popup from this list.

**Rationale:** With the maintenance table gone, the source of truth for vehicle grouping is `vehicle_records.loai_xe`.

### D5: Import creates VehicleRecord when no ID column

**Decision:** If an import row has no ID value (column absent or empty), create a new `VehicleRecord` with fields mapped from the Excel row (bienSo, tenTaiXe, sdt, loaiXe, donViSuaChua, ngayLam). Do not attempt to match by bienSo.

**Rationale:** Matching by bienSo is error-prone (typos, duplicates). Explicit ID is the contract. Users who want to update an existing vehicle must include the ID column (which the export always provides).

## Risks / Trade-offs

- **Risk: Round number gaps** — if a user imports rounds 1, 3 (skipping 2), the km table stores both; the view renders a blank cell for round 2. → Acceptable; round numbers come from detected column order in Excel, so gaps only occur if user manually deletes a column from the export.
- **Risk: donViSuaChua name conflict** — the old `VehicleMaintenanceRecord` had a field named `donViSuaChua`; the new field on `VehicleRecord` has the same business meaning but lives in a different table. → Import parsers and builders must reference `VehicleRecord`, not the old table.
- **Risk: Existing vehicle-maintenance API consumers** — the `vehicle-maintenance` module's endpoints change shape significantly. → No external consumers; all API calls originate from the web app in this repo.

## Migration Plan

1. Add `don_vi_sua_chua` and `ngay_lam` columns to `vehicle_records` (nullable, no default needed)
2. Create `vehicle_maintenance_km_rounds` table
3. **Truncate** `vehicle_maintenance_records` (data is test-only, confirmed safe to discard)
4. Drop `vehicle_maintenance_records` table and its FK constraint
5. Remove `maintenanceRecords VehicleMaintenanceRecord[]` relation from `VehicleRecord` Prisma model
6. Drop `VehicleMaintenanceRecord` Prisma model

Rollback: Not applicable — data is test-only and direction is forward-only.

## Open Questions

- None — all decisions confirmed with product owner during exploration.
