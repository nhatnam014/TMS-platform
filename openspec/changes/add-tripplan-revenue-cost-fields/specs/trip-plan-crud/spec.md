## MODIFIED Requirements

### Requirement: Trip plan list view shows all 31 Excel columns with horizontal scroll

The trip plans list table SHALL display all columns matching the "kế hoạch xe" Excel template, including the 7 new revenue/cost columns added by this change. The table container SHALL use `overflow-x: auto` so the full row is accessible by scrolling horizontally.

The columns SHALL be in this order: STT, NGÀY, SỐ XE, KHÁCH HÀNG, LOẠI HÌNH, ĐƠN VỊ, SIZE CONT, CONT ĐI, CONT VỀ, Điểm Lấy, Điểm Đóng/Rút, Điểm Hạ, PHÍ NÂNG, SHĐ, PHÍ HẠ, SHĐ, PHÍ VỆ SINH, SHĐ, PHÍ CƯỢC, VÉ CỔNG, SHĐ, CHI PHÍ ĐỨT TEM, CHI PHÍ TRÁI TUYẾN, CẦU ĐƯỜNG, **LƯƠNG, CƯỚC, DOANH THU, PHỤ THU, CHI PHÍ, TIỀN DẦU, NEO XE**, NGÀY GỬI CT, CHI PHÍ PHÁT SINH, NỘI DUNG, GHI CHÚ, Trạng thái, Thao tác.

The 7 new columns SHALL be positioned immediately after CẦU ĐƯỜNG and before NGÀY GỬI CT, matching the Excel export column order. Each SHALL display the formatted amount from the corresponding `TripPlan` field (`luongAmount`, `cuocAmount`, `doanhThuAmount`, `phuThuAmount`, `chiPhiAmount`, `tienDauAmount`, `neoXeAmount`), or blank if null.

#### Scenario: All columns including the 7 new ones are visible via horizontal scroll

- **WHEN** a user views the trip plans page and scrolls horizontally
- **THEN** the table shows LƯƠNG, CƯỚC, DOANH THU, PHỤ THU, CHI PHÍ, TIỀN DẦU, NEO XE columns, in that order, immediately after CẦU ĐƯỜNG and before NGÀY GỬI CT

#### Scenario: New column shows amount from the TripPlan field

- **WHEN** a trip plan has `phuThuAmount = 500000`
- **THEN** the PHỤ THU column displays the formatted amount `500,000`

#### Scenario: Null new field renders blank

- **WHEN** a trip plan has `chiPhiAmount = null`
- **THEN** the CHI PHÍ column is blank for that row

---

### Requirement: TripPlan API accepts and returns containerSize and description

The `POST /api/v1/trip-plans` body SHALL accept optional `containerSize` (string), `description` (string), and the 7 new revenue/cost fields (`luongAmount`, `cuocAmount`, `doanhThuAmount`, `phuThuAmount`, `chiPhiAmount`, `tienDauAmount`, `neoXeAmount`, all optional numbers). The `GET /api/v1/trip-plans` response SHALL include `containerSize`, `description`, `tripCostName`, `tripCostAmount`, and the 7 new fields in each TripPlan object.

#### Scenario: Create trip with containerSize

- **WHEN** `POST /api/v1/trip-plans` is called with `{ "containerSize": "40HC", ... }`
- **THEN** the created TripPlan has `containerSize = "40HC"`

#### Scenario: List response includes the 7 new fields

- **WHEN** `GET /api/v1/trip-plans` is called
- **THEN** each object in `data` includes `luongAmount`, `cuocAmount`, `doanhThuAmount`, `phuThuAmount`, `chiPhiAmount`, `tienDauAmount`, `neoXeAmount` (null if not set), alongside `containerSize`, `description`, `tripCostName`, `tripCostAmount`
