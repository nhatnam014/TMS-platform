## MODIFIED Requirements

### Requirement: Admin can bulk-import trip plans from Excel

The system SHALL provide `POST /api/v1/import/trip-plans` that accepts a multipart/form-data request with a field named `file` containing an `.xlsx` file. The endpoint MUST parse the "kế hoạch xe" sheet and insert TripPlan and TripPlanCost records. It SHALL auto-create missing reference entities for Customer, Carrier, and Vehicle. For service type and container size, it SHALL look up existing records by code and create new records if not found. Location data SHALL be stored as name strings directly on TripPlan (no FK). The endpoint returns `{ imported: number, warnings: string[], errors: string[] }` with HTTP 200 and SHALL be restricted to users with role ADMIN.

The column mapping remains the same as before with these behavioral changes:

- **Col 5: LOẠI HÌNH** → normalize to code (e.g. "SEA - EX" → "SEA-EX"), look up `service_types` by `code`. If found: use `serviceTypeId`. If not found: create new `service_types` record with `code` and `description = original cell value`, use the new `id` as `serviceTypeId`. Add warning if newly created.

- **Col 7: SIZE CONT** → normalize to code (e.g. "40HC"), look up `container_sizes` by `code`. If found: use `containerSizeId`. If not found: create new `container_sizes` record with `code` and `name = code`, use the new `id` as `containerSizeId`. Add warning if newly created.

- **Col 13: Điểm Lấy (R/H)** → stored as `pickupLocationName` string directly (no Location FK lookup or creation)
- **Col 14: Điểm (Đóng/Rút)** → stored as `loadUnloadLocationName` string directly
- **Col 15: Điểm hạ (R/H)** → stored as `dropoffLocationName` string directly

All cost columns continue to create `TripPlanCost` rows with `costName` set to the column label. No catalog lookup is performed for cost names.

#### Scenario: Valid upload returns import summary

- **WHEN** an admin uploads a valid "kế hoạch xe" Excel file
- **THEN** the API returns HTTP 200 with `{ imported: N, warnings: [...], errors: [...] }`

#### Scenario: Known service type code matched without creating new record

- **WHEN** a row has LOẠI HÌNH = "SEA - EX" and `service_types` already has `code = "SEA-EX"`
- **THEN** the TripPlan uses the existing `serviceTypeId` and no new `service_types` record is created

#### Scenario: Unknown service type code creates new service_types record

- **WHEN** a row has LOẠI HÌNH = "DOM - EX" and no `service_types` record with `code = "DOM-EX"` exists
- **THEN** a new `service_types` record is created with `code = "DOM-EX"` and a warning is added: "Tạo mới loại dịch vụ: DOM-EX"

#### Scenario: Known container size code matched without creating new record

- **WHEN** a row has SIZE CONT = "40HC" and `container_sizes` already has `code = "40HC"`
- **THEN** the TripPlan uses the existing `containerSizeId` and no new `container_sizes` record is created

#### Scenario: Unknown container size code creates new container_sizes record

- **WHEN** a row has SIZE CONT = "45GP" and no `container_sizes` record with `code = "45GP"` exists
- **THEN** a new `container_sizes` record is created with `code = "45GP"`, `name = "45GP"` and a warning is added: "Tạo mới size cont: 45GP"

#### Scenario: Location columns store name strings without FK lookup

- **WHEN** a row has Điểm Lấy = "Cảng Cát Lái"
- **THEN** `pickup_location_name = "Cảng Cát Lái"` is stored on TripPlan — no Location record is looked up or created

#### Scenario: Cost columns create TripPlanCost rows without catalog lookup

- **WHEN** a row has PHÍ NÂNG = 500000
- **THEN** a TripPlanCost row is created with `costName = "PHÍ NÂNG"`, `amount = 500000` — no cost template lookup

#### Scenario: Blank SIZE CONT cell results in null containerSizeId

- **WHEN** a row has an empty SIZE CONT cell
- **THEN** `container_size_id` is NULL on the created TripPlan row
