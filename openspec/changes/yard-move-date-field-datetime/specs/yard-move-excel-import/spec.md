## MODIFIED Requirements

### Requirement: Parser locates the lệnh bãi header row and resolves columns by diacritic-stripped name

The system SHALL detect the header row by scanning the first 25 rows for a cell matching "stt" (case-insensitive) within the first 5 columns, accommodating the branded export's row-9 header position as well as a plain row-1 header in hand-edited files. Column resolution SHALL match header text after stripping Vietnamese diacritics and normalizing case, so "GHI CHÚ", "Ghi chu", and "ghi chú" all resolve to the same column.

The parser SHALL extract for each data row: `date` (from "NGÀY"), `gps` (from "GPS"), `fullName` (from "FULL NAME"), `truck` (from "TRUCK"), `mooc` (from "MOOC"), `booking` (from "BOOKING"), `containerNumber` (from "CONTAINER"), `notes` (from "GHI CHÚ"), `daKeo` (from "DÃ KÉO"), and an optional `id` (from a trailing "ID" column, used to match existing records).

The `date` value SHALL be parsed as a real date: a native Excel date-formatted cell (read by ExcelJS as a JS `Date`) SHALL be used directly; a text cell SHALL be parsed as `dd/mm/yyyy`. All other extracted values SHALL be read as plain strings with no format validation or type coercion.

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

#### Scenario: Native Excel date cell is parsed directly

- **WHEN** the "NGÀY" cell of a data row is a date-formatted Excel cell (e.g. `24/06/2026`)
- **THEN** the parser reads it as a JS `Date` equal to 2026-06-24 with no text parsing

#### Scenario: Text date in dd/mm/yyyy format is parsed

- **WHEN** the "NGÀY" cell of a data row is the text `"24/06/2026"`
- **THEN** the parser parses it as a `Date` equal to 2026-06-24

#### Scenario: Unparseable NGÀY value is reported as an error

- **WHEN** a non-empty data row has a "NGÀY" value that is neither a native Excel date nor a `dd/mm/yyyy` text string (e.g. `"24/06"` or `"not a date"`)
- **THEN** the row is skipped and an entry is added to `errors` referencing that row number, distinct from the "missing NGÀY" error
