## ADDED Requirements

### Requirement: Vehicle maintenance record updates are diffed and reported per record

When `importVehicleMaintenance` executes an update against an existing `VehicleRecord` (a row carrying a known `id`), the system SHALL compare the record's current field values against the incoming values for `bienSo`, `tenTaiXe`, `sdt`, `loaiXe`, `donViSuaChua`, `ngayLam`, `kmHienTai`, and `ghiChuBaoDuong` BEFORE writing the update. If one or more fields differ, the system SHALL write an Audit Log entry for that record (`action: "UPDATE"`, `entityType: "VehicleRecord"`, `entityId` set to the record's id, `beforeSnapshot`/`afterSnapshot` containing only the changed fields) and SHALL append one entry to the response's `changedRecords` array containing the row number, an identifier (e.g. license plate), the record's id, and the list of changed fields (`{ field, oldValue, newValue }`). Newly-created VehicleRecord rows are never included in `changedRecords`. A re-imported row whose values are identical to the existing record produces no Audit Log entry and no `changedRecords` entry for that row.

The endpoint's response SHALL be `{ imported: number, updated: number, warnings: string[], errors: string[], changedRecords?: ImportChangedRecord[] }`, with `changedRecords` present only when at least one updated row actually changed.

#### Scenario: Updating kmHienTai produces a changed-record entry

- **WHEN** an admin re-imports a vehicle-maintenance file where an existing VehicleRecord's `kmHienTai` cell now differs from the stored value
- **THEN** the record is updated, an Audit Log entry is written with the old and new `kmHienTai` values, and the response's `changedRecords` includes one entry for that row listing `{ field: "kmHienTai", oldValue, newValue }`

#### Scenario: Re-importing an unmodified maintenance record produces no changed-record entry

- **WHEN** an admin re-imports a vehicle-maintenance file where an existing VehicleRecord's fields are unchanged from the stored values
- **THEN** the record is updated in place with identical values, no Audit Log entry is written for that record, and no `changedRecords` entry is added for that row

#### Scenario: Newly created maintenance record is excluded from changedRecords

- **WHEN** an admin imports a row with no existing `id`, creating a new VehicleRecord
- **THEN** the row is counted in `imported`, and no `changedRecords` entry is created for it

### Requirement: Km-round field changes are merged into the parent vehicle record's changed-record entry

When `importVehicleMaintenance` upserts a `VehicleMaintenanceKmRound` (matched by the unique key `(vehicleRecordId, roundNumber)`), the system SHALL diff its `kmCon` field against the stored value BEFORE writing, when an existing row for that `(vehicleRecordId, roundNumber)` is found. Any changed km-round value SHALL be reported using the field name `kmRounds[Lần <roundNumber>].kmCon` and SHALL be appended to the SAME `changedRecords` entry (and the same Audit Log entry's snapshots) as the round's parent `VehicleRecord` — not as a separate `changedRecords` entry. Creating a new km-round (no prior row for that `(vehicleRecordId, roundNumber)`) is never included in the diff.

#### Scenario: Updating "KM CÒN DƯỠNG LẦN 2" is reported under the parent record

- **WHEN** an admin re-imports a row whose vehicle record is unchanged but whose "Lần 2" km-round value now differs from the stored value
- **THEN** the parent VehicleRecord's `changedRecords` entry for that row includes `{ field: "kmRounds[Lần 2].kmCon", oldValue, newValue }`, and no separate `changedRecords` entry is created for the km-round itself

#### Scenario: Vehicle record and one of its km-rounds both change in the same row

- **WHEN** an admin re-imports a row where both the vehicle record's `ngayLam` and its "Lần 1" km-round value differ from stored values
- **THEN** exactly one `changedRecords` entry is produced for that row, containing both `{ field: "ngayLam", ... }` and `{ field: "kmRounds[Lần 1].kmCon", ... }`

#### Scenario: Adding a new km-round to an existing record is not reported as a change

- **WHEN** an admin re-imports a row for an existing VehicleRecord that previously had only "Lần 1" and now also includes a "Lần 2" column with a value
- **THEN** a new `VehicleMaintenanceKmRound` row is created for "Lần 2" and this is NOT included in `changedRecords` (only updates to existing rounds are diffed)

### Requirement: Import UI displays changed records via a popup table

When the import-export page receives an `importVehicleMaintenance` response with a non-empty `changedRecords` array, the system SHALL render a clickable summary line (e.g. "X bản ghi đã thay đổi (bấm để xem)") that, when clicked, opens a modal popup containing a table with one row per changed record. Each table row SHALL show the record's identifier and a single cell listing all of that record's changed fields (`field: oldValue → newValue`, one per line, including any `kmRounds[Lần N].*` entries). The popup SHALL be dismissible via a close control. When `changedRecords` is empty or absent, no summary line or popup is rendered. This is the same shared popup component used by the `importVehicles` import UI.

#### Scenario: Clicking the summary line opens the popup

- **WHEN** an admin uploads a "bảo dưỡng xe" file via the import-export page and the response includes a non-empty `changedRecords` array, then clicks the "X bản ghi đã thay đổi" summary line
- **THEN** a modal popup opens showing a table with one row per changed record, each listing its identifier and changed fields (including km-round fields, if any) with old/new values

#### Scenario: No summary line when nothing changed

- **WHEN** an admin uploads a "bảo dưỡng xe" file via the import-export page and the response's `changedRecords` is empty or absent
- **THEN** no changed-records summary line or popup is rendered
