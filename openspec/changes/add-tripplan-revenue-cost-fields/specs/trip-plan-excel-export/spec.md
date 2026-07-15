## MODIFIED Requirements

### Requirement: Exported Excel matches the actual 31-column template layout

The system SHALL produce a worksheet named "kế hoạch xe" with the following column headers in order, matching the customer's template exactly:

STT, NGÀY, SỐ XE, KHÁCH HÀNG, LOẠI HÌNH, ĐƠN VỊ, SIZE CONT, CONT ĐI, CONT VỀ, Điểm Lấy (R/H), Điểm (Đóng/Rút), Điểm hạ (R/H), PHÍ NÂNG, SHĐ NÂNG, PHÍ HẠ, SHĐ HẠ, PHÍ VỆ SINH, SHĐ, PHÍ CƯỢC, VÉ CỔNG, SHĐ, CHI PHÍ KHÁC/PHÍ ĐỨT TEM, CHI PHÍ TRÁI TUYẾN/CHỈ ĐỊNH/BP CAM, CẦU ĐƯỜNG, **LƯƠNG, CƯỚC, DOANH THU, PHỤ THU, CHI PHÍ, TIỀN DẦU, NEO XE**, NGÀY GỬI CT, CHI PHÍ PHÁT SINH KHÁC, NỘI DUNG, GHI CHÚ, ID.

The 7 new columns (LƯƠNG, CƯỚC, DOANH THU, PHỤ THU, CHI PHÍ, TIỀN DẦU, NEO XE) SHALL be positioned immediately after CẦU ĐƯỜNG and before NGÀY GỬI CT. NỘI DUNG, GHI CHÚ, and the trailing ID column SHALL remain the last columns in the file.

Each of the 7 new columns SHALL be populated directly from the corresponding `TripPlan` amount field (`luongAmount`, `cuocAmount`, `doanhThuAmount`, `phuThuAmount`, `chiPhiAmount`, `tienDauAmount`, `neoXeAmount` respectively) — not from `TripPlanCost` rows. A `null` value SHALL render as a blank cell.

#### Scenario: Header row contains the 7 new columns in the correct position

- **WHEN** the export file is opened
- **THEN** the header row contains LƯƠNG, CƯỚC, DOANH THU, PHỤ THU, CHI PHÍ, TIỀN DẦU, NEO XE, in that order, immediately after CẦU ĐƯỜNG and before NGÀY GỬI CT

#### Scenario: New column shows amount from the TripPlan field

- **WHEN** a TripPlan has `doanhThuAmount = 15000000`
- **THEN** the DOANH THU cell for that row displays `15000000`

#### Scenario: Null new-field value renders as a blank cell

- **WHEN** a TripPlan has `neoXeAmount = null`
- **THEN** the NEO XE cell for that row is blank

#### Scenario: NỘI DUNG, GHI CHÚ, and ID remain the last columns

- **WHEN** the export file is opened
- **THEN** NỘI DUNG, GHI CHÚ, and ID are the final three columns, unaffected by the 7 new columns inserted earlier in the row

---

### Requirement: Exported columns have appropriate widths

The system SHALL set column widths on the export worksheet to accommodate the expected content, including the 7 new columns. Vietnamese header text and typical data values SHALL be fully visible without manual column resizing.

#### Scenario: Column widths are explicitly set for the new columns

- **WHEN** the export file is opened in Excel
- **THEN** the LƯƠNG, CƯỚC, DOANH THU, PHỤ THU, CHI PHÍ, TIỀN DẦU, and NEO XE columns have widths wider than the default (8.43 characters) so content is not truncated
