## ADDED Requirements

### Requirement: Header-row detection tolerates the branded header block or its absence

The "quản lý xe" import parser SHALL locate the column-header row by scanning worksheet rows for the keyword `"stt"` (case-insensitive) within the first **25** rows (widened from the previous 10-row cap), rather than assuming a fixed row number. This allows the parser to correctly import:
- legacy files exported before any branded header existed (column headers at row 1)
- files exported under the branded header design (column headers at row 9)
- files where a user manually nudged rows by a small amount

No file is rejected or treated differently based on whether it contains the branded header — detection is based solely on cell content.

#### Scenario: Import succeeds for a freshly-exported branded file

- **WHEN** an admin imports a "quản lý xe" file exported under the current branded-header design (column headers at row 9)
- **THEN** the parser locates the header row at row 9 and imports all data rows correctly

#### Scenario: Import succeeds for a legacy file with no header block

- **WHEN** an admin imports a "quản lý xe" file with column headers at row 1 (no logo/title block)
- **THEN** the parser locates the header row at row 1 and imports all data rows correctly
