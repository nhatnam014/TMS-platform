## ADDED Requirements

### Requirement: Two-phase import for quản-lý-xe with vehicle conflict confirmation

The vehicle record import (quản-lý-xe Excel) SHALL operate in two phases:

**Phase 1 — Preview** (`POST /api/import/vehicles` without `?confirm=true`):
Parse the Excel file, run all upsert logic in-memory (driver findOrCreate, vehicle conflict detection), and return a preview response WITHOUT writing any data to the database. The preview response SHALL include:

- `toCreate`: count of new VehicleRecord rows that would be created
- `conflicts`: array of vehicle conflicts, each describing the license plate and the field-level diff (current DB value vs incoming Excel value)
- `errors`: array of structural row errors (same as current import errors)

If `conflicts` is empty and `errors` is empty, the frontend MAY either show a simple confirmation or auto-proceed to Phase 2.

**Phase 2 — Execute** (`POST /api/import/vehicles?confirm=true`):
Parse and execute the import: create drivers (findOrCreate), update conflicting vehicles, create all VehicleRecord and VehicleRecordMooc rows. Returns the standard `{ imported, warnings, errors }` response.

If the user cancels after Phase 1, no request is sent to Phase 2 and no data is written.

#### Scenario: Phase 1 returns conflict list without writing data

- **WHEN** an admin uploads a quản-lý-xe file containing a `bienSo` that already exists in the Vehicle table with different field values, without `?confirm=true`
- **THEN** the API returns HTTP 200 with `{ toCreate: N, conflicts: [...], errors: [] }` and no VehicleRecord, Vehicle, or Driver rows are created or modified

#### Scenario: Phase 1 returns empty conflicts for all-new data

- **WHEN** the uploaded file contains only bienSo values that do not exist in the Vehicle table
- **THEN** the API returns HTTP 200 with `{ toCreate: N, conflicts: [], errors: [] }` and no data is written

#### Scenario: Phase 2 executes full import after user confirmation

- **WHEN** the admin uploads the same file with `?confirm=true`
- **THEN** the API writes all drivers (findOrCreate), updates conflicting vehicles, creates all VehicleRecords, and returns `{ imported: N, warnings: [], errors: [] }`

#### Scenario: Phase 2 updates vehicle fields for confirmed conflicts

- **WHEN** a conflict exists for vehicle with `licensePlate = "50E12208"` and the user confirms
- **THEN** `Vehicle.inspectionExpiry`, `Vehicle.insuranceExpiry`, `Vehicle.registrationExpiry`, and `Vehicle.vehicleType` are updated to the values from the Excel file

#### Scenario: Cancel — no data written

- **WHEN** Phase 1 returns conflicts and the user clicks Cancel in the frontend dialog
- **THEN** no Phase 2 request is made and no data is written to the database

### Requirement: Conflict diff format

Each entry in the `conflicts` array returned by Phase 1 SHALL include:

- `licensePlate`: the vehicle's license plate string
- `fields`: an object mapping each differing field name to `{ current: <db value>, incoming: <excel value> }`

Fields compared: `vehicleType`, `inspectionExpiry`, `insuranceExpiry`, `registrationExpiry`. Fields with identical values SHALL NOT appear in `fields`. A vehicle with no differing fields SHALL NOT appear in `conflicts`.

#### Scenario: Conflict entry shows only changed fields

- **WHEN** a vehicle's `inspectionExpiry` differs from the Excel value but `insuranceExpiry` and `registrationExpiry` are identical
- **THEN** the conflict entry contains only `inspectionExpiry` in `fields`, not the unchanged fields

#### Scenario: Identical vehicle data is not treated as conflict

- **WHEN** a vehicle's `licensePlate` already exists in the DB and all comparable fields match the Excel row exactly
- **THEN** no conflict entry is generated for that vehicle and it is silently reused

### Requirement: Driver findOrCreate during import

During quản-lý-xe import (Phase 2 / confirm=true), the system SHALL look up each row's driver by exact match on `(fullName = tenTaiXe, phone = sdt)`. If a matching Driver record exists, it SHALL be reused. If no match is found, a new Driver record SHALL be created with `fullName = tenTaiXe`, `phone = sdt`, and `status = ACTIVE`. The newly created Driver is not linked to any Vehicle (no `vehicleId` assigned). No conflict detection or update is performed for drivers.

#### Scenario: Existing driver reused by name+phone match

- **WHEN** a row has `tenTaiXe = "Nguyễn A"` and `sdt = "0901234567"` and a Driver with `fullName = "Nguyễn A"` and `phone = "0901234567"` already exists
- **THEN** no new Driver is created; the existing driver record is reused (not returned in response, just not duplicated)

#### Scenario: New driver created when name+phone pair is absent

- **WHEN** a row has `tenTaiXe = "Trần B"` and `sdt = "0912345678"` and no Driver matches that exact pair
- **THEN** a new Driver with `fullName = "Trần B"`, `phone = "0912345678"`, `status = ACTIVE` is created

#### Scenario: Same name different phone creates distinct driver

- **WHEN** Driver `("Nguyễn A", "0901")` exists and a row has `tenTaiXe = "Nguyễn A"`, `sdt = "0999"`
- **THEN** a second Driver `("Nguyễn A", "0999")` is created as a separate record

#### Scenario: Row with no tenTaiXe or sdt skips driver upsert

- **WHEN** a row has both `tenTaiXe` and `sdt` as empty/null
- **THEN** no Driver lookup or creation is attempted and the VehicleRecord is still created with null driver fields
