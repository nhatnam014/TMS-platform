## MODIFIED Requirements

### Requirement: Admin can bulk-import vehicle records from Excel

The system SHALL provide `POST /api/v1/import/vehicles` that accepts a multipart/form-data request with a field named `file` containing an `.xlsx` file.

The endpoint operates in two modes controlled by the `?confirm=true` query parameter:

**Preview mode** (default, no `?confirm=true`): Parse the file and return a conflict analysis WITHOUT writing any data. Response: `{ toCreate: number, conflicts: ConflictEntry[], errors: string[] }`. HTTP 200.

**Execute mode** (`?confirm=true`): Parse and execute: driver findOrCreate, vehicle upserts for conflicts, VehicleRecord/VehicleRecordMooc creation, and updates to existing VehicleRecord/VehicleRecordMooc rows when the row carries an existing `id`. Response: `{ imported: number, updated: number, warnings: string[], errors: string[], changedRecords?: ImportChangedRecord[] }`. HTTP 200. `changedRecords` is present only when at least one updated row actually changed a field; it is omitted (or empty) when every updated row was a no-op re-import.

In both modes the endpoint MUST be restricted to users with role ADMIN. File size limit of 5 MB applies to both modes.

#### Scenario: Preview returns conflict list without writing data

- **WHEN** an admin uploads a file containing a bienSo that already exists in the Vehicle table with differing field values (no `?confirm=true`)
- **THEN** the API returns HTTP 200 with `{ toCreate: N, conflicts: [...], errors: [] }` and no rows are created or modified in any table

#### Scenario: Preview with no conflicts returns empty conflicts array

- **WHEN** the uploaded file contains only bienSo values absent from the Vehicle table and no `?confirm=true`
- **THEN** the API returns HTTP 200 with `{ toCreate: N, conflicts: [], errors: [] }`

#### Scenario: Execute mode creates all records and updates conflicting vehicles

- **WHEN** an admin uploads the file with `?confirm=true`
- **THEN** drivers are upserted by (fullName, phone), conflicting vehicles are updated, VehicleRecord and VehicleRecordMooc rows are created; the API returns `{ imported: N, updated: M, warnings: [], errors: [] }`

#### Scenario: Non-admin role is rejected

- **WHEN** a user without ADMIN role uploads a file
- **THEN** the API returns HTTP 403

#### Scenario: File size exceeds 5 MB limit

- **WHEN** an admin uploads a file larger than 5 MB
- **THEN** the API returns HTTP 413 and does not process any rows

## ADDED Requirements

### Requirement: Vehicle record updates are diffed and reported per record

When `importVehicles` executes an update against an existing `VehicleRecord` (a row carrying a known `id`), the system SHALL compare the record's current field values against the incoming values for `tenTaiXe`, `sdt`, `loaiXe`, `bienSo`, `hanDangKiem`, `hanBaoHiem`, `hanCaVet`, and `ghiChu` BEFORE writing the update. If one or more fields differ, the system SHALL write an Audit Log entry for that record (`action: "UPDATE"`, `entityType: "VehicleRecord"`, `entityId` set to the record's id, `beforeSnapshot`/`afterSnapshot` containing only the changed fields) and SHALL append one entry to the response's `changedRecords` array containing the row number, an identifier (e.g. license plate or driver name), the record's id, and the list of changed fields (`{ field, oldValue, newValue }`). Newly-created VehicleRecord rows (no prior `id`) are never included in `changedRecords`. A re-imported row whose values are identical to the existing record produces no Audit Log entry and no `changedRecords` entry for that row.

#### Scenario: Updating a vehicle record's hanDangKiem produces a changed-record entry

- **WHEN** an admin re-imports a file where an existing VehicleRecord's `hanDangKiem` cell now differs from the stored value, with `?confirm=true`
- **THEN** the record is updated, an Audit Log entry is written with the old and new `hanDangKiem` values, and the response's `changedRecords` includes one entry for that row listing `{ field: "hanDangKiem", oldValue, newValue }`

#### Scenario: Re-importing an unmodified vehicle record produces no changed-record entry

- **WHEN** an admin re-imports a file where an existing VehicleRecord's fields are unchanged from the stored values, with `?confirm=true`
- **THEN** the record is updated in place with identical values, no Audit Log entry is written for that record, and no `changedRecords` entry is added for that row

#### Scenario: Newly created vehicle record is excluded from changedRecords

- **WHEN** an admin imports a row with no existing `id`, creating a new VehicleRecord, with `?confirm=true`
- **THEN** the row is counted in `imported`, and no `changedRecords` entry is created for it regardless of the values it was created with

### Requirement: Mooc field changes are merged into the parent vehicle record's changed-record entry

When `importVehicles` updates an existing `VehicleRecordMooc` (matched by `vehicleRecordId` and `soMooc`), the system SHALL diff its `hanDangKiem`, `hanBaoHiem`, and `hanCaVet` fields against their stored values BEFORE writing. Any changed mooc field SHALL be reported using the field name `mooc[<soMooc>].hanDangKiem` (or `.hanBaoHiem` / `.hanCaVet`) and SHALL be appended to the SAME `changedRecords` entry (and the same Audit Log entry's snapshots) as the mooc's parent `VehicleRecord` — not as a separate `changedRecords` entry. Creating a new mooc (no prior matching `(vehicleRecordId, soMooc)`) is never included in the diff.

#### Scenario: Updating a mooc's hanBaoHiem is reported under the parent record

- **WHEN** an admin re-imports a row whose vehicle record is unchanged but whose mooc's `hanBaoHiem` cell now differs from the stored value, with `?confirm=true`
- **THEN** the parent VehicleRecord's `changedRecords` entry for that row includes `{ field: "mooc[<soMooc>].hanBaoHiem", oldValue, newValue }`, and no separate `changedRecords` entry is created for the mooc itself

#### Scenario: Vehicle record and its mooc both change in the same row

- **WHEN** an admin re-imports a row where both the vehicle record's `bienSo` and its mooc's `hanDangKiem` differ from stored values, with `?confirm=true`
- **THEN** exactly one `changedRecords` entry is produced for that row, containing both `{ field: "bienSo", ... }` and `{ field: "mooc[<soMooc>].hanDangKiem", ... }`

### Requirement: Import UI displays changed records via a popup table

When the import-export page receives an `importVehicles` response with a non-empty `changedRecords` array, the system SHALL render a clickable summary line (e.g. "X bản ghi đã thay đổi (bấm để xem)") that, when clicked, opens a modal popup containing a table with one row per changed record. Each table row SHALL show the record's identifier and a single cell listing all of that record's changed fields (`field: oldValue → newValue`, one per line, including any `mooc[<soMooc>].*` entries). The popup SHALL be dismissible via a close control. When `changedRecords` is empty or absent, no summary line or popup is rendered. This same popup component SHALL be reused by the `importVehicleMaintenance` import UI.

#### Scenario: Clicking the summary line opens the popup

- **WHEN** an admin uploads a "quản lý xe" file via the import-export page and the response includes a non-empty `changedRecords` array, then clicks the "X bản ghi đã thay đổi" summary line
- **THEN** a modal popup opens showing a table with one row per changed record, each listing its identifier and changed fields (including mooc fields, if any) with old/new values

#### Scenario: No summary line when nothing changed

- **WHEN** an admin uploads a "quản lý xe" file via the import-export page and the response's `changedRecords` is empty or absent
- **THEN** no changed-records summary line or popup is rendered
