## ADDED Requirements

### Requirement: Create carrier
The API SHALL expose `POST /carriers` to create a new carrier. The body SHALL include `code` (unique, required), `name` (required), and optional `phone`. New carriers are created with `isActive: true`. The action SHALL be audit-logged.

#### Scenario: Successful create
- **WHEN** an authenticated user sends `POST /carriers` with valid `code` and `name`
- **THEN** the response is `201 Created` with the new carrier record including `id`, `code`, `name`, `isActive: true`

#### Scenario: Duplicate code rejected
- **WHEN** an authenticated user sends `POST /carriers` with a `code` that already exists
- **THEN** the response is `409 Conflict` with an error message indicating the code is already in use

#### Scenario: Missing required fields rejected
- **WHEN** an authenticated user sends `POST /carriers` without `code` or without `name`
- **THEN** the response is `400 Bad Request` with validation errors

---

### Requirement: Update carrier
The API SHALL expose `PATCH /carriers/:id` to update an existing carrier. All fields (`code`, `name`, `phone`, `isActive`) are optional in the request body. The action SHALL be audit-logged.

#### Scenario: Successful update
- **WHEN** an authenticated user sends `PATCH /carriers/:id` with valid partial data
- **THEN** the response is `200 OK` with the updated carrier record

#### Scenario: Soft-deactivate carrier
- **WHEN** an authenticated user sends `PATCH /carriers/:id` with `{ "isActive": false }`
- **THEN** the carrier's `isActive` field is set to `false`
- **THEN** the carrier no longer appears in `GET /carriers` responses

#### Scenario: Carrier not found
- **WHEN** an authenticated user sends `PATCH /carriers/:id` with a non-existent `id`
- **THEN** the response is `404 Not Found`

---

### Requirement: Carrier management page
The web application SHALL provide a `/carriers` page accessible to all authenticated users. The page SHALL list all active carriers and provide controls to create new carriers and edit or deactivate existing ones.

#### Scenario: Page loads active carriers
- **WHEN** an authenticated user navigates to `/carriers`
- **THEN** the page fetches `GET /api/carriers` and displays the list of active carriers in a table

#### Scenario: Create carrier via modal
- **WHEN** the user clicks "Tạo hãng xe" and fills required fields and submits
- **THEN** `POST /api/carriers` is called, the modal closes, and the list refreshes

#### Scenario: Edit carrier via modal
- **WHEN** the user clicks "Sửa" on a carrier row
- **THEN** a modal opens pre-filled with the carrier's current data
- **WHEN** the user saves changes
- **THEN** `PATCH /api/carriers/:id` is called and the list refreshes

#### Scenario: Deactivate carrier
- **WHEN** the user clicks "Vô hiệu hóa" on a carrier row and confirms
- **THEN** `PATCH /api/carriers/:id` with `{ isActive: false }` is called
- **THEN** the carrier disappears from the list
