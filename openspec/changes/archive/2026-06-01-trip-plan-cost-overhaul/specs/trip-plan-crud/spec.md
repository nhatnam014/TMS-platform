## MODIFIED Requirements

### Requirement: Create trip plan via modal form

The trip plans page SHALL provide a "Tạo chuyến" button that opens a modal form. On submit, the form SHALL call `POST /api/trip-plans` and refresh the list on success.

The form SHALL include:

- Trip date (required)
- Service type — select from `ServiceType` values (required)
- Vehicle — dropdown populated from `GET /api/vehicles` (required)
- Customer — dropdown populated from `GET /api/customers` (required)
- Carrier — dropdown populated from `GET /api/carriers` (optional)
- Container size — text input, e.g. "20GP", "40HC", "45HC" (optional) — maps to SIZE CONT column
- Outbound container number — text input (optional) — maps to CONT ĐI column
- Inbound container number — text input (optional) — maps to CONT VỀ column
- Pickup location — dropdown from `GET /api/locations` (optional)
- Load/unload location — dropdown from `GET /api/locations` (optional)
- Drop-off location — dropdown from `GET /api/locations` (optional)
- Description — text input (optional) — maps to NỘI DUNG column
- Notes — text input (optional) — maps to GHI CHÚ column

#### Scenario: Successful trip creation

- **WHEN** the user fills required fields and submits
- **THEN** `POST /api/trip-plans` is called, the modal closes, and the list refreshes

#### Scenario: Form includes containerSize and description fields

- **WHEN** the user opens the create trip modal
- **THEN** fields for container size (SIZE CONT) and description (NỘI DUNG) are visible

#### Scenario: Validation prevents empty required fields

- **WHEN** the user submits without filling required fields
- **THEN** the form shows inline validation errors and does not submit

#### Scenario: API error on create

- **WHEN** the API returns an error
- **THEN** the modal displays the error message and stays open

---

### Requirement: Add cost to a trip plan

Each trip row SHALL show an "+ Chi phí" button that opens a cost modal. On submit, the modal SHALL call `POST /api/trip-plans/:id/costs`. The button SHALL be available for trips in any non-CANCELLED status.

The cost form SHALL include:

- Cost type — select from TripCost catalog items fetched from `GET /api/trip-costs` (required)
- Amount — numeric (required, > 0)
- SHĐ / Invoice number — plain text input (optional)

#### Scenario: Add cost to trip

- **WHEN** user clicks "+ Chi phí" on a trip and submits a valid cost
- **THEN** `POST /api/trip-plans/:id/costs` is called with `{ tripCostId, amount, invoiceNumber? }` and the modal closes

#### Scenario: Cost type select is populated from catalog

- **WHEN** the cost modal opens
- **THEN** the cost type select element lists all TripCost catalog items from `GET /api/trip-costs`

#### Scenario: Cost form validates amount

- **WHEN** user submits with amount = 0 or empty
- **THEN** validation error is shown and form does not submit

---

### Requirement: List trip plans with filters and pagination

The `GET /trip-plans` endpoint SHALL accept an optional `search` query parameter in addition to all existing filter parameters.

#### Scenario: List with search parameter

- **WHEN** a client sends `GET /trip-plans?search=<term>`
- **THEN** the server SHALL apply an OR clause matching `search` against trip number (if integer), vehicle license plate, customer name, outbound container number, inbound container number, and notes
- **THEN** the response SHALL still return a `PaginatedResponse<TripPlanRow>` with `{ data, meta }` shape

#### Scenario: Backwards compatibility — no search param

- **WHEN** a client sends `GET /trip-plans` without a `search` param
- **THEN** the server SHALL behave identically to before this change (no regression)

#### Scenario: Search combined with all existing filters

- **WHEN** a client sends `GET /trip-plans?search=foo&status=PLANNED&customerId=<id>&page=2`
- **THEN** all filter conditions SHALL be applied together (AND logic)
- **THEN** the response `meta` SHALL reflect the filtered total count

## ADDED Requirements

### Requirement: Trip plan list view shows all 31 Excel columns with horizontal scroll

The trip plans list table SHALL display all columns matching the "kế hoạch xe" Excel template. The table container SHALL use `overflow-x: auto` so the full row is accessible by scrolling horizontally.

The columns SHALL be in this order: STT, NGÀY, SỐ XE, KHÁCH HÀNG, LOẠI HÌNH, ĐƠN VỊ, SIZE CONT, CONT ĐI, CONT VỀ, 20', 40', 45', Điểm Lấy, Điểm Đóng/Rút, Điểm Hạ, PHÍ NÂNG, SHĐ, PHÍ HẠ, SHĐ, PHÍ VỆ SINH, SHĐ, PHÍ CƯỢC, VÉ CỔNG, SHĐ, CHI PHÍ ĐỨT TEM, CHI PHÍ TRÁI TUYẾN, CẦU ĐƯỜNG, NGÀY GỬI CT, CHI PHÍ PHÁT SINH, NỘI DUNG, GHI CHÚ, Trạng thái, Thao tác.

The 20'/40'/45' columns SHALL display an "X" mark if `containerSize` starts with "20", "40", or "45" respectively; otherwise blank.

Cost columns (PHÍ NÂNG through CHI PHÍ PHÁT SINH) SHALL display the amount from the corresponding `TripPlanCost` row (matched by TripCost name), or blank if no such cost exists.

SHĐ columns SHALL display the `invoiceNumber` from the corresponding `TripPlanCost` row, or blank.

#### Scenario: All 31 Excel columns visible via horizontal scroll

- **WHEN** a user views the trip plans page
- **THEN** the table has columns matching the Excel template and the container scrolls horizontally

#### Scenario: 40' column shows X for 40HC container

- **WHEN** a trip plan has `containerSize = "40HC"`
- **THEN** the 40' column shows "X" and the 20' and 45' columns are blank

#### Scenario: Cost column shows amount from TripPlanCost

- **WHEN** a trip plan has a TripPlanCost row with costName "PHÍ NÂNG" and amount 1200000
- **THEN** the PHÍ NÂNG column displays "1,200,000"

### Requirement: TripPlan API accepts and returns containerSize and description

The `POST /api/v1/trip-plans` body SHALL accept optional `containerSize` (string) and `description` (string) fields. The `GET /api/v1/trip-plans` response SHALL include `containerSize`, `description`, `tripCostName`, and `tripCostAmount` in each TripPlan object.

#### Scenario: Create trip with containerSize

- **WHEN** `POST /api/v1/trip-plans` is called with `{ "containerSize": "40HC", ... }`
- **THEN** the created TripPlan has `containerSize = "40HC"`

#### Scenario: List response includes new fields

- **WHEN** `GET /api/v1/trip-plans` is called
- **THEN** each object in `data` includes `containerSize`, `description`, `tripCostName`, `tripCostAmount` (null if not set)

## REMOVED Requirements

### Requirement: Add cost to a completed trip

**Reason**: Cost entry is no longer restricted to COMPLETED trips and no longer uses CostType enum. Replaced by the "Add cost to a trip plan" requirement above which uses TripCost catalog selection.
**Migration**: Use the updated cost modal with TripCost catalog select on any non-cancelled trip.
