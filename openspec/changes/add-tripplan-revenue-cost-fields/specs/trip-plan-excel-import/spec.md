## MODIFIED Requirements

### Requirement: Admin can bulk-import trip plans from Excel

The system SHALL provide `POST /api/v1/import/trip-plans` that accepts a multipart/form-data request with a field named `file` containing an `.xlsx` file. The endpoint MUST parse the "kế hoạch xe" sheet by matching column header text (not fixed column position), insert or update `TripPlan` records, auto-create missing reference entities (Customer, Carrier, Location, Vehicle), and return an `ImportResult` with HTTP 200. The endpoint SHALL be restricted to users with role ADMIN.

The parser MUST locate the 7 amount columns — LƯƠNG, CƯỚC, DOANH THU, PHỤ THU, CHI PHÍ, TIỀN DẦU, NEO XE — and their 7 SHĐ columns — SHĐ LƯƠNG, SHĐ CƯỚC, SHĐ DOANH THU, SHĐ PHỤ THU, SHĐ CHI PHÍ, SHĐ TIỀN DẦU, SHĐ NEO XE — by header text, regardless of their exact position in the sheet (tolerating a user-reordered file), and map each directly onto the corresponding `TripPlan` scalar field:

- LƯƠNG → `luongAmount`, SHĐ LƯƠNG → `shdLuong`
- CƯỚC → `cuocAmount`, SHĐ CƯỚC → `shdCuoc`
- DOANH THU → `doanhThuAmount`, SHĐ DOANH THU → `shdDoanhThu`
- PHỤ THU → `phuThuAmount`, SHĐ PHỤ THU → `shdPhuThu`
- CHI PHÍ → `chiPhiAmount`, SHĐ CHI PHÍ → `shdChiPhi`
- TIỀN DẦU → `tienDauAmount`, SHĐ TIỀN DẦU → `shdTienDau`
- NEO XE → `neoXeAmount`, SHĐ NEO XE → `shdNeoXe`

These columns MUST NOT create `TripPlanCost` rows and MUST NOT be confused with the existing `CHI PHÍ KHÁC/PHÍ ĐỨT TEM`, `CHI PHÍ TRÁI TUYẾN/CHỈ ĐỊNH/BP CAM`, `CHI PHÍ PHÁT SINH KHÁC`, or the two bare `"SHĐ"` columns — header-text matching resolves each by its exact full header string (e.g. "SHĐ LƯƠNG" is a distinct string from the bare "SHĐ" columns), so no column is misread.

The parser MUST also locate the TRẠNG THÁI column by header text and map its cell value onto `TripPlan.status`, by reverse-looking-up the Vietnamese label (via the shared `TRIP_STATUS_LABELS` map) back to the `TripStatus` enum, tolerant of accent/case variation (same normalization already used for header-text matching). If the cell text does not match any known status label, the field is left unset for that row and a warning is added noting the row and the unrecognized text.

`status` from the TRẠNG THÁI column is applied on UPDATE only (re-importing an existing row, matched by its `id` cell). On CREATE, a parsed status value is ignored and the new TripPlan is created with the default status (`PLANNED`), consistent with `CreateTripPlanDto` intentionally having no `status` field.

On CREATE, each of the 7 amount and 7 SHĐ fields is written from the parsed value (or omitted/`null` if the column is blank for that row). On UPDATE, each of these 14 fields (and `status`, per the rule above) is written the same way and is included in the existing changed-record diff: if an existing trip plan's value differs from the imported value, the change is recorded in the import result's `changedRecords` and in an Audit Log entry, consistent with how the 8 existing fixed cost slots are diffed. The `*Name` fields are DB/form-only and are NOT read from any column.

#### Scenario: New columns are parsed by header text regardless of position

- **WHEN** an admin uploads a "kế hoạch xe" file where the LƯƠNG and CƯỚC columns have been manually reordered relative to the standard template
- **THEN** the values are still correctly assigned to `luongAmount` and `cuocAmount` on the created/updated TripPlan

#### Scenario: New amount and SHĐ fields are persisted on create

- **WHEN** an admin uploads a file with a new row where DOANH THU = 15000000, SHĐ DOANH THU = "HD-050", and PHỤ THU = 500000
- **THEN** the created TripPlan has `doanhThuAmount = 15000000`, `shdDoanhThu = "HD-050"`, and `phuThuAmount = 500000`, and `status = "PLANNED"` regardless of the file's TRẠNG THÁI cell for that row

#### Scenario: Re-importing an edited file updates an existing trip plan's amount, SHĐ, and status fields

- **WHEN** an admin re-imports a previously exported file with an existing row's TIỀN DẦU value changed from 1000000 to 1200000, its SHĐ TIỀN DẦU changed from blank to "HD-099", and its TRẠNG THÁI changed from "Kế hoạch" to "Hoàn thành", with that row's `id` cell intact
- **THEN** the matching TripPlan's `tienDauAmount` is updated to 1200000, `shdTienDau` is updated to "HD-099", `status` is updated to `COMPLETED`, the import result's `changedRecords` includes entries for all three fields, and a matching Audit Log entry is created

#### Scenario: Unrecognized status text produces a per-row warning and leaves status unchanged

- **WHEN** an admin re-imports a file where an existing row's TRẠNG THÁI cell contains a value that doesn't match any known status label (e.g. a typo)
- **THEN** the import result's `warnings` includes an entry for that row noting the unrecognized status text, and the TripPlan's `status` is left unchanged

#### Scenario: Blank new-field cell does not overwrite an existing value on update

- **WHEN** an admin re-imports a file where an existing row's NEO XE cell is blank but the TripPlan currently has `neoXeAmount = 500000`
- **THEN** `neoXeAmount` remains `500000` (the blank cell is treated as "not provided", not as an explicit clear), consistent with how the 8 existing fixed cost slots handle blank cells on update

#### Scenario: Missing new column produces a warning, not a silent misread

- **WHEN** an admin uploads a file where the CHI PHÍ column header has been renamed or removed
- **THEN** the import result's `warnings` includes an entry noting the "CHI PHÍ" column was not found, and `chiPhiAmount` is left unset for every row in that import
