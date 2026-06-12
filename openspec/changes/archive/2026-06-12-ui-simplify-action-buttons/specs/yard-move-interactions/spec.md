## MODIFIED Requirements

### Requirement: Display yard moves list

The system SHALL display a list of all active yard moves (`isActive = true`), accessible at `/yard-moves`.

#### Scenario: Page loads with yard moves list

- **WHEN** an authenticated user navigates to `/yard-moves`
- **THEN** the system fetches `GET /yard-moves?limit=100` and renders a table with columns: Date, Container, From Zone, To Zone, Location, Status, Actions

#### Scenario: Empty state

- **WHEN** no active yard moves exist
- **THEN** the table body SHALL display "Không có dữ liệu" spanning all columns

---

### Requirement: Create yard move

The system SHALL allow users to create a new yard move via a modal form.

#### Scenario: Open create modal

- **WHEN** the user clicks the "+ Tạo lệnh" button
- **THEN** a modal SHALL open that fetches `GET /containers` and `GET /locations` before rendering the form

#### Scenario: Create form fields

- **WHEN** the create modal is open
- **THEN** the form SHALL include: Date (date picker), Container (select from container list), From Zone (select: STAGING_DROP | LOADING_DOCK | STAGING_READY), To Zone (select: STAGING_DROP | LOADING_DOCK | STAGING_READY), Location (select from location list), Notes (optional textarea)

#### Scenario: Successful create

- **WHEN** the user submits the create form with valid data
- **THEN** the system SHALL `POST /yard-moves` with the form data
- **THEN** the modal SHALL close and the yard moves list SHALL refresh

#### Scenario: Create validation error

- **WHEN** the user submits the create form with missing required fields
- **THEN** the system SHALL display an inline error message without closing the modal

---

### Requirement: Yard move row actions simplified to Edit and Delete

Each yard move row in the list SHALL display exactly two action buttons: "Sửa" (edit) and "Xoá" (soft delete). Status-transition buttons ("Bắt đầu", "Hoàn thành", "Hủy") and the "+ Chi phí" cost button SHALL be preserved in source code wrapped in `{false && ...}` but SHALL NOT be rendered.

#### Scenario: Only Sửa and Xoá buttons visible

- **WHEN** the user views the actions column of any yard move row
- **THEN** only "Sửa" and "Xoá" buttons are visible regardless of the yard move's status

#### Scenario: Edit yard move via modal

- **WHEN** the user clicks "Sửa" on a yard move row
- **THEN** a modal opens pre-filled with: date, containerNumber, fromZone, toZone, locationId, notes
- **WHEN** the user saves changes
- **THEN** `PATCH /api/yard-moves/:id` is called with the updated fields
- **THEN** the modal closes and the list refreshes

#### Scenario: Soft-delete yard move via Xoá button

- **WHEN** the user clicks "Xoá" on a yard move row
- **THEN** a confirmation dialog appears asking "Bạn có chắc muốn xoá lệnh bãi này?"
- **WHEN** the user confirms
- **THEN** `PATCH /api/yard-moves/:id` with `{ "isActive": false }` is called
- **THEN** the yard move disappears from the list

#### Scenario: Soft-delete confirmation cancelled

- **WHEN** the user clicks "Xoá" on a yard move row and then clicks "Hủy" in the confirmation dialog
- **THEN** no API call is made and the list is unchanged

#### Scenario: Status-transition and cost buttons not visible

- **WHEN** the user views any yard move row regardless of status
- **THEN** "Bắt đầu", "Hoàn thành", "Hủy", and "+ Chi phí" buttons are not rendered in the UI
