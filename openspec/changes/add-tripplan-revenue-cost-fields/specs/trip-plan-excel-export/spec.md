## MODIFIED Requirements

### Requirement: Exported Excel matches the actual column template layout

The system SHALL produce a worksheet named "kế hoạch xe" with the following column headers in order, matching the customer's template exactly:

STT, NGÀY, SỐ XE, KHÁCH HÀNG, **TRẠNG THÁI**, LOẠI HÌNH, ĐƠN VỊ, SIZE CONT, CONT ĐI, CONT VỀ, Điểm Lấy (R/H), Điểm (Đóng/Rút), Điểm hạ (R/H), PHÍ NÂNG, SHĐ NÂNG, PHÍ HẠ, SHĐ HẠ, PHÍ VỆ SINH, SHĐ, PHÍ CƯỢC, VÉ CỔNG, SHĐ, CHI PHÍ KHÁC/PHÍ ĐỨT TEM, CHI PHÍ TRÁI TUYẾN/CHỈ ĐỊNH/BP CAM, CẦU ĐƯỜNG, **LƯƠNG, SHĐ LƯƠNG, CƯỚC, SHĐ CƯỚC, DOANH THU, SHĐ DOANH THU, PHỤ THU, SHĐ PHỤ THU, CHI PHÍ, SHĐ CHI PHÍ, TIỀN DẦU, SHĐ TIỀN DẦU, NEO XE, SHĐ NEO XE**, NGÀY GỬI CT, CHI PHÍ PHÁT SINH KHÁC, NỘI DUNG, GHI CHÚ, ID.

The TRẠNG THÁI column SHALL be positioned immediately after KHÁCH HÀNG. It SHALL be populated with the trip's status rendered as its Vietnamese label (via the shared `TRIP_STATUS_LABELS` map), not the raw `TripStatus` enum value — e.g. `PLANNED` → "Kế hoạch", `COMPLETED` → "Hoàn thành".

The 7 amount columns (LƯƠNG, CƯỚC, DOANH THU, PHỤ THU, CHI PHÍ, TIỀN DẦU, NEO XE) SHALL be positioned immediately after CẦU ĐƯỜNG and before NGÀY GỬI CT, each immediately followed by its own SHĐ column (SHĐ LƯƠNG, SHĐ CƯỚC, SHĐ DOANH THU, SHĐ PHỤ THU, SHĐ CHI PHÍ, SHĐ TIỀN DẦU, SHĐ NEO XE) — the same adjacent amount/SHĐ pairing used for PHÍ NÂNG/SHĐ NÂNG. NỘI DUNG, GHI CHÚ, and the trailing ID column SHALL remain the last columns in the file.

Each amount column SHALL be populated directly from the corresponding `TripPlan` amount field (`luongAmount`, `cuocAmount`, `doanhThuAmount`, `phuThuAmount`, `chiPhiAmount`, `tienDauAmount`, `neoXeAmount` respectively) — not from `TripPlanCost` rows. Each SHĐ column SHALL be populated directly from the corresponding `TripPlan` SHĐ field (`shdLuong`, `shdCuoc`, `shdDoanhThu`, `shdPhuThu`, `shdChiPhi`, `shdTienDau`, `shdNeoXe`). A `null` value SHALL render as a blank cell. The `*Name` fields (`luongName`, `cuocName`, etc.) are NOT exported to any column.

#### Scenario: Header row contains the TRẠNG THÁI column right after KHÁCH HÀNG

- **WHEN** the export file is opened
- **THEN** the header row contains KHÁCH HÀNG immediately followed by TRẠNG THÁI, then LOẠI HÌNH

#### Scenario: TRẠNG THÁI cell shows the Vietnamese status label

- **WHEN** a TripPlan has `status = "COMPLETED"`
- **THEN** the TRẠNG THÁI cell for that row displays "Hoàn thành"

#### Scenario: Header row contains the 7 new amount/SHĐ column pairs in the correct position

- **WHEN** the export file is opened
- **THEN** the header row contains LƯƠNG, SHĐ LƯƠNG, CƯỚC, SHĐ CƯỚC, DOANH THU, SHĐ DOANH THU, PHỤ THU, SHĐ PHỤ THU, CHI PHÍ, SHĐ CHI PHÍ, TIỀN DẦU, SHĐ TIỀN DẦU, NEO XE, SHĐ NEO XE, in that order, immediately after CẦU ĐƯỜNG and before NGÀY GỬI CT

#### Scenario: New column shows amount from the TripPlan field

- **WHEN** a TripPlan has `doanhThuAmount = 15000000`
- **THEN** the DOANH THU cell for that row displays `15000000`

#### Scenario: New SHĐ column shows the invoice number from the TripPlan field

- **WHEN** a TripPlan has `shdDoanhThu = "HD-050"`
- **THEN** the SHĐ DOANH THU cell for that row displays `HD-050`

#### Scenario: Null new-field value renders as a blank cell

- **WHEN** a TripPlan has `neoXeAmount = null` and `shdNeoXe = null`
- **THEN** the NEO XE cell and the SHĐ NEO XE cell for that row are both blank

#### Scenario: NỘI DUNG, GHI CHÚ, and ID remain the last columns

- **WHEN** the export file is opened
- **THEN** NỘI DUNG, GHI CHÚ, and ID are the final three columns, unaffected by the columns inserted earlier in the row

---

### Requirement: Exported columns have appropriate widths

The system SHALL set column widths on the export worksheet to accommodate the expected content, including the TRẠNG THÁI column and the 7 new amount/SHĐ column pairs. Vietnamese header text and typical data values SHALL be fully visible without manual column resizing.

#### Scenario: Column widths are explicitly set for the new columns

- **WHEN** the export file is opened in Excel
- **THEN** the TRẠNG THÁI, LƯƠNG, SHĐ LƯƠNG, CƯỚC, SHĐ CƯỚC, DOANH THU, SHĐ DOANH THU, PHỤ THU, SHĐ PHỤ THU, CHI PHÍ, SHĐ CHI PHÍ, TIỀN DẦU, SHĐ TIỀN DẦU, NEO XE, and SHĐ NEO XE columns have widths wider than the default (8.43 characters) so content is not truncated
