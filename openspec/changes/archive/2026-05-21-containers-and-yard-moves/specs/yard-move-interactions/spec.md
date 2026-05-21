## ADDED Requirements

### Requirement: Display yard moves list
The system SHALL display a list of all yard moves, accessible at `/yard-moves`.

#### Scenario: Page loads with yard moves list
- **WHEN** an authenticated user navigates to `/yard-moves`
- **THEN** the system fetches `GET /yard-moves?limit=100` and renders a table with columns: Date, Container, From Zone, To Zone, Location, Status, Actions

#### Scenario: Empty state
- **WHEN** no yard moves exist
- **THEN** the table body SHALL display "Không có dữ liệu" spanning all columns

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

### Requirement: Advance yard move status
The system SHALL provide inline status transition buttons per yard move row.

#### Scenario: PENDING move shows advance and cancel buttons
- **WHEN** a yard move has status PENDING
- **THEN** the Actions column SHALL show "Bắt đầu" button (→ IN_PROGRESS) and "Hủy" button (→ CANCELLED)

#### Scenario: IN_PROGRESS move shows complete and cancel buttons
- **WHEN** a yard move has status IN_PROGRESS
- **THEN** the Actions column SHALL show "Hoàn thành" button (→ COMPLETED) and "Hủy" button (→ CANCELLED)

#### Scenario: Terminal status shows no action buttons
- **WHEN** a yard move has status COMPLETED or CANCELLED
- **THEN** the Actions column SHALL show no status-transition buttons

#### Scenario: Status transition success
- **WHEN** the user clicks a status transition button
- **THEN** the system SHALL `PATCH /yard-moves/:id/status` with the new status
- **THEN** the list SHALL refresh to reflect the updated status

#### Scenario: COMPLETED move auto-updates container status
- **WHEN** a yard move transitions to COMPLETED
- **THEN** the backend SHALL automatically update the container's status based on the `toZone` mapping (STAGING_DROP → EMPTY_AT_YARD, LOADING_DOCK → BEING_LOADED, STAGING_READY → LOADED_READY)

### Requirement: Add cost to yard move
The system SHALL allow users to add cost entries to IN_PROGRESS or COMPLETED yard moves.

#### Scenario: Cost button visible on active/completed moves
- **WHEN** a yard move has status IN_PROGRESS or COMPLETED
- **THEN** a "+ Chi phí" button SHALL be visible in the Actions column

#### Scenario: Open cost modal
- **WHEN** the user clicks "+ Chi phí"
- **THEN** a modal SHALL open with fields: Cost Type (select: YARD_HANDLING | FORKLIFT | OVERTIME | OTHER), Amount (number input), Note (optional text)

#### Scenario: Successful cost add
- **WHEN** the user submits the cost form with valid data
- **THEN** the system SHALL `POST /yard-moves/:id/costs`
- **THEN** the modal SHALL close and the list SHALL refresh
