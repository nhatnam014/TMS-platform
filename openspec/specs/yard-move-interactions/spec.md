## Requirements

### Requirement: Display yard moves list

The system SHALL display a paginated list of yard moves, accessible at `/yard-moves`, showing 10 records per page.

#### Scenario: Page loads with yard moves list

- **WHEN** an authenticated user navigates to `/yard-moves`
- **THEN** the system fetches `GET /yard-moves?page=1&limit=10` and renders a table with columns: STT, NGÀY, GPS, FULL NAME, TRUCK, MOOC, BOOKING, CONTAINER, GHI CHÚ, DÃ KÉO, Thao tác

#### Scenario: STT column shows computed display index

- **WHEN** the list renders page N with 10 records per page
- **THEN** the STT column shows `(N - 1) * 10 + rowIndex + 1` for each row — it is not a stored database field

#### Scenario: Pagination controls navigate between pages

- **WHEN** there are more than 10 yard moves
- **THEN** pagination controls are shown and clicking a page number fetches `GET /yard-moves?page=<n>&limit=10`

#### Scenario: Empty state

- **WHEN** no yard moves exist
- **THEN** the table body SHALL display "Không có dữ liệu" spanning all columns

### Requirement: Create yard move

The system SHALL allow users to create a new yard move via a modal form where every field is a plain text input.

#### Scenario: Open create modal

- **WHEN** the user clicks the "+ Tạo lệnh" button
- **THEN** a modal SHALL open immediately with the form — no preliminary fetch of containers or locations is performed

#### Scenario: Create form fields

- **WHEN** the create modal is open
- **THEN** the form SHALL include plain text inputs for: NGÀY, GPS, FULL NAME, TRUCK, MOOC, BOOKING, CONTAINER, GHI CHÚ, DÃ KÉO — none are date pickers, selects, or lookups

#### Scenario: Successful create

- **WHEN** the user submits the create form with at least a NGÀY value
- **THEN** the system SHALL `POST /yard-moves` with the form data
- **THEN** the modal SHALL close and the yard moves list SHALL refresh to page 1

#### Scenario: Create validation error

- **WHEN** the user submits the create form with an empty NGÀY field
- **THEN** the system SHALL display an inline error message without closing the modal

### Requirement: Edit yard move

The system SHALL allow users to edit an existing yard move via a modal form pre-populated with its current values, using the same plain text inputs as the create form.

#### Scenario: Open edit modal

- **WHEN** the user clicks "Sửa" on a yard move row
- **THEN** a modal SHALL open with all fields pre-filled from that record's current values

#### Scenario: Successful edit

- **WHEN** the user submits the edit form with changed values
- **THEN** the system SHALL `PATCH /yard-moves/:id` with the changed fields
- **THEN** the modal SHALL close and the list SHALL refresh

### Requirement: Delete yard move

The system SHALL allow users to soft-delete a yard move from the list.

#### Scenario: Delete soft-deletes the record

- **WHEN** the user clicks "Xóa" on a yard move row and confirms
- **THEN** the system SHALL `PATCH /yard-moves/:id` with `{ isActive: false }`
- **THEN** the row disappears from the list on refresh
