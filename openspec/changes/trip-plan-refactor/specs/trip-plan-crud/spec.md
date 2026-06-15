## MODIFIED Requirements

### Requirement: Create trip plan via modal form

The trip plans page SHALL provide a "Tạo chuyến" button that opens a modal form. On submit, the form SHALL call `POST /api/trip-plans` and refresh the list on success.

The modal SHALL be ~980px wide (capped at 95vw) and organized into four horizontal sections to minimize vertical scrolling:

**Section row 1 — three columns side by side:**

- **Chuyến đi** (left, wider): Trip date (required), Service type (required, `<select>` from `GET /api/service-types`), Vehicle (required), Customer (required), Carrier (optional)
- **Container** (center): Container size (optional, `<select>` from `GET /api/container-sizes`), Outbound container number (optional), Inbound container number (optional)
- **Địa điểm** (right): Pickup location (optional, Combobox with live search from `GET /api/locations`, stores name string), Load/unload location (optional, same Combobox pattern), Drop-off location (optional, same Combobox pattern)

**Section row 2 — Chi phí (2×4 grid, full width):**
Eight fixed cost slots arranged in 2 columns × 4 rows. Each cell contains: a Combobox for the cost slot name (backed by `GET /api/cost-templates`, with live search and autofill-lock behavior) and a formatted amount text input (read-only when a template with defaultAmount is selected, editable otherwise). Slots that support SHĐ additionally have a plain SHĐ text input. Left-to-right pairing:

- Row 1: PHÍ NÂNG · PHÍ HẠ
- Row 2: PHÍ VỆ SINH · PHÍ CƯỢC
- Row 3: VÉ CỔNG · CHI PHÍ KHÁC / PHÍ ĐỨT TEM
- Row 4: TRÁI TUYẾN / CHỈ ĐỊNH / BP CAM · CẦU ĐƯỜNG

**Section row 3 — Chi phí phát sinh (full width, multi-row):**
Multiple-record section for "CHI PHÍ PHÁT SINH KHÁC (THANH LÝ - CHI HỘ)". Each record row contains: a Combobox for cost name (same pattern as fixed slots), an amount text input, an SHĐ text input, and a remove (×) button. A "+ Thêm chi phí" button appends a new empty row. There is no maximum row count.

**Section row 4 — Bổ sung (single row, full width):**

- Document sent date (Ngày gửi CT), Description (Nội dung), Notes (Ghi chú) — all on one horizontal row.

#### Scenario: Successful trip creation

- **WHEN** the user fills required fields and submits
- **THEN** `POST /api/trip-plans` is called, the modal closes, and the list refreshes

#### Scenario: Service type dropdown loads from API

- **WHEN** the user opens the create trip modal
- **THEN** the Service Type field is a `<select>` populated from `GET /api/service-types`

#### Scenario: Container size dropdown loads from API

- **WHEN** the user opens the create trip modal
- **THEN** the Container Size field is a `<select>` populated from `GET /api/container-sizes` with a "— Không chọn —" default option

#### Scenario: Location field shows combobox with live search

- **WHEN** the user clicks the Pickup Location field
- **THEN** a dropdown appears with all active locations; typing narrows the list; selecting stores the location name string

#### Scenario: Validation prevents empty required fields

- **WHEN** the user submits without filling required fields
- **THEN** the form shows inline validation errors and does not submit

#### Scenario: API error on create

- **WHEN** the API returns an error on submit
- **THEN** an error message is displayed inside the modal

#### Scenario: Form sections are side by side without horizontal scroll

- **WHEN** the user opens the create trip modal on a desktop viewport (≥ 980px)
- **THEN** Chuyến đi, Container, and Địa điểm sections are visible simultaneously in a single horizontal row without any horizontal scrollbar

#### Scenario: Chi phí phát sinh section allows multiple rows

- **WHEN** the user clicks "+ Thêm chi phí" twice
- **THEN** two additional cost rows appear, each with a name combobox, amount input, SHĐ input, and remove button

#### Scenario: Removing a chi phí phát sinh row

- **WHEN** the user clicks × on a chi phí phát sinh row
- **THEN** that row is removed from the form

---

### Requirement: List trip plans with filters and pagination

The `GET /trip-plans` endpoint SHALL accept an optional `search` query parameter in addition to all existing filter parameters. The `serviceType` filter parameter SHALL now accept a service type `code` string (e.g. "SEA-EX") instead of the previous Prisma enum value.

#### Scenario: List with search parameter

- **WHEN** a client sends `GET /trip-plans?search=<term>`
- **THEN** the server SHALL apply an OR clause matching against trip number, vehicle license plate, customer name, container numbers, and notes

#### Scenario: Backwards compatibility — no search param

- **WHEN** a client sends `GET /trip-plans` without a `search` param
- **THEN** the server returns results normally

#### Scenario: Filter by service type code

- **WHEN** a client sends `GET /trip-plans?serviceTypeCode=SEA-EX`
- **THEN** only trip plans with a service type whose `code = "SEA-EX"` are returned

---

### Requirement: Trip plan list view shows columns without 20'/40'/45' tick columns

The trip plans list table SHALL display columns in this order: STT, NGÀY, SỐ XE, KHÁCH HÀNG, LOẠI HÌNH, ĐƠN VỊ, SIZE CONT, CONT ĐI, CONT VỀ, Điểm Lấy, Điểm Đóng/Rút, Điểm Hạ, PHÍ NÂNG, SHĐ, PHÍ HẠ, SHĐ, PHÍ VỆ SINH, SHĐ, PHÍ CƯỢC, VÉ CỔNG, SHĐ, CHI PHÍ ĐỨT TEM, CHI PHÍ TRÁI TUYẾN, CẦU ĐƯỜNG, NGÀY GỬI CT, NỘI DUNG, GHI CHÚ, Trạng thái, Thao tác. The table container SHALL use `overflow-x: auto`.

The **20', 40', 45' tick columns SHALL NOT be present** in the table.

The LOẠI HÌNH column SHALL display the `code` (e.g. "SEA-EX") or `description` from the joined `service_types` record. The SIZE CONT column SHALL display the `code` from the joined `container_sizes` record (or blank if null). The three location columns SHALL display the stored name strings.

#### Scenario: Table has no 20' 40' 45' columns

- **WHEN** a user views the trip plans list
- **THEN** no columns named 20', 40', or 45' are present in the table header

#### Scenario: LOẠI HÌNH column shows service type code

- **WHEN** a trip plan has a service type with code "SEA-EX"
- **THEN** the LOẠI HÌNH column shows "SEA-EX" (or its description)

#### Scenario: SIZE CONT column shows code from container_sizes

- **WHEN** a trip plan has containerSizeId referencing the "40HC" record
- **THEN** the SIZE CONT column shows "40HC"

#### Scenario: Location columns show name strings

- **WHEN** a trip plan has `pickupLocationName = "Cát Lái"`
- **THEN** the Điểm Lấy column shows "Cát Lái"

---

## REMOVED Requirements

### Requirement: Trip plan list view shows all 31 Excel columns with horizontal scroll

**Reason**: Replaced by the updated column list above which removes the 20'/40'/45' tick columns and updates location/service-type/container-size display.
**Migration**: The table now renders without 20'/40'/45' columns. The column order is updated per the MODIFIED requirement above.
