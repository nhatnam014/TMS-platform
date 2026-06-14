## ADDED Requirements

### Requirement: Trip plan can be deleted from the list with confirmation

The system SHALL provide a "Xóa" button on each trip plan row. Clicking it SHALL display a confirmation prompt before proceeding. On confirmation, the system SHALL call `DELETE /api/trip-plans/:id`. On success, the row SHALL be removed from the displayed list without a full page reload.

#### Scenario: Delete button triggers confirmation

- **WHEN** the user clicks "Xóa" on a trip plan row
- **THEN** a confirmation prompt is shown asking the user to confirm deletion before any API call is made

#### Scenario: Confirming delete removes the row

- **WHEN** the user confirms deletion
- **THEN** `DELETE /api/trip-plans/:id` is called and on success the row disappears from the list

#### Scenario: Cancelling the confirmation does nothing

- **WHEN** the user clicks "Xóa" but cancels the confirmation prompt
- **THEN** no API call is made and the row remains in the list

#### Scenario: Delete API error is shown as an action error

- **WHEN** `DELETE /api/trip-plans/:id` returns an error
- **THEN** an error message is displayed on the page (not blocking the list)
