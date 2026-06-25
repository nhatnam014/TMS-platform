## MODIFIED Requirements

### Requirement: Exported Excel matches the Vietnamese column header order for quản lý xe

The system SHALL produce a worksheet named "quản lý xe" with the same 12 column headers as before. The column header row SHALL now be row 9 (rows 1–8 are the branded header block: logo, title row 3, date row 5, blank spacer row 8 — see `excel-branded-header`). Data rows start at row 10.

#### Scenario: Header row is at row 9

- **WHEN** the quản lý xe export file is opened
- **THEN** row 9 contains the Vietnamese headers (STT, HỌ VÀ TÊN, SĐT, ...) in the specified order

#### Scenario: Each data row maps to one VehicleRecord

- **WHEN** there are 5 VehicleRecord rows
- **THEN** the worksheet has rows 1–8 (header block), row 9 (column headers), and rows 10–14 (data) — total 14 rows
