## Requirements

### Requirement: Trip plan can be fully edited via a pre-filled modal form

The system SHALL provide a "Sửa" button on each trip plan row. Clicking it SHALL open an EditTripModal with all fields pre-filled from the current row data. The modal layout and fields SHALL be identical to CreateTripModal (same three-section layout: Chuyến đi / Container / Địa điểm, cost slots, supplemental row) with the addition of a Status dropdown. On submit, the modal SHALL call `PATCH /api/trip-plans/:id` with all changed fields and close on success.

#### Scenario: Edit modal opens with pre-filled data

- **WHEN** the user clicks "Sửa" on a trip plan row
- **THEN** the EditTripModal opens with all form fields populated from the row (date, vehicle, customer, carrier, locations, container fields, cost slot amounts, SHĐ values, status, description, notes)

#### Scenario: Status dropdown is included in edit form

- **WHEN** the user opens the EditTripModal
- **THEN** a Status dropdown is visible showing all five statuses: PLANNED, DISPATCHED, IN_TRANSIT, COMPLETED, CANCELLED — with the current status pre-selected

#### Scenario: Successful edit updates the list

- **WHEN** the user modifies fields and submits the EditTripModal
- **THEN** `PATCH /api/trip-plans/:id` is called with the updated fields, the modal closes, and the trip plans list refreshes

#### Scenario: API error on edit is shown inside modal

- **WHEN** the PATCH call returns an error
- **THEN** an error message is displayed inside the modal and the modal stays open

### Requirement: PATCH /api/v1/trip-plans/:id accepts a full trip plan update

The system SHALL provide `PATCH /api/v1/trip-plans/:id` accepting an `UpdateTripPlanDto` (all fields from `CreateTripPlanDto` made optional via `PartialType`, plus an optional `status: TripStatus` field). The endpoint SHALL update only the provided fields. The `updateStatus` endpoint (`PATCH /api/v1/trip-plans/:id/status`) SHALL remain unchanged.

#### Scenario: Partial update changes only supplied fields

- **WHEN** `PATCH /api/v1/trip-plans/:id` is called with only `{ "notes": "updated" }`
- **THEN** only the `notes` field is updated; all other fields retain their previous values

#### Scenario: Status can be changed via the full update endpoint

- **WHEN** `PATCH /api/v1/trip-plans/:id` is called with `{ "status": "COMPLETED" }`
- **THEN** the trip plan status is set to COMPLETED

#### Scenario: Unknown trip plan ID returns 404

- **WHEN** `PATCH /api/v1/trip-plans/:id` is called with a non-existent ID
- **THEN** the API returns HTTP 404
