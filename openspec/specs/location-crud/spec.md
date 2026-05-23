## ADDED Requirements

### Requirement: Create location
The API SHALL expose `POST /locations` to create a new location. The body SHALL include `code` (unique, required), `name` (required), `locationType` (required, one of `PORT | DEPOT | ICD | INDUSTRIAL_ZONE | WAREHOUSE | OTHER`), and optional `address`, `latitude`, `longitude`. New locations are created with `isActive: true`. The action SHALL be audit-logged.

#### Scenario: Successful create
- **WHEN** an authenticated user sends `POST /locations` with valid `code`, `name`, and `locationType`
- **THEN** the response is `201 Created` with the new location record including `id`, `code`, `name`, `locationType`, `isActive: true`

#### Scenario: Duplicate code rejected
- **WHEN** an authenticated user sends `POST /locations` with a `code` that already exists
- **THEN** the response is `409 Conflict` with an error message indicating the code is already in use

#### Scenario: Invalid locationType rejected
- **WHEN** an authenticated user sends `POST /locations` with a `locationType` value not in the allowed enum
- **THEN** the response is `400 Bad Request` with a validation error

#### Scenario: Missing required fields rejected
- **WHEN** an authenticated user sends `POST /locations` without `code`, `name`, or `locationType`
- **THEN** the response is `400 Bad Request` with validation errors

---

### Requirement: Update location
The API SHALL expose `PATCH /locations/:id` to update an existing location. All fields (`code`, `name`, `locationType`, `address`, `latitude`, `longitude`, `isActive`) are optional in the request body. The action SHALL be audit-logged.

#### Scenario: Successful update
- **WHEN** an authenticated user sends `PATCH /locations/:id` with valid partial data
- **THEN** the response is `200 OK` with the updated location record

#### Scenario: Soft-deactivate location
- **WHEN** an authenticated user sends `PATCH /locations/:id` with `{ "isActive": false }`
- **THEN** the location's `isActive` field is set to `false`
- **THEN** the location no longer appears in `GET /locations` responses

#### Scenario: Location not found
- **WHEN** an authenticated user sends `PATCH /locations/:id` with a non-existent `id`
- **THEN** the response is `404 Not Found`

---

### Requirement: Location management page
The web application SHALL provide a `/locations` page accessible to all authenticated users. The page SHALL list all active locations with a `locationType` filter, and provide controls to create new locations and edit or deactivate existing ones.

#### Scenario: Page loads active locations
- **WHEN** an authenticated user navigates to `/locations`
- **THEN** the page fetches `GET /api/locations` and displays the list of active locations in a table with columns: code, name, type, address

#### Scenario: Filter by locationType
- **WHEN** the user selects a type from the locationType filter dropdown
- **THEN** the table updates to show only locations matching the selected type

#### Scenario: Create location via modal
- **WHEN** the user clicks "Tạo địa điểm" and fills required fields (code, name, locationType) and submits
- **THEN** `POST /api/locations` is called, the modal closes, and the list refreshes

#### Scenario: Edit location via modal
- **WHEN** the user clicks "Sửa" on a location row
- **THEN** a modal opens pre-filled with the location's current data
- **WHEN** the user saves changes
- **THEN** `PATCH /api/locations/:id` is called and the list refreshes

#### Scenario: Deactivate location
- **WHEN** the user clicks "Vô hiệu hóa" on a location row and confirms
- **THEN** `PATCH /api/locations/:id` with `{ isActive: false }` is called
- **THEN** the location disappears from the list
