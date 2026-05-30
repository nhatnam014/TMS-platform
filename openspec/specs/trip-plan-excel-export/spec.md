### Requirement: Admin can export trip plans as a flat Excel file
The system SHALL provide `GET /api/v1/export/trip-plans` that accepts optional `from` and `to` query parameters (ISO date strings) and returns an `.xlsx` file with Vietnamese column headers matching the "kế hoạch xe" sheet column order. The response MUST include `Content-Disposition: attachment; filename="ke-hoach-xe.xlsx"` and `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`. The endpoint SHALL be restricted to users with role ADMIN.

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

### Requirement: Exported Excel matches the Vietnamese column header order
The system SHALL produce a worksheet with headers and column order matching the original "kế hoạch xe" template: STT, NGÀY, SỐ XE, RƠ MOÓC, KHÁCH HÀNG, NHÀ VẬN CHUYỂN, CONT 1 (SỐ CONT, LOẠI CONT, ĐÓNG/RÚT, NƠI LẤY CONT, NƠI ĐÓNG HÀNG, NƠI ĐỂ CONT, NƠI HẠ CONT), CONT 2 (same structure), TỔNG CƯỚC, GHI CHÚ. Phase 1 uses flat rows — no merged cells.

#### Scenario: Header row contains Vietnamese column names
- **WHEN** the export file is opened
- **THEN** row 1 contains the Vietnamese headers in the specified order

#### Scenario: Each data row maps to one TripPlan record
- **WHEN** the export contains 50 TripPlan records
- **THEN** the worksheet has 51 rows (1 header + 50 data)

### Requirement: Exported columns have appropriate widths
The system SHALL set column widths on the export worksheet to accommodate the expected content. Vietnamese header text and typical data values SHALL be fully visible without manual column resizing.

#### Scenario: Column widths are explicitly set
- **WHEN** the export file is opened in Excel
- **THEN** columns have widths wider than the default (8.43 characters) so content is not truncated

### Requirement: Export uses TripPlanService for query reuse
The system SHALL use `TripPlanService.findAll()` with `{ page: 1, limit: 10000 }` and the provided date range to fetch trip plans for export. The ExportModule MUST import TripPlanModule to access this service.

#### Scenario: ExportService receives TripPlan data via TripPlanService
- **WHEN** the export endpoint is called
- **THEN** ExportService calls TripPlanService.findAll with the date range parameters, not a raw Prisma query
