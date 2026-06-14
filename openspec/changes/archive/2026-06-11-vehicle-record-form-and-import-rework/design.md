## Context

The TMS platform has three separate but related data stores:

- **Driver table** — master list of drivers (`fullName`, `phone`, `status`, 1:1 `vehicleId`)
- **Vehicle table** — master list of vehicles (`licensePlate` UNIQUE, `vehicleType`, compliance dates)
- **VehicleRecord table** — denormalized operational snapshot (`tenTaiXe`, `sdt`, `loaiXe`, `bienSo`, dates, moocs)

Currently the vehicle record form accepts free-text for all driver/vehicle fields, and Excel import creates VehicleRecord rows directly without consulting the master tables. The result is divergence: the same driver can appear with different spellings, and vehicle compliance dates in VehicleRecord may not match the Vehicle master.

The goal is to make VehicleRecord creation **DB-backed** for selection while keeping it **denormalized for storage** (no FK change, no migration, no breaking API change).

## Goals / Non-Goals

**Goals:**

- Form: driver and vehicle fields are populated by selecting from existing DB records, not typed freehand
- Form: selected fields are read-only (locked); user changes driver/vehicle by re-selecting from the dropdown
- Import: driver upsert by `(fullName, phone)` before creating VehicleRecord
- Import: vehicle conflict detection — if `bienSo` exists in Vehicle table and fields differ, collect conflicts and require user confirmation before writing
- Import: if user cancels conflict dialog → abort entire import (no partial writes)

**Non-Goals:**

- Adding `driverId` or `vehicleId` foreign keys to `VehicleRecord`
- Syncing VehicleRecord fields when Driver/Vehicle master records are later updated
- Allowing inline editing of driver/vehicle fields in the VehicleRecord form
- Conflict detection for drivers during import
- Changing any existing API contracts for `GET/PATCH/DELETE /api/vehicle-records`

## Decisions

### D1: Denormalized snapshot — no FK in VehicleRecord

**Decision**: VehicleRecord continues to store text fields (`tenTaiXe`, `sdt`, etc.) without adding `driverId`/`vehicleId` foreign keys.

**Rationale**: VehicleRecord is an operational log/snapshot used for compliance date tracking. Linking it to Driver/Vehicle via FK would require either: (a) always keeping records in sync when master data changes, or (b) accepting that the record reflects stale data silently. The denormalized approach is simpler, requires no migration, and is consistent with the existing Excel import pattern. The user confirmed this is the intended behavior.

**Alternative considered**: Add optional `driverId` + `vehicleId` FK columns. Rejected because it adds migration complexity and the FK relationship is not 1:1 (a driver can appear in many VehicleRecords over time across different vehicles).

---

### D2: Form — searchable dropdown with locked fields

**Decision**: Use a `<select>` or `<datalist>`-backed search input. After selection, the underlying text inputs (`tenTaiXe`, `sdt`, etc.) are populated and set to `disabled`. Re-selecting from the dropdown overwrites the autofill. No separate "clear" button.

**Rationale**: Matches the user's stated UX requirement ("chọn lại trực tiếp"). Simple to implement with existing frontend patterns. The disabled fields remain part of the form submission (value is still sent via state), only the input interaction is blocked.

**Implementation detail**: The component keeps separate `selectedDriverId` / `selectedVehicleId` state (not sent to the API) used only to track which record is "active" in the dropdown. When a driver is selected, `form.tenTaiXe` and `form.sdt` are overwritten and the inputs become `disabled`. When a vehicle is selected, `form.loaiXe`, `form.bienSo`, and the three date fields are overwritten and locked.

**Vehicle type mapping**: `Vehicle.vehicleType` is an enum (`SHACMAN`, `HOWO`, etc.) while `VehicleRecord.loaiXe` is free text. When autofilling, the enum value is used as-is for `loaiXe` (matches existing import behavior).

---

### D3: Import — two-phase conflict flow

**Decision**: Split `importVehicles` into two phases:

- **Phase 1 (preview)**: `POST /api/import/vehicles` with `?dryRun=true` (or a new endpoint `POST /api/import/vehicles/preview`) — parse Excel, run all upsert logic in memory, return `{ toCreate, conflicts, errors }` without writing anything.
- **Phase 2 (execute)**: `POST /api/import/vehicles/confirm` — accepts the same file (or a session token) and a `confirmedConflicts: true` flag, runs the full write.

**Simpler alternative chosen**: Use a single `POST /api/import/vehicles` with a `confirm=true` query param. When `confirm=false` (default), the service parses and returns a preview response. When `confirm=true`, the service parses again and executes. This avoids server-side session state for the "pending import" data.

**Rationale for re-parse on confirm**: The file is small enough that re-parsing on confirm has negligible cost. Storing the parsed result server-side between Phase 1 and Phase 2 would require session/cache infrastructure.

---

### D4: Import — driver upsert key

**Decision**: Match drivers by `(fullName, phone)` exact pair (case-sensitive). If no match → create new Driver. No conflict detection or update for drivers.

**Rationale**: User stated "cùng tên khác SĐT = người mới" — the business rule treats the (name, phone) pair as the natural key. Phone alone is insufficient because the same phone could theoretically be shared. Name alone is too ambiguous. The company manages driver deduplication manually on the Drivers page.

---

### D5: Import — vehicle conflict definition

A conflict is recorded when `Vehicle.licensePlate == row.bienSo` AND at least one of `vehicleType`, `inspectionExpiry`, `insuranceExpiry`, or `registrationExpiry` differs from the Excel row values.

When the user confirms, conflicting vehicles are **updated** (overwrite with Excel values), and all VehicleRecords are created with Excel values regardless.

If the license plate exists but no fields differ → silently reuse (no conflict).

## Risks / Trade-offs

**[Risk] Re-parsing file on confirm adds latency** → Mitigation: File is at most a few hundred rows; re-parse is <100ms. Acceptable.

**[Risk] Driver dropdown may have hundreds of entries, causing slow search** → Mitigation: Frontend filters the loaded list client-side. `GET /api/drivers` is already paginated/sorted; with <500 drivers this is fine without server-side search.

**[Risk] Two users import the same file simultaneously** → Mitigation: Out of scope for this change. Last-write-wins on Vehicle update is acceptable for this business context.

**[Risk] `vehicleType` enum mismatch when autofilling from Vehicle to VehicleRecord.loaiXe** → Mitigation: Use enum value string as-is. Existing records imported from Excel already use raw strings like "SHACMAN". Consistent.

**[Risk] Disabled form fields may confuse users who want to enter a vehicle not in DB** → Mitigation: The form still works if no driver/vehicle is selected from dropdown; all fields remain editable in that case. Only selecting from dropdown locks the fields.

## Migration Plan

- No database schema changes → no migration file needed.
- The `POST /api/import/vehicles` endpoint gains a `?confirm=true` query param. Without it, the endpoint now returns a preview (non-breaking for the frontend since we update the frontend simultaneously).
- Existing VehicleRecords are unaffected (denormalized data remains as-is).
- Rollback: revert the two changed files (`import.service.ts` and `vehicle-records/page.tsx`).

## Open Questions

None — all decisions confirmed with user in design exploration session.
