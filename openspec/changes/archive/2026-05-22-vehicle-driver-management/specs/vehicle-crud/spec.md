## ADDED Requirements

### Requirement: Create vehicle
The API SHALL expose `POST /vehicles` to register a new vehicle. The body SHALL include `licensePlate` (unique, required), `vehicleType` (required, one of `SHACMAN | CHENGLONG | HOWO | FREIGHTLINER | FAW | OTHER`), and optional `inspectionExpiry`, `insuranceExpiry`, `registrationExpiry`, `notes`. New vehicles are created with `status: WAITING_DRIVER`. The action SHALL be audit-logged.

#### Scenario: Successful create
- **WHEN** an authenticated user sends `POST /vehicles` with valid `licensePlate` and `vehicleType`
- **THEN** the response is `201 Created` with the new vehicle record including `id`, `licensePlate`, `vehicleType`, `status: "WAITING_DRIVER"`

#### Scenario: Duplicate license plate rejected
- **WHEN** an authenticated user sends `POST /vehicles` with a `licensePlate` that already exists
- **THEN** the response is `409 Conflict` with an error message indicating the plate is already registered

#### Scenario: Missing required fields rejected
- **WHEN** an authenticated user sends `POST /vehicles` without `licensePlate` or `vehicleType`
- **THEN** the response is `400 Bad Request` with validation errors

---

### Requirement: Update vehicle
The API SHALL expose `PATCH /vehicles/:id` to update an existing vehicle. All fields (`licensePlate`, `vehicleType`, `status`, `inspectionExpiry`, `insuranceExpiry`, `registrationExpiry`, `notes`) are optional in the request body. The action SHALL be audit-logged.

#### Scenario: Successful update
- **WHEN** an authenticated user sends `PATCH /vehicles/:id` with valid partial data
- **THEN** the response is `200 OK` with the updated vehicle record

#### Scenario: Status transition to MAINTENANCE
- **WHEN** an authenticated user sends `PATCH /vehicles/:id` with `{ "status": "MAINTENANCE" }`
- **THEN** the vehicle status is set to `MAINTENANCE` regardless of current driver assignment

#### Scenario: Status transition to DECOMMISSIONED
- **WHEN** an authenticated user sends `PATCH /vehicles/:id` with `{ "status": "DECOMMISSIONED" }`
- **THEN** the vehicle status is set to `DECOMMISSIONED`

#### Scenario: Vehicle not found
- **WHEN** an authenticated user sends `PATCH /vehicles/:id` with a non-existent `id`
- **THEN** the response is `404 Not Found`

---

### Requirement: Vehicle management page
The web application SHALL provide an interactive `/vehicles` page (replacing the current SSR implementation) accessible to all authenticated users. The page SHALL list all vehicles with search, status filter, and controls to create and update vehicles.

#### Scenario: Page loads and displays vehicles
- **WHEN** an authenticated user navigates to `/vehicles`
- **THEN** the page fetches `GET /api/vehicles` and renders a table with columns: license plate, type, status badge, assigned driver name (or "Chưa có tài"), compliance alerts

#### Scenario: Search by license plate or driver name
- **WHEN** the user types in the search input
- **THEN** the table filters client-side to show only vehicles whose license plate or driver's fullName contains the search string (case-insensitive)

#### Scenario: Filter by status
- **WHEN** the user selects a status from the filter dropdown
- **THEN** the table shows only vehicles matching the selected status

#### Scenario: Compliance expiry warning
- **WHEN** a vehicle has any compliance date (inspectionExpiry, insuranceExpiry, registrationExpiry) that is within 30 days or already past
- **THEN** a warning indicator (⚠) is shown next to that date in the table

#### Scenario: Create vehicle via modal
- **WHEN** the user clicks "Thêm xe" and fills required fields and submits
- **THEN** `POST /api/vehicles` is called, the modal closes, and the list refreshes

#### Scenario: Edit vehicle via modal
- **WHEN** the user clicks "Sửa" on a vehicle row
- **THEN** a modal opens pre-filled with the vehicle's current data
- **WHEN** the user saves changes
- **THEN** `PATCH /api/vehicles/:id` is called and the list refreshes

#### Scenario: Change vehicle status
- **WHEN** the user clicks a status transition button on a vehicle row (e.g., "Bảo dưỡng", "Kích hoạt", "Ngừng hoạt động")
- **THEN** `PATCH /api/vehicles/:id` with the new status is called and the row updates
