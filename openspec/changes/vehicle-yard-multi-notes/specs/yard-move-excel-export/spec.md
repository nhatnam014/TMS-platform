## MODIFIED Requirements

### Requirement: Exported Excel uses the branded header layout and matches the lệnh bãi column order

The system SHALL produce a worksheet following the same branded layout used by the existing export builders (`kehoach-xe`, `quanly-xe`, `baoduong-xe`): logo image and title block on rows 1-8 (title "LỆNH BÃI"), column headers at row 9, data starting at row 10. The column order SHALL be: STT, NGÀY, GPS, FULL NAME, TRUCK, MOOC, BOOKING, CONTAINER, GHI CHÚ, DÃ KÉO, followed by a hidden trailing `ID` column. No new columns are added and no existing column's position changes.

The "GHI CHÚ" cell SHALL contain all of a `YardMove`'s `YardMoveNote` entries, oldest first, joined with a newline (`\n`) separator, in a single cell. A record with zero notes SHALL produce an empty "GHI CHÚ" cell.

#### Scenario: Header row contains the lệnh bãi columns in order

- **WHEN** the export file is opened
- **THEN** row 9 contains the headers "STT", "NGÀY", "GPS", "FULL NAME", "TRUCK", "MOOC", "BOOKING", "CONTAINER", "GHI CHÚ", "DÃ KÉO" in that order, followed by a final "ID" column

#### Scenario: STT column reflects row position, not a stored field

- **WHEN** the export contains N records
- **THEN** the STT column contains sequential values 1..N matching each row's position in the export, regardless of any client-side filtering

#### Scenario: Each scalar field is written as plain text with no format coercion

- **WHEN** a `YardMove` has `gps`, `fullName`, `truck`, `mooc`, `booking`, `containerNumber`, `daKeo` values
- **THEN** each is written verbatim as a string cell with no validation or reformatting

#### Scenario: Single note exports as before

- **WHEN** a `YardMove` has exactly one `YardMoveNote` with content "XONG K3"
- **THEN** the "GHI CHÚ" cell for that row contains exactly "XONG K3"

#### Scenario: Multiple notes join with newlines

- **WHEN** a `YardMove` has `YardMoveNote` entries "XONG K3" and "Chờ booking", created in that order
- **THEN** the "GHI CHÚ" cell contains "XONG K3\nChờ booking"

#### Scenario: Null optional fields write empty cells

- **WHEN** a `YardMove` scalar field is `null`, or a `YardMove` has zero `YardMoveNote` entries
- **THEN** the corresponding cell is empty

#### Scenario: Trailing ID column is present but visually de-emphasized

- **WHEN** the export file is opened
- **THEN** the final column contains each record's `id` rendered in a greyed-out font, matching the convention used by the other three export builders
