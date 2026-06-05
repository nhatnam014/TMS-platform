## MODIFIED Requirements

### Requirement: Admin can bulk-import trip plans from Excel

The system SHALL provide `POST /api/v1/import/trip-plans` that accepts a multipart/form-data request with a field named `file` containing an `.xlsx` file. The endpoint MUST parse the "kế hoạch xe" sheet using the actual 31-column template header structure, insert TripPlan and TripPlanCost records, auto-create missing reference entities (Customer, Carrier, Location, Vehicle), and return `{ imported: number, warnings: string[], errors: string[] }` with HTTP 200. Container records are NOT created during import. The endpoint SHALL be restricted to users with role ADMIN.

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
- Col 16: PHÍ NÂNG → cost amount for TripCost named "PHÍ NÂNG"
- Col 17: SHĐ NÂNG → invoiceNumber for PHÍ NÂNG cost
- Col 18: PHÍ HẠ → cost amount for TripCost named "PHÍ HẠ"
- Col 19: SHĐ HẠ → invoiceNumber for PHÍ HẠ cost
- Col 20: PHÍ VỆ SINH → cost amount for TripCost named "PHÍ VỆ SINH"
- Col 21: SHĐ → invoiceNumber for PHÍ VỆ SINH cost
- Col 22: PHÍ CƯỢC → cost amount for TripCost named "PHÍ CƯỢC"
- Col 23: VÉ CỔNG → cost amount for TripCost named "VÉ CỔNG"
- Col 24: SHĐ → invoiceNumber for VÉ CỔNG cost
- Col 25: CHI PHÍ KHÁC / PHÍ ĐỨT TEM → cost amount for TripCost named "PHÍ ĐỨT TEM"
- Col 26: CHI PHÍ TRÁI TUYẾN / CHỈ ĐỊNH / BP CAM → cost amount for TripCost named "CHI PHÍ TRÁI TUYẾN"
- Col 27: CẦU ĐƯỜNG → cost amount for TripCost named "CẦU ĐƯỜNG"
- Col 28: NGÀY GỬI CT → `documentSentDate`
- Col 29: CHI PHÍ PHÁT SINH KHÁC: THANH LÝ - CHI HỘ → cost amount for TripCost named "CHI PHÍ PHÁT SINH KHÁC"
- Col 30: NỘI DUNG → `description`
- Col 31: GHI CHÚ → `notes`

For each cost column that has a non-zero value, the importer MUST find or create a TripCost catalog item by that name and create a TripPlanCost row.

#### Scenario: Valid upload returns import summary

- **WHEN** an admin uploads a valid "kế hoạch xe" Excel file
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

#### Scenario: Cost columns create TripPlanCost rows

- **WHEN** a row has PHÍ NÂNG = 500000 and SHĐ NÂNG = "HD001"
- **THEN** a TripPlanCost row is created with the TripCost named "PHÍ NÂNG", amount 500000, invoiceNumber "HD001"

#### Scenario: Zero or blank cost columns are skipped

- **WHEN** a row has an empty or zero value in a cost column
- **THEN** no TripPlanCost row is created for that cost type

#### Scenario: TripCost catalog item auto-created if not found

- **WHEN** a cost column has a value but no TripCost with that name exists
- **THEN** a new TripCost catalog item is created with that name and a warning is added

#### Scenario: Non-admin role is rejected

- **WHEN** a user without ADMIN role uploads a file to `POST /api/v1/import/trip-plans`
- **THEN** the API returns HTTP 403

## REMOVED Requirements

### Requirement: Container size is normalized from Excel strings to Prisma enum

**Reason**: Container size is now stored as a plain string on TripPlan (`containerSize` field). No enum or normalization is needed.
**Migration**: Read SIZE CONT column (col 7) as a plain string and assign to `TripPlan.containerSize`.
