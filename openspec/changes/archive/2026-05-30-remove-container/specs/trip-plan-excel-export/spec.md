## MODIFIED Requirements

### Requirement: Exported Excel matches the Vietnamese column header order

The system SHALL produce a worksheet with headers and column order matching the original "kế hoạch xe" template: STT, NGÀY, SỐ XE, RƠ MOÓC, KHÁCH HÀNG, NHÀ VẬN CHUYỂN, CONT 1 (SỐ CONT, LOẠI CONT, ĐÓNG/RÚT, NƠI LẤY CONT, NƠI ĐÓNG HÀNG, NƠI ĐỂ CONT, NƠI HẠ CONT), CONT 2 (same structure), TỔNG CƯỚC, GHI CHÚ. Container number columns (SỐ CONT 1, SỐ CONT 2) MUST be sourced from `tp.outboundContainerNumber` and `tp.inboundContainerNumber` string fields. The LOẠI CONT columns output empty string (container size is no longer stored).

#### Scenario: Header row contains Vietnamese column names

- **WHEN** the export file is opened
- **THEN** row 1 contains the Vietnamese headers in the specified order

#### Scenario: Container number columns source from string fields

- **WHEN** a TripPlan with `outboundContainerNumber = "OOLU8990993"` is exported
- **THEN** the "SỐ CONT 1" cell contains "OOLU8990993"

#### Scenario: Container size column is empty

- **WHEN** any TripPlan is exported
- **THEN** the "LOẠI CONT 1" and "LOẠI CONT 2" cells are empty strings (no size data available)

#### Scenario: Each data row maps to one TripPlan record

- **WHEN** the export contains 50 TripPlan records
- **THEN** the worksheet has 51 rows (1 header + 50 data)
