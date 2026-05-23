## ADDED Requirements

### Requirement: List drivers
The API SHALL expose `GET /drivers` returning all drivers ordered by `fullName`, including each driver's assigned vehicle (id, licensePlate, vehicleType) if present. The endpoint requires JWT authentication.

#### Scenario: Returns all drivers with vehicle info
- **WHEN** an authenticated request is made to `GET /drivers`
- **THEN** the response is `200 OK` with an array of driver records each including `id`, `fullName`, `phone`, `status`, and `vehicle` (nullable, contains `id`, `licensePlate`, `vehicleType`)

---

### Requirement: Create driver
The API SHALL expose `POST /drivers` to register a new driver. The body SHALL include `fullName` (required) and optional `phone`, `notes`. New drivers are created with `status: ACTIVE` and no vehicle assignment. The action SHALL be audit-logged.

#### Scenario: Successful create
- **WHEN** an authenticated user sends `POST /drivers` with valid `fullName`
- **THEN** the response is `201 Created` with the new driver record including `id`, `fullName`, `status: "ACTIVE"`, `vehicleId: null`

#### Scenario: Missing required field rejected
- **WHEN** an authenticated user sends `POST /drivers` without `fullName`
- **THEN** the response is `400 Bad Request` with validation errors

---

### Requirement: Update driver
The API SHALL expose `PATCH /drivers/:id` to update an existing driver. Fields `fullName`, `phone`, `status`, and `notes` are optional in the request body. The action SHALL be audit-logged.

#### Scenario: Successful update
- **WHEN** an authenticated user sends `PATCH /drivers/:id` with valid partial data
- **THEN** the response is `200 OK` with the updated driver record

#### Scenario: Driver not found
- **WHEN** an authenticated user sends `PATCH /drivers/:id` with a non-existent `id`
- **THEN** the response is `404 Not Found`

---

### Requirement: Assign driver to vehicle
The API SHALL allow assigning a driver to a vehicle via `PATCH /drivers/:id` with `{ "vehicleId": "<id>" }`. When assigned, the vehicle's status SHALL transition to `ACTIVE` if it was previously `WAITING_DRIVER`. The assignment SHALL be atomic (driver update + vehicle status update in a single transaction). The action SHALL be audit-logged.

#### Scenario: Successful assignment
- **WHEN** an authenticated user sends `PATCH /drivers/:id` with `{ "vehicleId": "<vehicle-id>" }`
- **THEN** the driver's `vehicleId` is set to the given vehicle
- **THEN** if the vehicle's status was `WAITING_DRIVER`, it is updated to `ACTIVE`
- **THEN** the response is `200 OK` with the updated driver

#### Scenario: Vehicle already has a driver
- **WHEN** an authenticated user tries to assign a driver to a vehicle that already has a different driver assigned
- **THEN** the response is `409 Conflict` with an error indicating the vehicle already has an assigned driver

#### Scenario: Vehicle not found on assignment
- **WHEN** an authenticated user sends `PATCH /drivers/:id` with a non-existent `vehicleId`
- **THEN** the response is `404 Not Found`

#### Scenario: Assignment does not affect MAINTENANCE vehicle status
- **WHEN** an authenticated user assigns a driver to a vehicle with status `MAINTENANCE`
- **THEN** the vehicle status remains `MAINTENANCE` (does not change to `ACTIVE`)
- **THEN** the driver's `vehicleId` is still set

---

### Requirement: Unassign driver from vehicle
The API SHALL allow unassigning a driver via `PATCH /drivers/:id` with `{ "vehicleId": null }`. When unassigned, the previously-assigned vehicle's status SHALL transition to `WAITING_DRIVER`. The action SHALL be audit-logged.

#### Scenario: Successful unassignment
- **WHEN** an authenticated user sends `PATCH /drivers/:id` with `{ "vehicleId": null }`
- **THEN** the driver's `vehicleId` is cleared
- **THEN** the previously-assigned vehicle's status is set to `WAITING_DRIVER`
- **THEN** the response is `200 OK` with the updated driver

#### Scenario: Unassign driver with no vehicle — no-op
- **WHEN** an authenticated user sends `PATCH /drivers/:id` with `{ "vehicleId": null }` and the driver has no vehicle
- **THEN** the response is `200 OK` with no changes to vehicle status

---

### Requirement: Driver management page
The web application SHALL provide a `/drivers` page accessible to all authenticated users. The page SHALL list all drivers with their assigned vehicle (if any), and provide controls to create, edit, and assign/unassign vehicles.

#### Scenario: Page loads all drivers
- **WHEN** an authenticated user navigates to `/drivers`
- **THEN** the page fetches `GET /api/drivers` and displays a table with columns: name, phone, status badge, assigned vehicle (plate + type or "Chưa phân công"), actions

#### Scenario: Create driver via modal
- **WHEN** the user clicks "Thêm tài xế" and fills required fields and submits
- **THEN** `POST /api/drivers` is called, the modal closes, and the list refreshes

#### Scenario: Edit driver via modal
- **WHEN** the user clicks "Sửa" on a driver row
- **THEN** a modal opens pre-filled with the driver's current data
- **WHEN** the user saves
- **THEN** `PATCH /api/drivers/:id` is called and the list refreshes

#### Scenario: Assign vehicle to driver
- **WHEN** the user clicks "Phân công xe" on an unassigned driver row
- **THEN** a select dropdown of available vehicles (status WAITING_DRIVER) is shown
- **WHEN** the user selects a vehicle and confirms
- **THEN** `PATCH /api/drivers/:id` with `{ vehicleId }` is called
- **THEN** the driver row shows the assigned vehicle and the list refreshes

#### Scenario: Unassign vehicle from driver
- **WHEN** the user clicks "Hủy phân công" on an assigned driver row and confirms
- **THEN** `PATCH /api/drivers/:id` with `{ vehicleId: null }` is called
- **THEN** the driver row shows "Chưa phân công" and the list refreshes
