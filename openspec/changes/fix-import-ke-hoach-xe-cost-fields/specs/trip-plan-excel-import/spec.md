## MODIFIED Requirements

### Requirement: Admin can bulk-import trip plans from Excel

The system SHALL provide `POST /api/v1/import/trip-plans` that accepts a multipart/form-data request with a field named `file` containing an `.xlsx` file. The endpoint MUST parse the "kế hoạch xe" sheet using the actual 31-column template header structure, insert or update TripPlan records, auto-create missing reference entities (Customer, Carrier, Location, Vehicle), and return `{ imported: number, updated?: number, warnings: string[], errors: string[], changedRecords?: ImportChangedRecord[] }` with HTTP 200. Container records are NOT created during import. The endpoint SHALL be restricted to users with role ADMIN.

The 8 fixed cost columns (PHÍ NÂNG, PHÍ HẠ, PHÍ VỆ SINH, PHÍ CƯỢC, VÉ CỔNG, CHI PHÍ KHÁC/PHÍ ĐỨT TEM, CHI PHÍ TRÁI TUYẾN, CẦU ĐƯỜNG) and their SHĐ columns MUST be written directly to the corresponding fixed-slot scalar fields on `TripPlan` (`phiNangAmount`/`shdNang`, `phiHaAmount`/`shdHa`, `phiVeSinhAmount`/`shdVeSinh`, `phiCuocAmount`, `veCongAmount`/`shdVeCong`, `chiPhiKhacAmount`, `chiPhiTraiTuyenAmount`, `cauDuongAmount`) — the same fields used by the trip plan create/update form and by Excel export. When a fixed cost column has a non-zero value, the matching `*Name` field (e.g. `phiNangName`) MUST be set to the slot's fixed Vietnamese label (e.g. `"PHÍ NÂNG"`). Only the "CHI PHÍ PHÁT SINH KHÁC" column MUST continue to create/replace `TripPlanCost` rows (as ad-hoc "other costs"), matching the existing `otherCosts` semantics used by the create/update form. The endpoint MUST NOT look up or create any `TripCost` catalog entries.

`STT` (col 1) MUST be used to populate `TripPlan.tripNumber` on **update** of an existing row (row has an `id`), so STT (Excel) and `tripNumber` (DB) stay consistent for existing rows — this relies on Excel export now writing the real `tripNumber` value for STT (see `trip-plan-excel-export`), so a re-import without manual STT edits writes back the same value it read. A blank STT cell on update MUST NOT null out an existing `tripNumber` (conditional write, only when the cell has a value).

For a **new** row (no `id`), any value in the STT cell MUST be ignored. `TripPlan.tripNumber` MUST instead be auto-assigned as `(MAX(TripPlan.tripNumber) across all rows, or 0 if none) + 1`, computed inside the same transaction as the create.

`NGÀY GỬI CT` (col 28) MUST be parsed and persisted to `TripPlan.documentSentDate` on both create and update.

When updating an existing TripPlan (row has an `id`), the endpoint MUST compare the incoming row's values (core fields, the 8 fixed cost slots, `documentSentDate`, `tripNumber`) against the TripPlan's current values **before** writing the update. If at least one field differs:
- the endpoint MUST write an Audit Log entry (`action: "UPDATE"`, `entityType: "TripPlan"`, `entityId: <id>`, `beforeSnapshot`, `afterSnapshot`) inside the same transaction as the update.
- the endpoint MUST append an entry to the `changedRecords` array in the response: `{ rowNum, identifier, tripPlanId, changes: [{ field, oldValue, newValue }] }` listing only the fields that actually differ.
Rows where every compared field is unchanged MUST NOT produce an audit entry or a `changedRecords` entry.

The parser MUST map columns by their actual Vietnamese header names as they appear in the template:

- Col 1: STT → `tripNumber` on update of existing rows; ignored on create (auto-assigned instead, see above)
- Col 2: NGÀY → `tripDate`
- Col 3: SỐ XE → vehicle license plate
- Col 4: KHÁCH HÀNG → customer name
- Col 5: LOẠI HÌNH → `serviceType` (map: "SEA - EX" → SEA_EXPORT, "SEA - IM" → SEA_IMPORT, "NEO - EX" → NEO_EXPORT, "NEO - IM" → NEO_IMPORT)
- Col 6: ĐƠN VỊ → carrier name
- Col 7: SIZE CONT → `containerSize`
- Col 8: CONT ĐI → `outboundContainerNumber`
- Col 9: CONT VỀ → `inboundContainerNumber`
- Col 13: Điểm Lấy (R/H) → `pickupLocation`
- Col 14: Điểm (Đóng/Rút) → `loadUnloadLocation`
- Col 15: Điểm hạ (R/H) → `dropoffLocation`
- Col 16: PHÍ NÂNG → `TripPlan.phiNangAmount`, `phiNangName = "PHÍ NÂNG"`
- Col 17: SHĐ NÂNG → `TripPlan.shdNang`
- Col 18: PHÍ HẠ → `TripPlan.phiHaAmount`, `phiHaName = "PHÍ HẠ"`
- Col 19: SHĐ HẠ → `TripPlan.shdHa`
- Col 20: PHÍ VỆ SINH → `TripPlan.phiVeSinhAmount`, `phiVeSinhName = "PHÍ VỆ SINH"`
- Col 21: SHĐ → `TripPlan.shdVeSinh`
- Col 22: PHÍ CƯỢC → `TripPlan.phiCuocAmount`, `phiCuocName = "PHÍ CƯỢC"`
- Col 23: VÉ CỔNG → `TripPlan.veCongAmount`, `veCongName = "VÉ CỔNG"`
- Col 24: SHĐ → `TripPlan.shdVeCong`
- Col 25: CHI PHÍ KHÁC / PHÍ ĐỨT TEM → `TripPlan.chiPhiKhacAmount`, `chiPhiKhacName = "PHÍ ĐỨT TEM"`
- Col 26: CHI PHÍ TRÁI TUYẾN / CHỈ ĐỊNH / BP CAM → `TripPlan.chiPhiTraiTuyenAmount`, `chiPhiTraiTuyenName = "CHI PHÍ TRÁI TUYẾN"`
- Col 27: CẦU ĐƯỜNG → `TripPlan.cauDuongAmount`, `cauDuongName = "CẦU ĐƯỜNG"`
- Col 28: NGÀY GỬI CT → `documentSentDate`
- Col 29: CHI PHÍ PHÁT SINH KHÁC: THANH LÝ - CHI HỘ → `costName: "CHI PHÍ PHÁT SINH KHÁC"`, amount (TripPlanCost row)
- Col 30: NỘI DUNG → `description`
- Col 31: GHI CHÚ → `notes`

#### Scenario: Valid upload returns import summary

- **WHEN** an admin uploads a valid "kế hoạch xe" Excel file
- **THEN** the API returns HTTP 200 with `{ imported: N, warnings: [...], errors: [...] }` where `imported` counts TripPlan rows inserted

#### Scenario: serviceType is parsed from LOẠI HÌNH column

- **WHEN** a row has LOẠI HÌNH = "SEA - EX"
- **THEN** the created TripPlan has `serviceType = "SEA_EXPORT"`

#### Scenario: serviceType defaults when LOẠI HÌNH is unrecognized

- **WHEN** a row has an unrecognized LOẠI HÌNH value
- **THEN** a warning is added and the row is imported with `serviceType = "SEA_EXPORT"` as default

#### Scenario: containerSize is parsed from SIZE CONT column

- **WHEN** a row has SIZE CONT = "40HC"
- **THEN** the created TripPlan has `containerSize = "40HC"`

#### Scenario: description is parsed from NỘI DUNG column

- **WHEN** a row has NỘI DUNG = "Hàng đặc biệt"
- **THEN** the created TripPlan has `description = "Hàng đặc biệt"`

#### Scenario: Fixed cost column updates the matching TripPlan scalar field

- **WHEN** an admin re-imports a previously exported file for an existing trip plan (row has an `id`) with PHÍ NÂNG changed to 750000 and SHĐ NÂNG = "HD002"
- **THEN** that TripPlan's `phiNangAmount` is updated to 750000 and `shdNang` is updated to "HD002", and no `TripPlanCost` row is created for "PHÍ NÂNG"

#### Scenario: CHI PHÍ PHÁT SINH KHÁC still creates a TripPlanCost row

- **WHEN** an admin uploads a file with CHI PHÍ PHÁT SINH KHÁC = 200000 for a row
- **THEN** a `TripPlanCost` row is created with `costName = "CHI PHÍ PHÁT SINH KHÁC"` and `amount = 200000`, and any prior "other cost" rows for that TripPlan are replaced

#### Scenario: No "Chi phí mới tự tạo" warnings in import result

- **WHEN** an admin imports a file with cost column values
- **THEN** the `warnings` array does NOT contain any "Chi phí mới tự tạo" messages

#### Scenario: Zero or blank cost columns are skipped

- **WHEN** a row has an empty or zero value in a cost column
- **THEN** the corresponding TripPlan scalar field (or TripPlanCost row, for CHI PHÍ PHÁT SINH KHÁC) is left null/absent

#### Scenario: TripPlanCost rows have no tripCostId

- **WHEN** the import creates a TripPlanCost row for CHI PHÍ PHÁT SINH KHÁC
- **THEN** that row has `costName` set and `tripCostId` does not exist on the model (column was dropped)

#### Scenario: STT sets tripNumber on update

- **WHEN** an admin re-imports a previously exported file for an existing trip plan (row has an `id`) with STT changed from 5 to 8
- **THEN** the existing TripPlan's `tripNumber` is updated to 8

#### Scenario: STT is ignored on create; tripNumber is auto-assigned instead

- **WHEN** an admin imports a file containing a new trip plan row (no `id`) with STT = 5, and the highest existing `tripNumber` in the database is 42
- **THEN** the created TripPlan has `tripNumber = 43` (the STT value of 5 is not used)

#### Scenario: Blank STT on update does not null out tripNumber

- **WHEN** an admin re-imports a file for an existing trip plan (row has an `id`) where the STT cell is blank
- **THEN** the existing TripPlan's `tripNumber` is left unchanged (not set to null)

#### Scenario: documentSentDate is persisted on import

- **WHEN** an admin imports a file with NGÀY GỬI CT = "15/03/2026" for a row
- **THEN** the resulting TripPlan has `documentSentDate` set to 2026-03-15, on both create and update

#### Scenario: Changed record is reported and audit-logged

- **WHEN** an admin re-imports a file for an existing trip plan (row has an `id`) with PHÍ NÂNG changed from 500000 to 750000
- **THEN** the response's `changedRecords` array contains an entry for that row listing `{ field: "phiNangAmount", oldValue: 500000, newValue: 750000 }`
- **THEN** an Audit Log entry is created with `entityType: "TripPlan"`, `entityId` equal to the row's id, `beforeSnapshot.phiNangAmount = 500000`, and `afterSnapshot.phiNangAmount = 750000`

#### Scenario: Unchanged record produces no changedRecords entry or audit log

- **WHEN** an admin re-imports a previously exported file without editing any cell for an existing trip plan (row has an `id`)
- **THEN** the response's `changedRecords` array does NOT contain an entry for that row
- **THEN** no Audit Log entry is created for that TripPlan as part of this import

#### Scenario: New record is not included in changedRecords

- **WHEN** an admin imports a file containing a new trip plan row (no `id`)
- **THEN** the response's `changedRecords` array does NOT contain an entry for that row (it is counted in `imported`, not `changedRecords`)

#### Scenario: Non-admin role is rejected

- **WHEN** a user without ADMIN role uploads a file to `POST /api/v1/import/trip-plans`
- **THEN** the API returns HTTP 403

#### Scenario: Import UI displays changed records after upload

- **WHEN** an admin uploads a "kế hoạch xe" file via the import-export page and the response includes a non-empty `changedRecords` array
- **THEN** the import result panel displays a "X bản ghi đã thay đổi (bấm để xem)" section, collapsible like the existing warnings/errors sections, listing each changed row's identifier and its changed fields with old/new values
- **THEN** when `changedRecords` is empty or absent, this section is not rendered

## REMOVED Requirements

### Requirement: Container size is normalized from Excel strings to Prisma enum

**Reason**: Container size is now stored as a plain string on TripPlan (`containerSize` field). No enum or normalization is needed.
**Migration**: Read SIZE CONT column (col 7) as a plain string and assign to `TripPlan.containerSize`.

### Requirement: TripCost catalog item auto-created if not found during import

**Reason**: The TripCost catalog no longer exists. Cost names are stored directly on TripPlanCost rows (for CHI PHÍ PHÁT SINH KHÁC) or on TripPlan fixed-slot fields (for the 8 fixed cost columns).
**Migration**: Remove any `tripCost.findFirst` / `tripCost.create` logic; use `costName` directly on TripPlanCost creation for CHI PHÍ PHÁT SINH KHÁC, and write to the corresponding `TripPlan` scalar field for the 8 fixed cost columns.
