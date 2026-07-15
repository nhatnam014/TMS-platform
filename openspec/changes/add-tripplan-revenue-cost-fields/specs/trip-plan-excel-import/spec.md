## MODIFIED Requirements

### Requirement: Admin can bulk-import trip plans from Excel

The system SHALL provide `POST /api/v1/import/trip-plans` that accepts a multipart/form-data request with a field named `file` containing an `.xlsx` file. The endpoint MUST parse the "kế hoạch xe" sheet by matching column header text (not fixed column position), insert or update `TripPlan` records, auto-create missing reference entities (Customer, Carrier, Location, Vehicle), and return an `ImportResult` with HTTP 200. The endpoint SHALL be restricted to users with role ADMIN.

The parser MUST locate the 7 new columns — LƯƠNG, CƯỚC, DOANH THU, PHỤ THU, CHI PHÍ, TIỀN DẦU, NEO XE — by header text, regardless of their exact position in the sheet (tolerating a user-reordered file), and map each directly onto the corresponding `TripPlan` scalar field:

- LƯƠNG → `luongAmount`
- CƯỚC → `cuocAmount`
- DOANH THU → `doanhThuAmount`
- PHỤ THU → `phuThuAmount`
- CHI PHÍ → `chiPhiAmount`
- TIỀN DẦU → `tienDauAmount`
- NEO XE → `neoXeAmount`

These 7 columns MUST NOT create `TripPlanCost` rows and MUST NOT be confused with the existing `CHI PHÍ KHÁC/PHÍ ĐỨT TEM`, `CHI PHÍ TRÁI TUYẾN/CHỈ ĐỊNH/BP CAM`, or `CHI PHÍ PHÁT SINH KHÁC` columns — header-text matching resolves each by its exact full header string, so `"CHI PHÍ"` only matches a column whose header cell is exactly "CHI PHÍ" (case/diacritic-insensitive), not a substring of a longer header.

On CREATE, each of the 7 fields is written from the parsed value (or omitted/`null` if the column is blank for that row). On UPDATE, each of the 7 fields is written the same way and is included in the existing changed-record diff: if an existing trip plan's value for one of these fields differs from the imported value, the change is recorded in the import result's `changedRecords` and in an Audit Log entry, consistent with how the 8 existing fixed cost slots are diffed.

#### Scenario: New columns are parsed by header text regardless of position

- **WHEN** an admin uploads a "kế hoạch xe" file where the LƯƠNG and CƯỚC columns have been manually reordered relative to the standard template
- **THEN** the values are still correctly assigned to `luongAmount` and `cuocAmount` on the created/updated TripPlan

#### Scenario: New fields are persisted on create

- **WHEN** an admin uploads a file with a new row where DOANH THU = 15000000 and PHỤ THU = 500000
- **THEN** the created TripPlan has `doanhThuAmount = 15000000` and `phuThuAmount = 500000`

#### Scenario: Re-importing an edited file updates an existing trip plan's new fields

- **WHEN** an admin re-imports a previously exported file with an existing row's TIỀN DẦU value changed from 1000000 to 1200000, with that row's `id` cell intact
- **THEN** the matching TripPlan's `tienDauAmount` is updated to 1200000, the import result's `changedRecords` includes an entry for `tienDauAmount` (old value 1000000, new value 1200000), and a matching Audit Log entry is created

#### Scenario: Blank new-field cell does not overwrite an existing value on update

- **WHEN** an admin re-imports a file where an existing row's NEO XE cell is blank but the TripPlan currently has `neoXeAmount = 500000`
- **THEN** `neoXeAmount` remains `500000` (the blank cell is treated as "not provided", not as an explicit clear), consistent with how the 8 existing fixed cost slots handle blank cells on update

#### Scenario: Missing new column produces a warning, not a silent misread

- **WHEN** an admin uploads a file where the CHI PHÍ column header has been renamed or removed
- **THEN** the import result's `warnings` includes an entry noting the "CHI PHÍ" column was not found, and `chiPhiAmount` is left unset for every row in that import
