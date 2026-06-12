## MODIFIED Requirements

### Requirement: Vehicle management page

The web application SHALL provide an interactive `/vehicles` page accessible to all authenticated users. The page SHALL list all vehicles with search, status filter, and controls to create and update vehicles. Each vehicle row SHALL display exactly two action buttons: "Sửa" (edit) and "Xoá" (soft delete). Workflow status-transition buttons (MAINTENANCE, ACTIVE, DECOMMISSIONED) SHALL be preserved in source code wrapped in `{false && ...}` but SHALL NOT be rendered in the UI.

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

#### Scenario: Soft-delete vehicle via Xoá button

- **WHEN** the user clicks "Xoá" on a vehicle row
- **THEN** a confirmation dialog appears asking "Bạn có chắc muốn xoá xe này?"
- **WHEN** the user confirms
- **THEN** `PATCH /api/vehicles/:id` with `{ "status": "DECOMMISSIONED" }` is called
- **THEN** the modal closes and the list refreshes (vehicle may still appear with DECOMMISSIONED status if no status filter is applied)

#### Scenario: Soft-delete confirmation cancelled

- **WHEN** the user clicks "Xoá" on a vehicle row and then clicks "Hủy" in the confirmation dialog
- **THEN** no API call is made and the list is unchanged

#### Scenario: Status-transition buttons not visible

- **WHEN** the user views the actions column of any vehicle row
- **THEN** only "Sửa" and "Xoá" buttons are visible; MAINTENANCE, ACTIVE, and DECOMMISSIONED transition buttons are not rendered
