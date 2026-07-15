## MODIFIED Requirements

### Requirement: Parser locates the lệnh bãi header row and resolves columns by diacritic-stripped name

The system SHALL detect the header row by scanning the first 25 rows for a cell matching "stt" (case-insensitive) within the first 5 columns, accommodating the branded export's row-9 header position as well as a plain row-1 header in hand-edited files. Column resolution SHALL match header text after stripping Vietnamese diacritics and normalizing case, so "GHI CHÚ", "Ghi chu", and "ghi chú" all resolve to the same column.

The parser SHALL extract for each data row: `date` (from "NGÀY"), `gps` (from "GPS"), `fullName` (from "FULL NAME"), `truck` (from "TRUCK"), `mooc` (from "MOOC"), `booking` (from "BOOKING"), `containerNumber` (from "CONTAINER"), `noteLines` — the "GHI CHÚ" cell's raw text split on newlines into a list of non-empty trimmed lines, one `YardMoveNote` per line — `daKeo` (from "DÃ KÉO"), and an optional `id` (from a trailing "ID" column, used to match existing records).

All extracted values other than `id` and `noteLines` SHALL be read as plain strings with no date parsing, format validation, or type coercion.

#### Scenario: Header row detected at row 9 for branded exports

- **WHEN** an uploaded file has the branded header block on rows 1-8 and column headers on row 9
- **THEN** the parser correctly identifies row 9 as the header row and reads data starting at row 10

#### Scenario: Header row detected at row 1 for plain files

- **WHEN** an uploaded file has column headers on row 1 with no branded header block
- **THEN** the parser correctly identifies row 1 as the header row and reads data starting at row 2

#### Scenario: Diacritic-insensitive header matching

- **WHEN** a column header is written as "Ghi chu" (no diacritics) instead of "GHI CHÚ"
- **THEN** the parser still resolves that column to the notes column used for `noteLines`

#### Scenario: Multi-line Ghi chú cell splits into multiple notes

- **WHEN** a data row's "GHI CHÚ" cell contains "XONG K3\nChờ booking"
- **THEN** `noteLines` is `["XONG K3", "Chờ booking"]`

#### Scenario: Blank Ghi chú cell produces zero notes

- **WHEN** a data row's "GHI CHÚ" cell is empty or whitespace-only
- **THEN** `noteLines` is `[]`

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

---

### Requirement: Import changes are audit-logged

The system SHALL log an audit entry for each updated `YardMove` record describing the changed fields (before/after), plus one summary audit entry per import run, following the same convention used by the existing trip-plan and vehicle import flows. The audit `entityType` SHALL be `"YardMove"`. For a matched (update) row, the update and its `YardMoveNote` list replacement SHALL happen in the same database transaction; the changed-field diff SHALL compare the record's notes as a single joined value (all `YardMoveNote` contents joined with `\n`, oldest first) against the imported cell's raw text, so a note-only change still produces a `"notes"` entry in `changedRecords` even though `notes` is no longer a `YardMove` scalar column.

#### Scenario: Updated record produces a per-record audit entry

- **WHEN** an import in execute mode updates a `YardMove`'s notes (its "GHI CHÚ" cell content differs from the record's currently joined notes)
- **THEN** an audit log entry is created with `entityType: "YardMove"`, `action: "UPDATE"`, and a message identifying `"notes"` as a changed field with its old and new joined values

#### Scenario: Re-importing an unedited export produces no notes diff entry

- **WHEN** an import in execute mode processes a row whose "GHI CHÚ" cell content, split and rejoined, matches the record's existing notes exactly
- **THEN** no `"notes"` entry appears in that record's `changedRecords` changes, and if no other field changed, no audit entry or `changedRecords` entry is produced for that row at all

#### Scenario: Update and note-list replacement are transactional

- **WHEN** an import in execute mode updates a `YardMove`'s scalar fields and notes together
- **THEN** the `YardMove.update` call and the `YardMoveNote` delete-then-recreate both succeed or both fail as a single transaction

#### Scenario: Import run produces a summary audit entry

- **WHEN** an import in execute mode completes
- **THEN** a summary audit entry is created describing the total counts of created, updated, warned, and errored rows
