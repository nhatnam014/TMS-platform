## MODIFIED Requirements

### Requirement: Trip plan list view shows all Excel columns with horizontal scroll

The trip plans list table SHALL display all columns matching the "kế hoạch xe" Excel template, including the 7 new revenue/cost amount columns and their 7 SHĐ companions added by this change. The table container SHALL use `overflow-x: auto` so the full row is accessible by scrolling horizontally.

The columns SHALL be in this order: STT, NGÀY, SỐ XE, KHÁCH HÀNG, LOẠI HÌNH, ĐƠN VỊ, SIZE CONT, CONT ĐI, CONT VỀ, Điểm Lấy, Điểm Đóng/Rút, Điểm Hạ, PHÍ NÂNG, SHĐ, PHÍ HẠ, SHĐ, PHÍ VỆ SINH, SHĐ, PHÍ CƯỢC, VÉ CỔNG, SHĐ, CHI PHÍ ĐỨT TEM, CHI PHÍ TRÁI TUYẾN, CẦU ĐƯỜNG, **LƯƠNG, SHĐ, CƯỚC, SHĐ, DOANH THU, SHĐ, PHỤ THU, SHĐ, CHI PHÍ, SHĐ, TIỀN DẦU, SHĐ, NEO XE, SHĐ**, NGÀY GỬI CT, CHI PHÍ PHÁT SINH, NỘI DUNG, GHI CHÚ, Trạng thái, Thao tác.

The 7 new amount columns SHALL be positioned immediately after CẦU ĐƯỜNG and before NGÀY GỬI CT, matching the Excel export column order; each SHALL be immediately followed by its own SHĐ column, matching how the 4 existing SHĐ-bearing slots are laid out. Each amount column SHALL display the formatted amount from the corresponding `TripPlan` field (`luongAmount`, `cuocAmount`, `doanhThuAmount`, `phuThuAmount`, `chiPhiAmount`, `tienDauAmount`, `neoXeAmount`), or blank if null; each SHĐ column SHALL display the corresponding `shd*` field (`shdLuong`, `shdCuoc`, `shdDoanhThu`, `shdPhuThu`, `shdChiPhi`, `shdTienDau`, `shdNeoXe`), or blank if null. The existing "Trạng thái" column's position (near the end, before "Thao tác") is unchanged by this change.

#### Scenario: All columns including the 7 new amount and SHĐ columns are visible via horizontal scroll

- **WHEN** a user views the trip plans page and scrolls horizontally
- **THEN** the table shows LƯƠNG, SHĐ, CƯỚC, SHĐ, DOANH THU, SHĐ, PHỤ THU, SHĐ, CHI PHÍ, SHĐ, TIỀN DẦU, SHĐ, NEO XE, SHĐ columns, in that order, immediately after CẦU ĐƯỜNG and before NGÀY GỬI CT

#### Scenario: New column shows amount from the TripPlan field

- **WHEN** a trip plan has `phuThuAmount = 500000`
- **THEN** the PHỤ THU column displays the formatted amount `500,000`

#### Scenario: New SHĐ column shows the invoice number from the TripPlan field

- **WHEN** a trip plan has `shdPhuThu = "HD-045"`
- **THEN** the SHĐ column immediately following PHỤ THU displays `HD-045`

#### Scenario: Null new field renders blank

- **WHEN** a trip plan has `chiPhiAmount = null` and `shdChiPhi = null`
- **THEN** the CHI PHÍ column and its SHĐ column are both blank for that row

---

### Requirement: TripPlan API accepts and returns containerSize and description

The `POST /api/v1/trip-plans` body SHALL accept optional `containerSize` (string), `description` (string), the 7 new revenue/cost amount fields (`luongAmount`, `cuocAmount`, `doanhThuAmount`, `phuThuAmount`, `chiPhiAmount`, `tienDauAmount`, `neoXeAmount`, all optional numbers), their 7 name companions (`luongName`, `cuocName`, `doanhThuName`, `phuThuName`, `chiPhiName`, `tienDauName`, `neoXeName`, all optional strings), and their 7 SHĐ companions (`shdLuong`, `shdCuoc`, `shdDoanhThu`, `shdPhuThu`, `shdChiPhi`, `shdTienDau`, `shdNeoXe`, all optional strings). The `GET /api/v1/trip-plans` response SHALL include `containerSize`, `description`, `tripCostName`, `tripCostAmount`, and all 21 new amount/name/SHĐ fields in each TripPlan object.

#### Scenario: Create trip with containerSize

- **WHEN** `POST /api/v1/trip-plans` is called with `{ "containerSize": "40HC", ... }`
- **THEN** the created TripPlan has `containerSize = "40HC"`

#### Scenario: List response includes the 7 new amount, name, and SHĐ fields

- **WHEN** `GET /api/v1/trip-plans` is called
- **THEN** each object in `data` includes `luongAmount`, `cuocAmount`, `doanhThuAmount`, `phuThuAmount`, `chiPhiAmount`, `tienDauAmount`, `neoXeAmount`, `luongName`, `cuocName`, `doanhThuName`, `phuThuName`, `chiPhiName`, `tienDauName`, `neoXeName`, `shdLuong`, `shdCuoc`, `shdDoanhThu`, `shdPhuThu`, `shdChiPhi`, `shdTienDau`, `shdNeoXe` (null if not set), alongside `containerSize`, `description`, `tripCostName`, `tripCostAmount`

#### Scenario: List table does not display a separate name column

- **WHEN** the trip plans list page renders the LƯƠNG/CƯỚC/DOANH THU/PHỤ THU/CHI PHÍ/TIỀN DẦU/NEO XE columns
- **THEN** each column shows only the formatted amount (and its adjacent SHĐ column shows the invoice number), same as the 8 existing fixed-slot columns which also don't surface their `*Name` value in the list table

---

### Requirement: Trip plan list view allows changing status inline via a select

The "Trạng thái" column in the trip plans list table SHALL render an interactive `<select>` (not a read-only badge) populated with all `TripStatus` values, pre-selected to the row's current status. Changing the selection SHALL call `PATCH /api/v1/trip-plans/:id/status` with the new status and update the row immediately (optimistic update), without requiring the user to open the edit modal. If the request fails, the row SHALL revert to its previous status and an error SHALL be shown.

#### Scenario: Changing the select updates the trip's status

- **WHEN** a user selects "Hoàn thành" from the Trạng thái select on a row currently showing "Kế hoạch"
- **THEN** `PATCH /api/v1/trip-plans/:id/status` is called with `{ status: "COMPLETED" }`, and on success the row's badge/select updates to "Hoàn thành" without a full page reload

#### Scenario: Failed status update reverts the row

- **WHEN** the status update request fails (e.g. network error or non-2xx response)
- **THEN** the select reverts to the trip's previous status and an error toast is shown

#### Scenario: Select styling matches the existing status badge

- **WHEN** a user views the Trạng thái column
- **THEN** the select is colored per-status the same way the previous read-only badge was (background/text color from `STATUS_COLORS`), so the visual design is unchanged aside from being interactive
