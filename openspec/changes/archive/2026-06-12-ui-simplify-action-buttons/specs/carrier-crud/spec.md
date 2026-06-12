## MODIFIED Requirements

### Requirement: Carrier management page

The web application SHALL provide a `/carriers` page accessible to all authenticated users. The page SHALL list all active carriers and provide controls to create new carriers and edit or soft-delete existing ones. The row action button previously labelled "Vô hiệu hóa" SHALL be relabelled "Xoá" with a red/danger visual style, and SHALL require a confirmation dialog before executing.

#### Scenario: Page loads active carriers

- **WHEN** an authenticated user navigates to `/carriers`
- **THEN** the page fetches `GET /api/carriers` and displays the list of active carriers in a table

#### Scenario: Create carrier via modal

- **WHEN** the user clicks "Tạo hãng xe" and fills required fields and submits
- **THEN** `POST /api/carriers` is called, the modal closes, and the list refreshes

#### Scenario: Edit carrier via modal

- **WHEN** the user clicks "Sửa" on a carrier row
- **THEN** a modal opens pre-filled with the carrier's current data
- **WHEN** the user saves changes
- **THEN** `PATCH /api/carriers/:id` is called and the list refreshes

#### Scenario: Soft-delete carrier via Xoá button

- **WHEN** the user clicks "Xoá" on a carrier row
- **THEN** a confirmation dialog appears asking "Bạn có chắc muốn xoá hãng xe này?"
- **WHEN** the user confirms
- **THEN** `PATCH /api/carriers/:id` with `{ "isActive": false }` is called
- **THEN** the carrier disappears from the list

#### Scenario: Soft-delete confirmation cancelled

- **WHEN** the user clicks "Xoá" on a carrier row and then clicks "Hủy" in the confirmation dialog
- **THEN** no API call is made and the list is unchanged
