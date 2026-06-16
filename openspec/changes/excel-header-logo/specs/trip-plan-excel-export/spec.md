## MODIFIED Requirements

### Requirement: Exported Excel matches the 28-column template layout

The system SHALL produce a worksheet named "kế hoạch xe" with the following 28 column headers in order (the previous 20', 40', 45' columns are removed):

STT, NGÀY, SỐ XE, KHÁCH HÀNG, LOẠI HÌNH, ĐƠN VỊ, SIZE CONT, CONT ĐI, CONT VỀ, Điểm Lấy (R/H), Điểm (Đóng/Rút), Điểm hạ (R/H), PHÍ NÂNG, SHĐ NÂNG, PHÍ HẠ, SHĐ HẠ, PHÍ VỆ SINH, SHĐ, PHÍ CƯỢC, VÉ CỔNG, SHĐ, CHI PHÍ KHÁC/PHÍ ĐỨT TEM, CHI PHÍ TRÁI TUYẾN/CHỈ ĐỊNH/BP CAM, CẦU ĐƯỜNG, NGÀY GỬI CT, CHI PHÍ PHÁT SINH KHÁC, NỘI DUNG, GHI CHÚ.

The column header row SHALL be row 5 (rows 1–4 are the branded header block). Data rows start at row 6.

Cost columns SHALL be populated from fixed-slot fields on TripPlan (e.g. `phiNangAmount`, `phiHaAmount`, etc.). SHĐ columns are populated from corresponding SHĐ fields.

#### Scenario: Header row is at row 5 with 28 columns

- **WHEN** the kế hoạch xe export file is opened
- **THEN** row 5 contains exactly 28 column headers in the specified order, with no 20', 40', or 45' columns present

#### Scenario: Data rows begin at row 6

- **WHEN** the export contains 10 TripPlan records
- **THEN** the worksheet has rows 1–4 (header block), row 5 (column headers), and rows 6–15 (data) — total 15 rows

#### Scenario: SIZE CONT column shows container size code

- **WHEN** a TripPlan has containerSize.code = "40HC"
- **THEN** the SIZE CONT cell contains "40HC" (no separate tick columns)

## REMOVED Requirements

### Requirement: Exported Excel matches the actual 31-column template layout

**Reason**: The 20', 40', and 45' tick-mark columns were unused in practice and have been removed, reducing the column count from 31 to 28. The SIZE CONT column already carries the size code.

**Migration**: Any downstream tooling that relied on columns 10–12 (20', 40', 45') must be updated to use the SIZE CONT column (column 7) instead.
