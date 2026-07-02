## MODIFIED Requirements

### Requirement: Display yard moves list

The system SHALL display a paginated list of yard moves, accessible at `/yard-moves`, showing 10 records per page. The NGÀY column SHALL display the date formatted as `dd/mm/yyyy` using `formatDate` from `@/lib/date-utils`.

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

#### Scenario: NGÀY column shows formatted date

- **WHEN** a yard move row has `date: "2026-06-24T00:00:00.000Z"`
- **THEN** the NGÀY cell displays `"24/06/2026"`, formatted via `formatDate` from `@/lib/date-utils`

### Requirement: Create yard move

The system SHALL allow users to create a new yard move via a modal form where the NGÀY field is a native date picker (`<input type="date">`) and every other field is a plain text input.

#### Scenario: Open create modal

- **WHEN** the user clicks the "+ Tạo lệnh" button
- **THEN** a modal SHALL open immediately with the form — no preliminary fetch of containers or locations is performed

#### Scenario: Create form fields

- **WHEN** the create modal is open
- **THEN** the form SHALL include a native date picker (`type="date"`) for NGÀY, and plain text inputs for: GPS, FULL NAME, TRUCK, MOOC, BOOKING, CONTAINER, GHI CHÚ, DÃ KÉO — none of the text fields are date pickers, selects, or lookups

#### Scenario: Successful create

- **WHEN** the user submits the create form with at least a NGÀY value selected
- **THEN** the system SHALL `POST /yard-moves` with the form data, sending NGÀY as an ISO date string
- **THEN** the modal SHALL close and the yard moves list SHALL refresh to page 1

#### Scenario: Create validation error

- **WHEN** the user submits the create form with no NGÀY value selected
- **THEN** the system SHALL display an inline error message without closing the modal

### Requirement: Edit yard move

The system SHALL allow users to edit an existing yard move via a modal form pre-populated with its current values, using the same native date picker for NGÀY and plain text inputs for the other fields as the create form.

#### Scenario: Open edit modal

- **WHEN** the user clicks "Sửa" on a yard move row
- **THEN** a modal SHALL open with all fields pre-filled from that record's current values, with NGÀY converted to `yyyy-mm-dd` via `toDateInput` from `@/lib/date-utils` for the date picker

#### Scenario: Successful edit

- **WHEN** the user submits the edit form with changed values
- **THEN** the system SHALL `PATCH /yard-moves/:id` with the changed fields, sending NGÀY as an ISO date string if changed
- **THEN** the modal SHALL close and the list SHALL refresh
