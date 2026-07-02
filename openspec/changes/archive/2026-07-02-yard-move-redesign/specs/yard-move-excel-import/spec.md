## ADDED Requirements

### Requirement: Admin can bulk-import yard moves from Excel

The system SHALL provide `POST /api/v1/import/yard-moves` that accepts a multipart/form-data request with a field named `file` containing an `.xlsx` file matching the "lệnh bãi" export column layout (STT, NGÀY, GPS, FULL NAME, TRUCK, MOOC, BOOKING, CONTAINER, GHI CHÚ, DÃ KÉO, optional trailing ID).

The endpoint operates in two modes controlled by the `?confirm=true` query parameter:

**Preview mode** (default, no `?confirm=true`): Parse the file and return counts WITHOUT writing any data. Response: `{ toCreate: number, toUpdate: number, warnings: string[], errors: string[] }`. HTTP 200.

**Execute mode** (`?confirm=true`): Parse and execute: create new `YardMove` records for rows with no matching ID, update existing records for rows with a matching ID. Response: `{ imported: number, updated: number, warnings: string[], errors: string[], changedRecords: ChangedRecord[] }`. HTTP 200.

In both modes the endpoint MUST be restricted to users with role ADMIN. File size limit of 5 MB applies to both modes.

#### Scenario: Preview returns create/update counts without writing data

- **WHEN** an admin uploads a file containing a mix of rows with and without an ID matching an existing `YardMove` (no `?confirm=true`)
- **THEN** the API returns HTTP 200 with `{ toCreate: N, toUpdate: M, warnings: [], errors: [] }` and no rows are created or modified

#### Scenario: Execute mode creates and updates records

- **WHEN** an admin uploads the file with `?confirm=true`
- **THEN** rows without a recognized ID create new `YardMove` records; rows with an ID matching an existing record update that record's fields; the API returns `{ imported: N, updated: M, warnings: [], errors: [], changedRecords: [...] }`

#### Scenario: Non-admin role is rejected

- **WHEN** a user without ADMIN role uploads a file
- **THEN** the API returns HTTP 403

#### Scenario: File size exceeds 5 MB limit

- **WHEN** an admin uploads a file larger than 5 MB
- **THEN** the API returns HTTP 413 and does not process any rows

### Requirement: Parser locates the lệnh bãi header row and resolves columns by diacritic-stripped name

The system SHALL detect the header row by scanning the first 25 rows for a cell matching "stt" (case-insensitive) within the first 5 columns, accommodating the branded export's row-9 header position as well as a plain row-1 header in hand-edited files. Column resolution SHALL match header text after stripping Vietnamese diacritics and normalizing case, so "GHI CHÚ", "Ghi chu", and "ghi chú" all resolve to the same column.

The parser SHALL extract for each data row: `date` (from "NGÀY"), `gps` (from "GPS"), `fullName` (from "FULL NAME"), `truck` (from "TRUCK"), `mooc` (from "MOOC"), `booking` (from "BOOKING"), `containerNumber` (from "CONTAINER"), `notes` (from "GHI CHÚ"), `daKeo` (from "DÃ KÉO"), and an optional `id` (from a trailing "ID" column, used to match existing records).

All extracted values other than `id` SHALL be read as plain strings with no date parsing, format validation, or type coercion.

#### Scenario: Header row detected at row 9 for branded exports

- **WHEN** an uploaded file has the branded header block on rows 1-8 and column headers on row 9
- **THEN** the parser correctly identifies row 9 as the header row and reads data starting at row 10

#### Scenario: Header row detected at row 1 for plain files

- **WHEN** an uploaded file has column headers on row 1 with no branded header block
- **THEN** the parser correctly identifies row 1 as the header row and reads data starting at row 2

#### Scenario: Diacritic-insensitive header matching

- **WHEN** a column header is written as "Ghi chu" (no diacritics) instead of "GHI CHÚ"
- **THEN** the parser still resolves that column to the `notes` field

#### Scenario: Row with an ID matching an existing record is treated as an update

- **WHEN** a data row has a non-empty ID column value matching an existing `YardMove.id`
- **THEN** that row is queued as an update to the existing record rather than a new creation

#### Scenario: Row with no ID or an unrecognized ID is treated as a new record

- **WHEN** a data row has an empty ID column or a value not matching any existing `YardMove.id`
- **THEN** that row is queued as a new `YardMove` creation

#### Scenario: Fully empty row is silently skipped

- **WHEN** a row has all relevant cells empty
- **THEN** it is skipped with no entry added to `errors` or `warnings`

#### Scenario: Row missing NGÀY is reported as an error

- **WHEN** a non-empty data row has no value in the "NGÀY" column
- **THEN** the row is skipped and an entry is added to `errors` referencing that row number

### Requirement: Import changes are audit-logged

The system SHALL log an audit entry for each updated `YardMove` record describing the changed fields (before/after), plus one summary audit entry per import run, following the same convention used by the existing trip-plan and vehicle import flows. The audit `entityType` SHALL be `"YardMove"`.

#### Scenario: Updated record produces a per-record audit entry

- **WHEN** an import in execute mode updates a `YardMove`'s `notes` field
- **THEN** an audit log entry is created with `entityType: "YardMove"`, `action: "UPDATE"`, and a message identifying the changed field with its old and new values

#### Scenario: Import run produces a summary audit entry

- **WHEN** an import in execute mode completes
- **THEN** a summary audit entry is created describing the total counts of created, updated, warned, and errored rows
