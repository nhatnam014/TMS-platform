## ADDED Requirements

### Requirement: General yard move update endpoint

The API SHALL expose `PATCH /yard-moves/:id` accepting an `UpdateYardMoveDto` where all fields (`date`, `containerNumber`, `fromZone`, `toZone`, `locationId`, `notes`, `isActive`) are optional. The endpoint SHALL update any provided fields and return the updated record.

#### Scenario: Successful partial update

- **WHEN** an authenticated user sends `PATCH /yard-moves/:id` with one or more optional fields (e.g., `{ "notes": "Updated note" }`)
- **THEN** the response is `200 OK` with the fully updated yard move record

#### Scenario: Update container number

- **WHEN** an authenticated user sends `PATCH /yard-moves/:id` with a valid `containerNumber` (4 uppercase letters + 7 digits)
- **THEN** the container number is updated and the response is `200 OK`

#### Scenario: Invalid container number rejected

- **WHEN** an authenticated user sends `PATCH /yard-moves/:id` with a `containerNumber` that does not match the pattern `/^[A-Z]{4}\d{7}$/`
- **THEN** the response is `400 Bad Request` with a validation error

#### Scenario: Record not found

- **WHEN** an authenticated user sends `PATCH /yard-moves/:id` with a non-existent `id`
- **THEN** the response is `404 Not Found`

---

### Requirement: Yard move edit modal

The `/yard-moves` page SHALL provide an Edit modal that allows updating all editable fields of a yard move.

#### Scenario: Open edit modal

- **WHEN** the user clicks "Sửa" on a yard move row
- **THEN** a modal opens pre-filled with the yard move's current values for: date, containerNumber, fromZone, toZone, locationId, notes

#### Scenario: Successful edit submission

- **WHEN** the user modifies fields in the edit modal and clicks "Lưu"
- **THEN** `PATCH /api/yard-moves/:id` is called with the changed fields
- **THEN** the modal closes and the yard moves list refreshes

#### Scenario: Edit validation error

- **WHEN** the user submits the edit modal with an invalid `containerNumber`
- **THEN** an inline error message is shown and the modal remains open
