## MODIFIED Requirements

### Requirement: Exported Excel uses the branded header layout and matches the lệnh bãi column order

The system SHALL produce a worksheet following the same branded layout used by the existing export builders (`kehoach-xe`, `quanly-xe`, `baoduong-xe`): logo image and title block on rows 1-8 (title "LỆNH BÃI"), column headers at row 9, data starting at row 10. The column order SHALL be: STT, NGÀY, GPS, FULL NAME, TRUCK, MOOC, BOOKING, CONTAINER, GHI CHÚ, DÃ KÉO, followed by a hidden trailing `ID` column.

The NGÀY cell SHALL be written as a `dd/mm/yyyy`-formatted string via the same local `formatDate()` helper convention used by the other three export builders (`kehoach-xe`, `quanly-xe`, `baoduong-xe`), not the raw pass-through value.

#### Scenario: Header row contains the lệnh bãi columns in order

- **WHEN** the export file is opened
- **THEN** row 9 contains the headers "STT", "NGÀY", "GPS", "FULL NAME", "TRUCK", "MOOC", "BOOKING", "CONTAINER", "GHI CHÚ", "DÃ KÉO" in that order, followed by a final "ID" column

#### Scenario: STT column reflects row position, not a stored field

- **WHEN** the export contains N records
- **THEN** the STT column contains sequential values 1..N matching each row's position in the export, regardless of any client-side filtering

#### Scenario: Each free-text field is written as plain text with no format coercion

- **WHEN** a `YardMove` has `gps`, `fullName`, `truck`, `mooc`, `booking`, `containerNumber`, `notes`, `daKeo` values
- **THEN** each is written verbatim as a string cell with no validation or reformatting

#### Scenario: NGÀY cell is written as a formatted date string

- **WHEN** a `YardMove` has `date: 2026-06-24`
- **THEN** the NGÀY cell's value is the string `"24/06/2026"`

#### Scenario: Null optional fields write empty cells

- **WHEN** a `YardMove` field is `null`
- **THEN** the corresponding cell is empty

#### Scenario: Trailing ID column is present but visually de-emphasized

- **WHEN** the export file is opened
- **THEN** the final column contains each record's `id` rendered in a greyed-out font, matching the convention used by the other three export builders
