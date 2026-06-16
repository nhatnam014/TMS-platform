## MODIFIED Requirements

### Requirement: Create trip plan via modal form

The trip plans page SHALL provide a "Tạo chuyến" button that opens a modal form. On submit, the form SHALL call `POST /api/trip-plans` and refresh the list on success.

The modal SHALL be ~980px wide (capped at 95vw) and organized into four horizontal sections to minimize vertical scrolling:

**Section row 1 — three columns side by side:**

- **Chuyến đi** (left, wider): Trip date (required), Service type (required), License plate / Số xe (required, plain text input), Customer (required), Carrier (optional)
- **Container** (center): Container size (optional), Outbound container number (optional), Inbound container number (optional)
- **Địa điểm** (right): Pickup location (optional), Load/unload location (optional), Drop-off location (optional)

**Section row 2 — Chi phí (2×4 grid, full width):**
Eight fixed cost slots arranged in 2 columns × 4 rows. Each cell contains the cost slot label (display only) and a formatted amount text input; slots that support SHĐ additionally have an SHĐ text input. There are NO dropdown select inputs.

**Section row 3 — Bổ sung (single row, full width):**

- Document sent date (Ngày gửi CT), Description (Nội dung), Notes (Ghi chú) — all on one horizontal row.

The "Vehicle" field is a plain text input for the license plate (`vehiclePlate`). There is no combobox or dropdown for vehicle selection. The form SHALL NOT fetch `/api/vehicles`.

#### Scenario: Successful trip creation

- **WHEN** the user fills required fields (including vehiclePlate) and submits
- **THEN** `POST /api/trip-plans` is called with `vehiclePlate` in the body, the modal closes, and the list refreshes

#### Scenario: License plate field is a plain text input

- **WHEN** the user opens the create trip modal
- **THEN** the vehicle field is a plain text input labeled "Số xe" that accepts free-form text; there is no combobox or dropdown

#### Scenario: Form includes containerSize and description fields

- **WHEN** the user opens the create trip modal
- **THEN** fields for container size (SIZE CONT) and description (NỘI DUNG) are visible in the Container section

#### Scenario: Validation prevents empty required fields

- **WHEN** the user submits without filling required fields
- **THEN** the form shows inline validation errors and does not submit

#### Scenario: API error on create

- **WHEN** the API returns an error on submit
- **THEN** an error message is displayed inside the modal

---

### Requirement: Trip plan list displays license plate as plain text

The trip plans list table SHALL display `vehiclePlate` (plain string) in the vehicle column. There is no join to a Vehicle entity — the value is read directly from `TripPlan.vehiclePlate`.

#### Scenario: Vehicle column shows plate string

- **WHEN** a TripPlan has `vehiclePlate = "51D-12345"`
- **THEN** the table cell in the vehicle column displays "51D-12345"

#### Scenario: Vehicle column shows dash for null plate

- **WHEN** a TripPlan has `vehiclePlate = null`
- **THEN** the table cell displays "—"

---

### Requirement: Trip Plan API uses vehiclePlate instead of vehicleId

The `POST /api/trip-plans` and `PATCH /api/trip-plans/:id` endpoints SHALL accept `vehiclePlate` (string, optional) instead of `vehicleId` (FK). The `GET /api/trip-plans` filter parameter `vehicleId` is replaced by `vehiclePlate`. The system SHALL NOT validate `vehiclePlate` against any Vehicle entity.

#### Scenario: Create trip plan with vehiclePlate

- **WHEN** a client sends `POST /api/trip-plans` with `{ vehiclePlate: "51D-12345", ... }`
- **THEN** the TripPlan is created with `vehiclePlate = "51D-12345"` and HTTP 201 is returned

#### Scenario: Search by license plate

- **WHEN** a client sends `GET /api/trip-plans?search=51D-12345`
- **THEN** the results include TripPlans where `vehiclePlate` contains "51D-12345"
