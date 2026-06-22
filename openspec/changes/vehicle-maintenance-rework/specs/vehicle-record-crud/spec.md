## MODIFIED Requirements

### Requirement: Create vehicle record

The system SHALL create a new vehicle record with optional driver info, vehicle info, compliance dates, notes, zero or more moocs, and two new optional maintenance fields (`donViSuaChua`, `ngayLam`) in a single request. The `donViSuaChua` and `ngayLam` fields default to `null` if omitted.

#### Scenario: Create with all fields including maintenance fields

- **WHEN** a POST request is made to `/api/vehicle-records` with a body containing `tenTaiXe`, `sdt`, `loaiXe`, `bienSo`, all date fields, `ghiChu`, `donViSuaChua`, `ngayLam`, and a non-empty `moocs` array
- **THEN** the system creates the record with all fields, returns the full record with `id`, `donViSuaChua`, `ngayLam`, and nested `moocs`, and produces an audit log entry with action `CREATE`

#### Scenario: Create with minimal fields defaults maintenance to null

- **WHEN** a POST request is made with an empty body `{}`
- **THEN** the system creates a record with `donViSuaChua: null` and `ngayLam: null` along with all other nullable fields null

#### Scenario: Create with moocs but no vehicle plate

- **WHEN** a POST request body contains `moocs` entries but omits `bienSo`
- **THEN** the record is created successfully with `bienSo: null` and moocs persisted

---

### Requirement: Update vehicle record

The system SHALL update a vehicle record's fields, including `donViSuaChua` and `ngayLam`, and fully replace its moocs list in a single PATCH request.

#### Scenario: Update vehicle-level fields

- **WHEN** a PATCH request is made to `/api/vehicle-records/:id` with changed `tenTaiXe` and `loaiXe`
- **THEN** those fields are updated on the record; other fields remain unchanged; an audit log entry with action `UPDATE` is produced

#### Scenario: Update donViSuaChua via vehicle record PATCH

- **WHEN** a PATCH request is made to `/api/vehicle-records/:id` with `{donViSuaChua: "Gara XYZ"}`
- **THEN** `donViSuaChua` is updated on the record; all other fields remain unchanged

#### Scenario: Replace moocs on update

- **WHEN** a PATCH request includes a `moocs` array (even empty)
- **THEN** all previously existing moocs for that record are deleted and the new moocs array is inserted; the response reflects the new mooc list

#### Scenario: Update non-existent record

- **WHEN** a PATCH request is made to `/api/vehicle-records/:id` where the id does not exist
- **THEN** the system responds with HTTP 404

---

### Requirement: List vehicle records

The system SHALL return all vehicle records ordered by creation date ascending, each including its full list of associated moocs, `donViSuaChua`, and `ngayLam`. Ascending order ensures that records imported from an Excel file appear in the same top-to-bottom sequence as their source rows.

#### Scenario: List returns records with moocs and maintenance fields

- **WHEN** a GET request is made to `/api/vehicle-records`
- **THEN** the response is a paginated result where each item contains vehicle-level fields, `donViSuaChua`, `ngayLam`, and a `moocs` array (possibly empty)

#### Scenario: List returns empty array when no records exist

- **WHEN** a GET request is made to `/api/vehicle-records` and no records have been created
- **THEN** the response is an empty JSON array `[]`
