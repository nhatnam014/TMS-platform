## MODIFIED Requirements

### Requirement: Create vehicle record

The system SHALL create a new vehicle record with optional driver info, vehicle info, compliance dates, zero or more notes, and zero or more moocs in a single request.

#### Scenario: Create with all fields

- **WHEN** a POST request is made to `/api/vehicle-records` with a body containing `tenTaiXe`, `sdt`, `loaiXe`, `bienSo`, all date fields, a non-empty `notes` array, and a non-empty `moocs` array
- **THEN** the system creates the record, all `VehicleRecordNote` rows, and all mooc rows, returns the full record with `id`, nested `notes`, and nested `moocs`, and produces an audit log entry with action `CREATE`

#### Scenario: Create with minimal fields (all nullable)

- **WHEN** a POST request is made with an empty body `{}`
- **THEN** the system creates a record with all nullable fields set to `null`, `notes` as an empty array, and `moocs` as an empty array, and returns the created record

#### Scenario: Create with moocs but no vehicle plate

- **WHEN** a POST request body contains `moocs` entries but omits `bienSo`
- **THEN** the record is created successfully with `bienSo: null` and moocs persisted

---

### Requirement: Update vehicle record

The system SHALL update a vehicle record's fields and fully replace its notes list and moocs list in a single PATCH request.

#### Scenario: Update vehicle-level fields

- **WHEN** a PATCH request is made to `/api/vehicle-records/:id` with changed `tenTaiXe` and `loaiXe`
- **THEN** those fields are updated on the record; other fields remain unchanged; an audit log entry with action `UPDATE` is produced

#### Scenario: Replace notes on update

- **WHEN** a PATCH request includes a `notes` array (even empty)
- **THEN** all previously existing `VehicleRecordNote` rows for that record are deleted and the new notes array is inserted; the response reflects the new notes list

#### Scenario: Replace moocs on update

- **WHEN** a PATCH request includes a `moocs` array (even empty)
- **THEN** all previously existing moocs for that record are deleted and the new moocs array is inserted; the response reflects the new mooc list

#### Scenario: Update non-existent record

- **WHEN** a PATCH request is made to `/api/vehicle-records/:id` where the id does not exist
- **THEN** the system responds with HTTP 404

---

### Requirement: Vehicle record data model

The system SHALL store vehicle record data in three tables with the following fields.

`VehicleRecord`:

- `id` — CUID, primary key
- `tenTaiXe` — String, nullable (driver full name)
- `sdt` — String, nullable (driver phone)
- `loaiXe` — String, nullable (vehicle type, free text)
- `bienSo` — String, nullable (license plate)
- `hanDangKiem` — DateTime, nullable (vehicle inspection expiry)
- `hanBaoHiem` — DateTime, nullable (vehicle insurance expiry)
- `hanCaVet` — DateTime, nullable (vehicle registration expiry)
- `createdAt`, `updatedAt` — timestamps

`VehicleRecordMooc`:

- `id` — CUID, primary key
- `vehicleRecordId` — FK to `VehicleRecord`, cascades on delete
- `soMooc` — String (mooc number)
- `hanDangKiem` — DateTime, nullable
- `hanBaoHiem` — DateTime, nullable
- `hanCaVet` — DateTime, nullable

`VehicleRecordNote`:

- `id` — CUID, primary key
- `vehicleRecordId` — FK to `VehicleRecord`, cascades on delete
- `content` — String (note text)
- `createdAt` — timestamp, set automatically on creation, not user-editable

#### Scenario: Record fields are all nullable

- **WHEN** a record is created with no body fields
- **THEN** all nullable fields are stored as `null` and no validation error is raised

#### Scenario: Mooc cascade delete

- **WHEN** a `VehicleRecord` is deleted
- **THEN** all associated `VehicleRecordMooc` rows are also deleted

#### Scenario: Note cascade delete

- **WHEN** a `VehicleRecord` is deleted
- **THEN** all associated `VehicleRecordNote` rows are also deleted

---

### Requirement: Web UI — vehicle records list page

The system SHALL display all vehicle records in a table at `/vehicle-records` with columns matching the Excel sheet layout.

Table columns: STT · Tên TX · SĐT · Loại xe · Biển số · Hạn ĐK (xe) · Hạn BH (xe) · Hạn CV (xe) · Số Mooc · Hạn ĐK (mooc) · Hạn BH (mooc) · Hạn CV (mooc) · Ghi chú · Actions

For records with multiple moocs, the mooc columns SHALL stack vertically (one mooc per sub-row) while the vehicle-level columns span all sub-rows.

The Ghi chú column SHALL display all of the record's `VehicleRecordNote` entries, ordered oldest first, joined for display (e.g. one line per note within the cell/column).

Dates within 30 days of expiry SHALL be highlighted with a warning indicator.

#### Scenario: Render table with multi-mooc record

- **WHEN** a record has 2 moocs
- **THEN** the table shows the vehicle-level data once and each mooc on its own line within the same record row

#### Scenario: Render record with no moocs

- **WHEN** a record has zero moocs
- **THEN** the mooc columns for that row are blank/empty

#### Scenario: Render Ghi chú column with multiple notes

- **WHEN** a record has 3 `VehicleRecordNote` entries
- **THEN** the Ghi chú column displays all 3 note contents, oldest first

#### Scenario: Render Ghi chú column with no notes

- **WHEN** a record has zero notes
- **THEN** the Ghi chú column is blank/empty (e.g. "—")

---

### Requirement: Web UI — create/edit form with dynamic mooc list

The system SHALL provide a modal form for creating and editing vehicle records. The modal SHALL be ~820px wide (capped at 95vw) and organized into three horizontal sections to minimize vertical scrolling.

**Section row 1 — two columns side by side:**

- **Tài xế** (left):
  - Searchable dropdown "Chọn tài xế" populated from `GET /api/drivers`, displaying each driver as `"{fullName} — {phone}"`
  - After a driver is selected: `tenTaiXe` and `sdt` inputs are populated from the driver and become **disabled**
  - If no driver is selected: `tenTaiXe` (text, optional) and `sdt` (text, optional) inputs are enabled for free-text entry
  - Re-selecting a driver from the dropdown overwrites the previous autofill; there is no clear/reset button

- **Thông tin xe** (right, wider):
  - Searchable dropdown "Chọn xe" populated from `GET /api/vehicles`, displaying each vehicle as `"{licensePlate} — {vehicleType}"`
  - After a vehicle is selected: `loaiXe`, `bienSo`, `hanDangKiem`, `hanBaoHiem`, `hanCaVet` inputs are populated and become **disabled**
  - If no vehicle is selected: all five inputs are enabled (loại xe text, biển số text, three date inputs optional)
  - Re-selecting a vehicle overwrites all five autofilled fields

**Section row 2 — Mooc (full width):**
Dynamic list of mooc rows. Each mooc row displays all four inputs on a single horizontal line: Số mooc (text), Hạn ĐK (date, optional), Hạn BH (date, optional), Hạn CV (date, optional), and a remove button [×]. A "+ Thêm mooc" button appears below the list to add a new blank row.

**Section row 3 — Ghi chú (full width):**
Dynamic list of note rows, visually and behaviorally identical to the mooc list: each row displays a single text input for the note's content and a remove button [×]. A "+ Thêm ghi chú" button appears below the list to add a new blank row. There is no date/timestamp input on any note row — `createdAt` is set automatically by the server.

All field names, data types, nullability rules, and form submission payload remain unchanged except `ghiChu` (removed) → `notes` (array of `{ content: string }`). The POST/PATCH body always contains the text values (`tenTaiXe`, `sdt`, `loaiXe`, `bienSo`, dates) regardless of whether they were entered manually or autofilled from a dropdown.

#### Scenario: Add mooc row

- **WHEN** user clicks "+ Thêm mooc"
- **THEN** a new blank mooc row appears with fields soMooc, hanDangKiem, hanBaoHiem, hanCaVet on a single horizontal line

#### Scenario: Remove mooc row

- **WHEN** user clicks the [×] button on a mooc row
- **THEN** that mooc row is removed from the form

#### Scenario: Save with empty mooc list

- **WHEN** user submits the form with no mooc rows
- **THEN** the record is created/updated with `moocs: []`

#### Scenario: Add note row

- **WHEN** user clicks "+ Thêm ghi chú"
- **THEN** a new blank note row appears with a single text input and a remove button

#### Scenario: Remove note row

- **WHEN** user clicks the [×] button on a note row
- **THEN** that note row is removed from the form

#### Scenario: Save with empty notes list

- **WHEN** user submits the form with no note rows
- **THEN** the record is created/updated with `notes: []`

#### Scenario: Save with multiple notes

- **WHEN** user adds 2 note rows with distinct text content and submits
- **THEN** the POST/PATCH body includes `notes: [{ content: "..." }, { content: "..." }]` in the order the rows appear in the form

#### Scenario: Edit form pre-fills existing notes

- **WHEN** the user opens the edit modal for a record with 2 existing `VehicleRecordNote` entries
- **THEN** the form shows 2 pre-filled note rows, oldest first

#### Scenario: Driver and vehicle sections are side by side

- **WHEN** the user opens the create or edit modal on a desktop viewport (≥ 820px)
- **THEN** the Tài xế and Thông tin xe sections are visible simultaneously in a single horizontal row without any horizontal scrollbar

#### Scenario: Form fits in viewport without vertical scroll for simple records

- **WHEN** the user opens the modal with zero or one mooc and zero or one note
- **THEN** the entire form is visible without vertical scrolling

#### Scenario: Driver dropdown autofills and locks tên TX + SĐT

- **WHEN** the user selects a driver from the Chọn tài xế dropdown
- **THEN** tenTaiXe and sdt inputs are populated from the driver and become disabled

#### Scenario: Vehicle dropdown autofills and locks five vehicle fields

- **WHEN** the user selects a vehicle from the Chọn xe dropdown
- **THEN** loaiXe, bienSo, hanDangKiem, hanBaoHiem, and hanCaVet inputs are populated from the vehicle and become disabled

#### Scenario: Submitting form with dropdown selections sends text values

- **WHEN** the user selects a driver and vehicle from dropdowns and submits the form
- **THEN** the API request body contains `tenTaiXe`, `sdt`, `loaiXe`, `bienSo`, and date fields as plain text/date strings — no driverId or vehicleId is sent
