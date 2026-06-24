## MODIFIED Requirements

### Requirement: Create vehicle record

The system SHALL create a new vehicle record with optional driver info, vehicle info, compliance dates, notes, zero or more moocs, and maintenance-related fields (`donViSuaChua`, `ngayLam`, `kmHienTai`, `ghiChuBaoDuong`) in a single request. All maintenance-related fields default to `null` if omitted.

#### Scenario: Create with all fields

- **WHEN** a POST request is made to `/api/vehicle-records` with a body containing `tenTaiXe`, `sdt`, `loaiXe`, `bienSo`, all date fields, `ghiChu`, `kmHienTai`, `ghiChuBaoDuong`, and a non-empty `moocs` array
- **THEN** the system creates the record and all mooc rows, returns the full record with `id`, `kmHienTai`, `ghiChuBaoDuong`, and nested `moocs`, and produces an audit log entry with action `CREATE`

#### Scenario: Create with minimal fields (all nullable)

- **WHEN** a POST request is made with an empty body `{}`
- **THEN** the system creates a record with all nullable fields, including `kmHienTai` and `ghiChuBaoDuong`, set to `null`, and `moocs` as an empty array

#### Scenario: Create with moocs but no vehicle plate

- **WHEN** a POST request body contains `moocs` entries but omits `bienSo`
- **THEN** the record is created successfully with `bienSo: null` and moocs persisted

---

### Requirement: Update vehicle record

The system SHALL update a vehicle record's fields, including `kmHienTai` and `ghiChuBaoDuong`, and fully replace its moocs list in a single PATCH request.

#### Scenario: Update vehicle-level fields

- **WHEN** a PATCH request is made to `/api/vehicle-records/:id` with changed `tenTaiXe` and `loaiXe`
- **THEN** those fields are updated on the record; other fields remain unchanged; an audit log entry with action `UPDATE` is produced

#### Scenario: Update kmHienTai and ghiChuBaoDuong independently of ghiChu

- **WHEN** a PATCH request is made to `/api/vehicle-records/:id` with `{kmHienTai: "320.000 km", ghiChuBaoDuong: "Cần kiểm tra phanh"}`
- **THEN** `kmHienTai` and `ghiChuBaoDuong` are updated on the record; the existing `ghiChu` value is left unchanged

#### Scenario: Replace moocs on update

- **WHEN** a PATCH request includes a `moocs` array (even empty)
- **THEN** all previously existing moocs for that record are deleted and the new moocs array is inserted; the response reflects the new mooc list

#### Scenario: Update non-existent record

- **WHEN** a PATCH request is made to `/api/vehicle-records/:id` where the id does not exist
- **THEN** the system responds with HTTP 404

---

### Requirement: List vehicle records

The system SHALL return all vehicle records ordered by creation date ascending, each including its full list of associated moocs and all maintenance-related fields (`kmHienTai`, `ghiChuBaoDuong`). Ascending order ensures that records imported from an Excel file appear in the same top-to-bottom sequence as their source rows.

#### Scenario: List returns records with moocs

- **WHEN** a GET request is made to `/api/vehicle-records`
- **THEN** the response is a JSON array where each item contains vehicle-level fields, `kmHienTai`, `ghiChuBaoDuong`, and a `moocs` array (possibly empty)

#### Scenario: List returns empty array when no records exist

- **WHEN** a GET request is made to `/api/vehicle-records` and no records have been created
- **THEN** the response is an empty JSON array `[]`

#### Scenario: List order matches Excel import order

- **WHEN** N records are imported from an Excel file whose rows run from top to bottom in order 1..N
- **THEN** the list endpoint returns those records in the same order (index 0 = first Excel row, index N-1 = last Excel row)

---

### Requirement: Vehicle record data model

The system SHALL store vehicle record data in two tables with the following fields.

`VehicleRecord`:

- `id` — CUID, primary key
- `tenTaiXe` — String, nullable (driver full name)
- `sdt` — String, nullable (driver phone)
- `loaiXe` — String, nullable (vehicle type, free text)
- `bienSo` — String, nullable (license plate)
- `hanDangKiem` — DateTime, nullable (vehicle inspection expiry)
- `hanBaoHiem` — DateTime, nullable (vehicle insurance expiry)
- `hanCaVet` — DateTime, nullable (vehicle registration expiry)
- `ghiChu` — String, nullable (general notes, used by the quản lý xe page)
- `kmHienTai` — String, nullable (current odometer reading, free text e.g. "320.000 km"; used by the bảo dưỡng xe page)
- `ghiChuBaoDuong` — String, nullable (maintenance-specific notes, distinct from `ghiChu`; used by the bảo dưỡng xe page)
- `createdAt`, `updatedAt` — timestamps

`VehicleRecordMooc`:

- `id` — CUID, primary key
- `vehicleRecordId` — FK to `VehicleRecord`, cascades on delete
- `soMooc` — String (mooc number)
- `hanDangKiem` — DateTime, nullable
- `hanBaoHiem` — DateTime, nullable
- `hanCaVet` — DateTime, nullable

#### Scenario: Record fields are all nullable

- **WHEN** a record is created with no body fields
- **THEN** all nullable fields, including `kmHienTai` and `ghiChuBaoDuong`, are stored as `null` and no validation error is raised

#### Scenario: Mooc cascade delete

- **WHEN** a `VehicleRecord` is deleted
- **THEN** all associated `VehicleRecordMooc` rows are also deleted

#### Scenario: kmHienTai and ghiChuBaoDuong are independent of ghiChu

- **WHEN** a record has `ghiChu = "Xe mới mua"` and is updated to set `ghiChuBaoDuong = "Đã thay nhớt"`
- **THEN** `ghiChu` remains `"Xe mới mua"` and `ghiChuBaoDuong` is `"Đã thay nhớt"` — the two fields never overwrite each other
