## MODIFIED Requirements

### Requirement: Any authenticated user can bulk-import trip plans from Excel

The system SHALL provide `POST /api/v1/import/trip-plans` that accepts a multipart/form-data request with a field named `file` containing an `.xlsx` file. The endpoint MUST parse the "kế hoạch xe" sheet using the actual 31-column template header structure, insert TripPlan and TripPlanCost records, auto-create missing reference entities (Customer, Carrier, Location, Vehicle), and return `{ imported: number, warnings: string[], errors: string[] }` with HTTP 200. Container records are NOT created during import. The endpoint MUST require a valid authenticated session (`JwtAuthGuard`) but MUST NOT restrict by role.

For each cost column with a non-zero value, the importer MUST create a `TripPlanCost` row with `costName` set directly to the cost column's label (e.g. "PHÍ NÂNG"). The endpoint MUST NOT look up or create any `TripCost` catalog entries. No warnings SHALL be emitted for cost names that are not in any catalog (the catalog no longer exists).

The parser MUST map columns by their actual Vietnamese header names as they appear in the template:

- Col 1: STT → `tripNumber`
- Col 2: NGÀY → `tripDate`
- Col 3: SỐ XE → vehicle license plate
- Col 4: KHÁCH HÀNG → customer name
- Col 5: LOẠI HÌNH → `serviceType` (map: "SEA - EX" → SEA_EXPORT, "SEA - IM" → SEA_IMPORT, "NEO - EX" → NEO_EXPORT, "NEO - IM" → NEO_IMPORT)
- Col 6: ĐƠN VỊ → carrier name
- Col 7: SIZE CONT → `containerSize`
- Col 8: CONT ĐI → `outboundContainerNumber`
- Col 9: CONT VỀ → `inboundContainerNumber`
- Col 13: Điểm Lấy (R/H) → `pickupLocation`
- Col 14: Điểm (Đóng/Rút) → `loadUnloadLocation`
- Col 15: Điểm hạ (R/H) → `dropoffLocation`
- Col 16: PHÍ NÂNG → `costName: "PHÍ NÂNG"`, amount
- Col 17: SHĐ NÂNG → invoiceNumber for PHÍ NÂNG cost
- Col 18: PHÍ HẠ → `costName: "PHÍ HẠ"`, amount
- Col 19: SHĐ HẠ → invoiceNumber for PHÍ HẠ cost
- Col 20: PHÍ VỆ SINH → `costName: "PHÍ VỆ SINH"`, amount
- Col 21: SHĐ → invoiceNumber for PHÍ VỆ SINH cost
- Col 22: PHÍ CƯỢC → `costName: "PHÍ CƯỢC"`, amount
- Col 23: VÉ CỔNG → `costName: "VÉ CỔNG"`, amount
- Col 24: SHĐ → invoiceNumber for VÉ CỔNG cost
- Col 25: CHI PHÍ KHÁC / PHÍ ĐỨT TEM → `costName: "PHÍ ĐỨT TEM"`, amount
- Col 26: CHI PHÍ TRÁI TUYẾN / CHỈ ĐỊNH / BP CAM → `costName: "CHI PHÍ TRÁI TUYẾN"`, amount
- Col 27: CẦU ĐƯỜNG → `costName: "CẦU ĐƯỜNG"`, amount
- Col 28: NGÀY GỬI CT → `documentSentDate`
- Col 29: CHI PHÍ PHÁT SINH KHÁC: THANH LÝ - CHI HỘ → `costName: "CHI PHÍ PHÁT SINH KHÁC"`, amount
- Col 30: NỘI DUNG → `description`
- Col 31: GHI CHÚ → `notes`

#### Scenario: Valid upload returns import summary

- **WHEN** an authenticated user uploads a valid "kế hoạch xe" Excel file
- **THEN** the API returns HTTP 200 with `{ imported: N, warnings: [...], errors: [...] }` where `imported` counts TripPlan rows inserted

#### Scenario: serviceType is parsed from LOẠI HÌNH column

- **WHEN** a row has LOẠI HÌNH = "SEA - EX"
- **THEN** the created TripPlan has `serviceType = "SEA_EXPORT"`

#### Scenario: serviceType defaults when LOẠI HÌNH is unrecognized

- **WHEN** a row has an unrecognized LOẠI HÌNH value
- **THEN** a warning is added and the row is imported with `serviceType = "SEA_EXPORT"` as default

#### Scenario: containerSize is parsed from SIZE CONT column

- **WHEN** a row has SIZE CONT = "40HC"
- **THEN** the created TripPlan has `containerSize = "40HC"`

#### Scenario: description is parsed from NỘI DUNG column

- **WHEN** a row has NỘI DUNG = "Hàng đặc biệt"
- **THEN** the created TripPlan has `description = "Hàng đặc biệt"`

#### Scenario: Cost columns create TripPlanCost rows without catalog lookup

- **WHEN** an authenticated user uploads a valid "kế hoạch xe" Excel file with PHÍ NÂNG = 500000 and SHĐ NÂNG = "HD001"
- **THEN** a TripPlanCost row is created with `costName = "PHÍ NÂNG"`, `amount = 500000`, `invoiceNumber = "HD001"` — no TripCost row is created or looked up

#### Scenario: No "Chi phí mới tự tạo" warnings in import result

- **WHEN** an authenticated user imports a file with cost column values
- **THEN** the `warnings` array does NOT contain any "Chi phí mới tự tạo" messages

#### Scenario: Zero or blank cost columns are skipped

- **WHEN** a row has an empty or zero value in a cost column
- **THEN** no TripPlanCost row is created for that cost type

#### Scenario: TripPlanCost rows have no tripCostId

- **WHEN** the import creates TripPlanCost rows
- **THEN** those rows have `costName` set and `tripCostId` does not exist on the model (column was dropped)

#### Scenario: Non-ADMIN authenticated role is not rejected

- **WHEN** a user authenticated with a role other than ADMIN uploads a file to `POST /api/v1/import/trip-plans`
- **THEN** the request is processed normally (HTTP 200), not rejected with HTTP 403

#### Scenario: Unauthenticated request is rejected

- **WHEN** a request with no valid JWT is made to `POST /api/v1/import/trip-plans`
- **THEN** the API returns HTTP 401
