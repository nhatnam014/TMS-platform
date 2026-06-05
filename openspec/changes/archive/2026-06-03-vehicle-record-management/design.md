## Context

The customer manages vehicle assignments in a flat Excel sheet ("quản lý xe"). Each row represents one truck with its assigned driver, compliance dates, and one or more moocs (trailers), each also having compliance dates. The existing relational `vehicles`/`drivers`/`trailers` modules enforce data integrity that conflicts with this loose, operator-maintained format (e.g., blank driver rows, moocs without trucks, free-text vehicle types). This module digitizes the Excel sheet verbatim as a standalone CRUD entity with no referential constraints.

## Goals / Non-Goals

**Goals:**

- New `vehicle_records` table that maps 1:1 to a row in the Excel sheet.
- New `vehicle_record_moocs` child table for the multiple-mooc-per-record structure.
- Full CRUD API: list, create, update, delete (with cascade on moocs).
- Audit log on every mutation.
- Web UI page with a dynamic form (add/remove mooc rows inline).
- Table display showing all Excel columns including stacked mooc info.

**Non-Goals:**

- No cross-referencing with `Driver`, `Vehicle`, or `Trailer` models.
- No status machine, no assignment flow, no compliance alert integration.
- No import/export to/from Excel (out of scope for this change).
- No pagination for list (dataset is small — typically < 50 records).

## Decisions

### D1: Fully denormalized, FK-free record

**Decision**: `VehicleRecord` stores driver name, phone, vehicle type, and plate as plain `String?` fields. No `driverId` or `vehicleId` foreign key.

**Rationale**: Customer explicitly stated no referential integrity is needed. Free-text matches the Excel workflow where operators type values directly. Avoids any coupling to the relational vehicle/driver modules that would require keeping two systems in sync.

**Alternative considered**: Soft-link via optional FK — rejected because it would require UI pickers and create confusion when the relational data diverges from the record.

---

### D2: Moocs as a child table, replaced on update

**Decision**: `VehicleRecordMooc` is a separate table with a `vehicleRecordId` FK. On `PATCH /vehicle-records/:id`, the moocs array is **fully replaced** (delete all existing moocs for the record, insert the new array).

**Rationale**: Mooc count per record is small (typically 1–3). Full replacement is the simplest approach — no need to diff or track mooc identity across updates. The form always submits the full mooc list.

**Alternative considered**: Partial mooc update by mooc id — rejected as over-engineering for this scale and use case.

---

### D3: All fields nullable except id/timestamps

**Decision**: `tenTaiXe`, `sdt`, `loaiXe`, `bienSo`, `hanDangKiem`, `hanBaoHiem`, `hanCaVet`, `ghiChu` are all `String?` / `DateTime?`.

**Rationale**: The Excel has many blank cells (e.g., "Xe Chờ Tài" rows without a driver, mooc-only rows without a truck plate). Enforcing required fields would block valid data entry.

---

### D4: Audit log via existing AuditService

**Decision**: Reuse `AuditService.log()` inside `$transaction` blocks for all mutations, same pattern as `VehicleService` and `DriverService`.

**Rationale**: Consistent with the rest of the codebase. No new audit infrastructure needed.

---

### D5: Mooc dates stored on `VehicleRecordMooc`, not on `VehicleRecord`

**Decision**: The 3 compliance dates (hạn đăng kiểm, hạn bảo hiểm, hạn cà vẹt) exist on each mooc row, not on the parent vehicle record.

**Rationale**: Directly mirrors the Excel layout where columns I–L are mooc-specific. The vehicle-level dates (columns F–H) live on `VehicleRecord`.

---

### D6: UI table — stacked mooc rows per record

**Decision**: In the data table, each mooc occupies its own sub-row within the parent record's row. The vehicle-level columns (driver, plate, etc.) use `rowSpan` or are rendered once with `verticalAlign: top`.

**Rationale**: Matches how the Excel looks — secondary mooc rows appear beneath the primary mooc for the same truck. If a record has no moocs, the mooc cells are blank.

## Risks / Trade-offs

- **Duplicate data drift**: Because there are no FKs, a driver's phone number in `VehicleRecord` can diverge from the `drivers` table. This is intentional per customer requirements.
- **Replace-on-update moocs**: If a PATCH request is made with an empty moocs array, all existing moocs are deleted. The API must document this clearly, and the UI must always send the full mooc list on save.
- **No soft delete**: DELETE is a hard delete with cascade to moocs. Audit log captures the `beforeSnapshot` for recovery if needed.

## Migration Plan

1. Add new Prisma models to `schema.prisma`.
2. Run `prisma migrate dev` to generate and apply migration.
3. No data migration required — new tables start empty.
4. Deploy API and web together; no rollback coordination needed with other modules.
