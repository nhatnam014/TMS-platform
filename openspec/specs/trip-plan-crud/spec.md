## MODIFIED Requirements

### Requirement: Create trip plan via modal form

The trip plans page SHALL provide a "Tạo chuyến" button that opens a modal form. On submit, the form SHALL call `POST /api/trip-plans` and refresh the list on success.

The modal SHALL be ~980px wide (capped at 95vw) and organized into four horizontal sections to minimize vertical scrolling:

**Section row 1 — three columns side by side:**

- **Chuyến đi** (left, wider): Trip date (required), Service type (required), Vehicle (required), Customer (required), Carrier (optional)
- **Container** (center): Container size (optional), Outbound container number (optional), Inbound container number (optional)
- **Địa điểm** (right): Pickup location (optional), Load/unload location (optional), Drop-off location (optional)

**Section row 2 — Chi phí (2×4 grid, full width):**
Eight cost slots arranged in 2 columns × 4 rows. Each cell contains the cost slot label, a select input (cost type), an amount input, and optionally an SHĐ input. Left-to-right pairing:

- Row 1: PHÍ NÂNG · PHÍ HẠ
- Row 2: PHÍ VỆ SINH · PHÍ CƯỢC
- Row 3: VÉ CỔNG · CHI PHÍ KHÁC / PHÍ ĐỨT TEM
- Row 4: TRÁI TUYẾN / CHỈ ĐỊNH / BP CAM · CẦU ĐƯỜNG

**Section row 3 — Bổ sung (single row, full width):**

- Document sent date (Ngày gửi CT), Description (Nội dung), Notes (Ghi chú) — all on one horizontal row.

All fields and submission behavior remain unchanged from the previous version.

#### Scenario: Successful trip creation

- **WHEN** the user fills required fields and submits
- **THEN** `POST /api/trip-plans` is called, the modal closes, and the list refreshes

#### Scenario: Form includes containerSize and description fields

- **WHEN** the user opens the create trip modal
- **THEN** fields for container size (SIZE CONT) and description (NỘI DUNG) are visible in the Container section

#### Scenario: Validation prevents empty required fields

- **WHEN** the user submits without filling required fields
- **THEN** the form shows inline validation errors and does not submit

#### Scenario: API error on create

- **WHEN** the API returns an error on submit
- **THEN** an error message is displayed inside the modal

#### Scenario: Form sections are side by side without horizontal scroll

- **WHEN** the user opens the create trip modal on a desktop viewport (≥ 980px)
- **THEN** Chuyến đi, Container, and Địa điểm sections are visible simultaneously in a single horizontal row without any horizontal scrollbar

#### Scenario: Cost slots visible without scrolling

- **WHEN** the user opens the create trip modal
- **THEN** all 8 cost slots are visible in the 2×4 grid without vertical scrolling past the bottom of the form

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
