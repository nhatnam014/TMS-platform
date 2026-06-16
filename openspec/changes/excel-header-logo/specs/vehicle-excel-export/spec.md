## MODIFIED Requirements

### Requirement: Exported Excel matches the Vietnamese column header order for quản lý xe

The system SHALL produce a worksheet named "quản lý xe" with the same 12 column headers as before. The column header row SHALL now be row 5 (rows 1–4 are the branded header block). Data rows start at row 6.

#### Scenario: Header row is at row 5

- **WHEN** the quản lý xe export file is opened
- **THEN** row 5 contains the Vietnamese headers (STT, HỌ VÀ TÊN, SĐT, ...) in the specified order

#### Scenario: Each data row maps to one VehicleRecord

- **WHEN** there are 5 VehicleRecord rows
- **THEN** the worksheet has rows 1–4 (header block), row 5 (column headers), and rows 6–10 (data) — total 10 rows
