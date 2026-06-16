## MODIFIED Requirements

### Requirement: Admin can bulk-import trip plans from Excel

The system SHALL provide `POST /api/v1/import/trip-plans` that accepts a multipart/form-data request with a field named `file` containing an `.xlsx` file. The endpoint MUST parse the "kế hoạch xe" sheet using the actual 31-column template header structure, insert TripPlan and TripPlanCost records, auto-create missing reference entities (Customer, Carrier), and return `{ imported: number, warnings: string[], errors: string[] }` with HTTP 200. Container records are NOT created during import. The endpoint SHALL be restricted to users with role ADMIN.

The vehicle license plate from the SỐ XE column (Col 3) SHALL be stored directly as `TripPlan.vehiclePlate`. The system SHALL NOT look up, create, or update any Vehicle entity during trip plan import.

For each cost column with a non-zero value, the importer MUST create a `TripPlanCost` row with `costName` set directly to the cost column's label. The endpoint MUST NOT look up or create any `TripCost` catalog entries.

The parser MUST map columns by their actual Vietnamese header names as they appear in the template:

- Col 1: STT → `tripNumber`
- Col 2: NGÀY → `tripDate`
- Col 3: SỐ XE → `vehiclePlate` (stored as plain string, no Vehicle lookup)
- Col 4: KHÁCH HÀNG → customer name (auto-create if not found)
- Col 5: LOẠI HÌNH → `serviceType`
- Col 6: ĐƠN VỊ → carrier name (auto-create if not found)
- Col 7: SIZE CONT → `containerSize`
- Col 8: CONT ĐI → `outboundContainerNumber`
- Col 9: CONT VỀ → `inboundContainerNumber`
- Col 13: Điểm Lấy (R/H) → `pickupLocation`
- Col 14: Điểm (Đóng/Rút) → `loadUnloadLocation`
- Col 15: Điểm hạ (R/H) → `dropoffLocation`
- Col 16–27: cost columns → TripPlanCost rows
- Col 28: NGÀY GỬI CT → `documentSentDate`
- Col 30: NỘI DUNG → `description`
- Col 31: GHI CHÚ → `notes`

#### Scenario: Valid upload returns import summary

- **WHEN** an admin uploads a valid "kế hoạch xe" Excel file
- **THEN** the API returns HTTP 200 with `{ imported: N, warnings: [...], errors: [...] }` where `imported` counts TripPlan rows inserted

#### Scenario: Vehicle plate stored directly without Vehicle lookup

- **WHEN** a row has SỐ XE = "51D-12345"
- **THEN** the created TripPlan has `vehiclePlate = "51D-12345"` and no Vehicle entity is created or queried

#### Scenario: serviceType is parsed from LOẠI HÌNH column

- **WHEN** a row has LOẠI HÌNH = "SEA - EX"
- **THEN** the created TripPlan has `serviceType = "SEA-EX"`

#### Scenario: Missing vehicle plate is imported with null vehiclePlate

- **WHEN** a row has an empty SỐ XE cell
- **THEN** the TripPlan is created with `vehiclePlate = null` and no error is added
