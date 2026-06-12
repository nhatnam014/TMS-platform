## MODIFIED Requirements

### Requirement: Location management page

The web application SHALL provide a `/locations` page accessible to all authenticated users. The page SHALL list all active locations with a `locationType` filter, and provide controls to create new locations and edit or soft-delete existing ones. The row action button previously labelled "Vô hiệu hóa" SHALL be relabelled "Xoá" with a red/danger visual style, and SHALL require a confirmation dialog before executing.

#### Scenario: Page loads active locations

- **WHEN** an authenticated user navigates to `/locations`
- **THEN** the page fetches `GET /api/locations` and displays the list of active locations in a table with columns: code, name, type, address

#### Scenario: Filter by locationType

- **WHEN** the user selects a type from the locationType filter dropdown
- **THEN** the table updates to show only locations matching the selected type

#### Scenario: Create location via modal

- **WHEN** the user clicks "Tạo địa điểm" and fills required fields (code, name, locationType) and submits
- **THEN** `POST /api/locations` is called, the modal closes, and the list refreshes

#### Scenario: Edit location via modal

- **WHEN** the user clicks "Sửa" on a location row
- **THEN** a modal opens pre-filled with the location's current data
- **WHEN** the user saves changes
- **THEN** `PATCH /api/locations/:id` is called and the list refreshes

#### Scenario: Soft-delete location via Xoá button

- **WHEN** the user clicks "Xoá" on a location row
- **THEN** a confirmation dialog appears asking "Bạn có chắc muốn xoá địa điểm này?"
- **WHEN** the user confirms
- **THEN** `PATCH /api/locations/:id` with `{ "isActive": false }` is called
- **THEN** the location disappears from the list

#### Scenario: Soft-delete confirmation cancelled

- **WHEN** the user clicks "Xoá" on a location row and then clicks "Hủy" in the confirmation dialog
- **THEN** no API call is made and the list is unchanged
