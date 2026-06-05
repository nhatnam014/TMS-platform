## MODIFIED Requirements

### Requirement: Admin can export trip plans as a flat Excel file

The system SHALL provide `GET /api/v1/export/trip-plans` that accepts optional `from` and `to` query parameters (ISO date strings) and returns an `.xlsx` file with Vietnamese column headers matching the actual "kế hoạch xe" sheet column order. The response MUST include `Content-Disposition: attachment; filename="ke-hoach-xe.xlsx"` and `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`. The endpoint SHALL be restricted to users with role ADMIN.

#### Scenario: Export with date range filters rows

- **WHEN** an admin requests `GET /api/v1/export/trip-plans?from=2026-01-01&to=2026-01-31`
- **THEN** the response is an `.xlsx` file containing only TripPlan rows with `tripDate` within January 2026

#### Scenario: Export without date range returns all rows (up to 10 000)

- **WHEN** an admin requests `GET /api/v1/export/trip-plans` without query parameters
- **THEN** the response is an `.xlsx` file containing all TripPlan rows (maximum 10 000)

#### Scenario: Non-admin role is rejected

- **WHEN** a user without ADMIN role calls `GET /api/v1/export/trip-plans`
- **THEN** the API returns HTTP 403

#### Scenario: Response triggers browser file download

- **WHEN** the frontend opens the export URL
- **THEN** the browser receives `Content-Disposition: attachment; filename="ke-hoach-xe.xlsx"` and saves the file

---

### Requirement: Exported Excel matches the actual 31-column template layout

The system SHALL produce a worksheet named "kế hoạch xe" with the following column headers in order, matching the customer's template exactly:

STT, NGÀY, SỐ XE, KHÁCH HÀNG, LOẠI HÌNH, ĐƠN VỊ, SIZE CONT, CONT ĐI, CONT VỀ, 20', 40', 45', Điểm Lấy (R/H), Điểm (Đóng/Rút), Điểm hạ (R/H), PHÍ NÂNG, SHĐ NÂNG, PHÍ HẠ, SHĐ HẠ, PHÍ VỆ SINH, SHĐ, PHÍ CƯỢC, VÉ CỔNG, SHĐ, CHI PHÍ KHÁC/PHÍ ĐỨT TEM, CHI PHÍ TRÁI TUYẾN/CHỈ ĐỊNH/BP CAM, CẦU ĐƯỜNG, NGÀY GỬI CT, CHI PHÍ PHÁT SINH KHÁC, NỘI DUNG, GHI CHÚ.

Cost columns SHALL be populated from `TripPlanCost` rows, matched by the TripCost catalog item's name. If no TripPlanCost row exists for a given cost name, the cell is blank.

SHĐ columns SHALL be populated from the `invoiceNumber` field of the corresponding TripPlanCost row.

The 20'/40'/45' columns SHALL contain "X" if `containerSize` starts with "20", "40", or "45" respectively; otherwise blank.

#### Scenario: Header row contains the 31 Vietnamese column names

- **WHEN** the export file is opened
- **THEN** row 1 contains the 31 headers in the specified order

#### Scenario: SIZE CONT column is populated

- **WHEN** a TripPlan has `containerSize = "40HC"`
- **THEN** the SIZE CONT cell contains "40HC" and the 40' cell contains "X"

#### Scenario: Cost column shows amount from TripPlanCost

- **WHEN** a TripPlan has a TripPlanCost with costName "PHÍ NÂNG" and amount 1200000
- **THEN** the PHÍ NÂNG cell displays 1200000

#### Scenario: Missing cost cell is blank

- **WHEN** a TripPlan has no TripPlanCost for "PHÍ HẠ"
- **THEN** the PHÍ HẠ cell is empty

#### Scenario: Each data row maps to one TripPlan record

- **WHEN** the export contains 50 TripPlan records
- **THEN** the worksheet has 51 rows (1 header + 50 data)

---

### Requirement: Exported columns have appropriate widths

The system SHALL set column widths on the export worksheet to accommodate the expected content. Vietnamese header text and typical data values SHALL be fully visible without manual column resizing.

#### Scenario: Column widths are explicitly set

- **WHEN** the export file is opened in Excel
- **THEN** columns have widths wider than the default (8.43 characters) so content is not truncated

---

### Requirement: Export uses TripPlanService for query reuse

The system SHALL use `TripPlanService.findAll()` with `{ page: 1, limit: 10000 }` and the provided date range to fetch trip plans for export. The response MUST include each TripPlan's `costs` array (TripPlanCost rows with TripCost name) so the builder can populate cost columns.

#### Scenario: ExportService receives TripPlan data via TripPlanService

- **WHEN** the export endpoint is called
- **THEN** ExportService calls TripPlanService.findAll with the date range parameters, not a raw Prisma query
