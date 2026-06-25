## ADDED Requirements

### Requirement: Bảo dưỡng xe Excel export includes the branded header on every sheet

The `bao-duong-xe` Excel export (one worksheet per `loaiXe`) SHALL prepend the branded header block (logo, title "BẢO DƯỠNG XE", date line) described in `excel-branded-header` to **each** worksheet it produces. The column header row (e.g. "NGÀY LÀM", "SỐ XE", "BIỂN SỐ", dynamic "KM CÒN DƯỠNG LẦN n" columns, ...) moves from row 1 to row 9; data starts at row 10.

#### Scenario: Each loaiXe sheet has its own branded header

- **WHEN** the bảo dưỡng xe export produces sheets for "Xe đầu kéo" and "Xe tải"
- **THEN** both worksheets independently contain the logo, "BẢO DƯỠNG XE" title, and date line in rows 1–8

#### Scenario: Column headers, including dynamic KM round columns, start at row 9

- **WHEN** a sheet has 3 distinct "KM CÒN DƯỠNG LẦN n" rounds detected across its records
- **THEN** row 9 contains the fixed columns plus 3 "KM CÒN DƯỠNG LẦN n" columns, and row 10 onward contains data
