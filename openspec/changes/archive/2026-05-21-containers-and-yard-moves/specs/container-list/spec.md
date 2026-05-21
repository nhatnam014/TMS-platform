## ADDED Requirements

### Requirement: Display container inventory list
The system SHALL display a paginated list of all containers with their current status and location, accessible at `/containers`.

#### Scenario: Page loads with container list
- **WHEN** an authenticated user navigates to `/containers`
- **THEN** the system fetches `GET /containers?limit=100` and renders a table with columns: Container Number, Size/Type, Status, Current Location, Factory Zone

#### Scenario: Empty state
- **WHEN** no containers exist in the system
- **THEN** the table body SHALL display "Không có dữ liệu" spanning all columns

#### Scenario: Loading state
- **WHEN** the containers API call is in flight
- **THEN** the page SHALL display a loading indicator

### Requirement: Filter containers by status
The system SHALL allow users to filter the container list by container status using a dropdown.

#### Scenario: User selects a status filter
- **WHEN** the user selects a status from the filter dropdown
- **THEN** the list SHALL reload showing only containers matching the selected status

#### Scenario: User clears status filter
- **WHEN** the user selects the blank/all option in the filter dropdown
- **THEN** the list SHALL show all containers regardless of status

### Requirement: Container status badge color coding
The system SHALL visually distinguish container statuses using colored badges.

#### Scenario: Status badge renders
- **WHEN** a container row is rendered
- **THEN** the status SHALL be displayed as a color-coded badge (not plain text)
- **THEN** terminal statuses (DELIVERED) SHALL use a muted/grey color
- **THEN** active statuses (BEING_LOADED, LOADED_READY) SHALL use prominent colors (blue/green)
