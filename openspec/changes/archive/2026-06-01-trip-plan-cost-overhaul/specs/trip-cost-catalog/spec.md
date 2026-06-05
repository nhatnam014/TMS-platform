## ADDED Requirements

### Requirement: Admin can list all trip cost catalog items

The system SHALL provide `GET /api/v1/trip-costs` that returns an array of all TripCost catalog items (id, name, isActive). The endpoint SHALL be accessible to users with role ADMIN or OPERATOR.

#### Scenario: List returns all active and inactive items

- **WHEN** a user calls `GET /api/v1/trip-costs`
- **THEN** the response is HTTP 200 with an array of `{ id, name, isActive }` objects, including both active and inactive items

#### Scenario: Empty catalog returns empty array

- **WHEN** no TripCost items exist
- **THEN** the response is HTTP 200 with `[]`

---

### Requirement: Admin can create a trip cost catalog item

The system SHALL provide `POST /api/v1/trip-costs` accepting `{ name: string }`. The `name` field MUST be unique (case-insensitive). On success the endpoint returns HTTP 201 with the created item.

#### Scenario: Successful creation

- **WHEN** an admin sends `POST /api/v1/trip-costs` with `{ "name": "PHÍ NÂNG" }`
- **THEN** the API returns HTTP 201 with `{ id, name: "PHÍ NÂNG", isActive: true }`

#### Scenario: Duplicate name is rejected

- **WHEN** an admin sends `POST /api/v1/trip-costs` with a name that already exists (case-insensitive)
- **THEN** the API returns HTTP 409

#### Scenario: Empty name is rejected

- **WHEN** an admin sends `POST /api/v1/trip-costs` with `{ "name": "" }` or missing name
- **THEN** the API returns HTTP 400

#### Scenario: Non-admin is rejected

- **WHEN** a user with role OPERATOR or VIEWER calls this endpoint
- **THEN** the API returns HTTP 403

---

### Requirement: Admin can update a trip cost catalog item

The system SHALL provide `PATCH /api/v1/trip-costs/:id` accepting `{ name?: string, isActive?: boolean }`. Partial updates are supported.

#### Scenario: Rename a cost item

- **WHEN** an admin sends `PATCH /api/v1/trip-costs/:id` with `{ "name": "PHÍ NÂNG MỚI" }`
- **THEN** the API returns HTTP 200 with the updated item

#### Scenario: Deactivate a cost item

- **WHEN** an admin sends `PATCH /api/v1/trip-costs/:id` with `{ "isActive": false }`
- **THEN** the API returns HTTP 200 and the item is no longer returned in the active dropdown list for cost selection

#### Scenario: Update non-existent item

- **WHEN** an admin sends `PATCH /api/v1/trip-costs/:id` with an unknown id
- **THEN** the API returns HTTP 404

---

### Requirement: Admin can hard-delete a trip cost catalog item

The system SHALL provide `DELETE /api/v1/trip-costs/:id`. Deletion is permanent. All `TripPlanCost` rows referencing the deleted item MUST be cascade-deleted. The associated `TripPlan` rows MUST NOT be deleted.

#### Scenario: Successful delete cascades to TripPlanCost

- **WHEN** an admin deletes a TripCost item that has associated TripPlanCost rows
- **THEN** the TripCost row is deleted, all its TripPlanCost rows are deleted, and HTTP 200 is returned
- **THEN** the TripPlan rows that had those costs still exist and are unmodified

#### Scenario: Delete non-existent item

- **WHEN** an admin sends `DELETE /api/v1/trip-costs/:id` with an unknown id
- **THEN** the API returns HTTP 404

#### Scenario: Non-admin is rejected

- **WHEN** a user without ADMIN role calls `DELETE /api/v1/trip-costs/:id`
- **THEN** the API returns HTTP 403

---

### Requirement: Trip cost catalog page available in the web UI

The system SHALL provide a `/trip-costs` page in the authenticated section of the web app. The page SHALL display a table of all catalog items with columns: Name, Active status, and an Actions column with edit (rename/toggle isActive) and delete buttons.

#### Scenario: Page lists cost items

- **WHEN** an authenticated user navigates to `/trip-costs`
- **THEN** the page fetches `GET /api/trip-costs` and renders a row for each item showing name and isActive status

#### Scenario: Create button opens inline form or modal

- **WHEN** the user clicks "Thêm chi phí"
- **THEN** a form appears allowing entry of a new cost name, and on submit calls `POST /api/trip-costs`

#### Scenario: Delete button shows confirmation before deletion

- **WHEN** the user clicks delete on a cost item
- **THEN** a confirmation prompt appears warning that associated cost records will also be deleted
- **THEN** on confirmation, `DELETE /api/trip-costs/:id` is called and the item is removed from the list

#### Scenario: Navigation sidebar includes Trip Costs link

- **WHEN** an authenticated user views the sidebar
- **THEN** a "Chi phí" or "Danh mục chi phí" link is visible and navigates to `/trip-costs`
