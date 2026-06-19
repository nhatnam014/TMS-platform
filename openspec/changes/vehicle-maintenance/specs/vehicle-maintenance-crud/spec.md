## ADDED Requirements

### Requirement: List vehicle maintenance records with pagination and search

The system SHALL provide `GET /api/vehicle-maintenance` returning a paginated list of maintenance
records ordered by `ngayLam` descending (most recent first). Each record SHALL include computed
fields `kmDaChay` and `kmCon` derived from stored km values. Supports optional query params:
`page`, `limit`, `search` (matches `bienSo` or `tenTaiXe`), `loaiXe` (exact filter on col F
"ĐƠN VỊ SỬA CHỮA / LOẠI XE" — the vehicle brand used for sheet grouping).

#### Scenario: List returns paginated records

- **WHEN** a GET request is made to `/api/vehicle-maintenance?page=1&limit=10`
- **THEN** the response is `{ data: [...], meta: { total, page, limit, totalPages } }` ordered by ngayLam descending

#### Scenario: Search by bienSo

- **WHEN** a GET request is made to `/api/vehicle-maintenance?search=50E-54057`
- **THEN** only records where `bienSo` contains "50E-54057" are returned

#### Scenario: Filter by loaiXe

- **WHEN** a GET request is made to `/api/vehicle-maintenance?loaiXe=CHENGLONG`
- **THEN** only records with `loaiXe = "CHENGLONG"` (col F value) are returned

#### Scenario: Empty list when no records exist

- **WHEN** a GET request is made and no maintenance records have been created
- **THEN** the response is `{ data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0 } }`

---

### Requirement: Get distinct loaiXe values

The system SHALL provide `GET /api/vehicle-maintenance/distinct-units` returning an array of
distinct `loaiXe` string values (col F — "ĐƠN VỊ SỬA CHỮA / LOẠI XE") currently present in the
database, sorted alphabetically. This is used by the export UI to populate the unit selector
and by the filter bar on the maintenance page.

#### Scenario: Returns distinct loaiXe values

- **WHEN** records with loaiXe "CHENGLONG", "CHENGLONG", "SHACMAN" exist
- **THEN** the response is `["CHENGLONG", "SHACMAN"]`

#### Scenario: Returns empty array when no records

- **WHEN** no maintenance records exist
- **THEN** the response is `[]`

---

### Requirement: Create vehicle maintenance record

The system SHALL provide `POST /api/vehicle-maintenance` accepting a body with maintenance fields.
`vehicleRecordId` is optional; if omitted, the system attempts to auto-match by `bienSo` against
`VehicleRecord.bienSo`. The system SHALL produce an audit log entry on success.

#### Scenario: Create with full fields

- **WHEN** a POST request is made with `bienSo`, `tenTaiXe`, `sdt`, `loaiXe` (col F), `donViSuaChua` (col G), `ngayLam`, `soKmBaoDuong`, `kiBaoDuongTiepTheo`, `soKmHienTai`
- **THEN** the system creates the record, returns it with an `id`, and logs a CREATE audit entry

#### Scenario: Create auto-links to VehicleRecord when bienSo matches

- **WHEN** a POST request includes `bienSo` that matches an existing `VehicleRecord.bienSo`
- **THEN** the created record has `vehicleRecordId` set to that VehicleRecord's id

#### Scenario: Create succeeds even when bienSo has no matching VehicleRecord

- **WHEN** a POST request includes a `bienSo` not present in `vehicle_records`
- **THEN** the record is created with `vehicleRecordId: null` and no error is raised

---

### Requirement: Update vehicle maintenance record

The system SHALL provide `PATCH /api/vehicle-maintenance/:id` to update any fields of a maintenance
record. The system SHALL produce an audit log entry on success.

#### Scenario: Update soKmHienTai

- **WHEN** a PATCH request is made with `{ soKmHienTai: 52000 }`
- **THEN** the field is updated; other fields remain unchanged; an UPDATE audit entry is logged

#### Scenario: Update non-existent record returns 404

- **WHEN** a PATCH request is made with an id that does not exist
- **THEN** the system responds with HTTP 404

---

### Requirement: Delete vehicle maintenance record

The system SHALL provide `DELETE /api/vehicle-maintenance/:id`. The system SHALL produce an audit
log entry on success.

#### Scenario: Delete existing record

- **WHEN** a DELETE request is made with a valid id
- **THEN** the record is removed; the system responds with HTTP 200; a DELETE audit entry is logged

#### Scenario: Delete non-existent record returns 404

- **WHEN** a DELETE request is made with an id that does not exist
- **THEN** the system responds with HTTP 404

---

### Requirement: Vehicle maintenance CRUD page

The system SHALL provide a page at `/vehicle-maintenance` with a paginated, searchable table of
maintenance records and controls to create, edit, and delete records via modal forms. The page
SHALL be accessible to all authenticated users (ADMIN and OPERATOR). The navigation sidebar SHALL
show "Bảo dưỡng xe" immediately below "Quản lý xe".

#### Scenario: Table displays computed km fields

- **WHEN** the maintenance page loads
- **THEN** each row shows `kmDaChay` (= soKmHienTai − soKmBaoDuong) and `kmCon` (= kiBaoDuongTiepTheo − soKmHienTai); `kmCon` is displayed in red when ≤ 0

#### Scenario: Create modal opens and submits

- **WHEN** the user clicks "+ Thêm bảo dưỡng" and fills in the form
- **THEN** a POST request is made; on success the modal closes and the table refreshes

#### Scenario: Edit modal pre-fills existing values

- **WHEN** the user opens the edit action for a record
- **THEN** the modal form is pre-filled with the record's current field values

#### Scenario: Delete prompts confirmation

- **WHEN** the user triggers delete for a record
- **THEN** a confirmation dialog appears; on confirm the DELETE request is made and the table refreshes
