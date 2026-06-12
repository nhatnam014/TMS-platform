## MODIFIED Requirements

### Requirement: Driver management page

The web application SHALL provide a `/drivers` page accessible to all authenticated users. The page SHALL list all drivers with their assigned vehicle (if any), and provide controls to create and edit drivers. Each driver row SHALL display exactly two action buttons: "Sửa" (edit) and "Xoá" (soft delete via TERMINATED status). Assign and Unassign buttons SHALL be preserved in source code wrapped in `{false && ...}` but SHALL NOT be rendered in the UI.

#### Scenario: Page loads all drivers

- **WHEN** an authenticated user navigates to `/drivers`
- **THEN** the page fetches `GET /api/drivers` and displays a table with columns: name, phone, status badge, assigned vehicle (plate + type or "Chưa phân công"), actions

#### Scenario: Create driver via modal

- **WHEN** the user clicks "Thêm tài xế" and fills required fields and submits
- **THEN** `POST /api/drivers` is called, the modal closes, and the list refreshes

#### Scenario: Edit driver via modal

- **WHEN** the user clicks "Sửa" on a driver row
- **THEN** a modal opens pre-filled with the driver's current data
- **WHEN** the user saves
- **THEN** `PATCH /api/drivers/:id` is called and the list refreshes

#### Scenario: Soft-delete driver via Xoá button

- **WHEN** the user clicks "Xoá" on a driver row
- **THEN** a confirmation dialog appears asking "Bạn có chắc muốn xoá tài xế này?"
- **WHEN** the user confirms
- **THEN** `PATCH /api/drivers/:id` with `{ "status": "TERMINATED" }` is called
- **THEN** the list refreshes

#### Scenario: Soft-delete confirmation cancelled

- **WHEN** the user clicks "Xoá" on a driver row and then clicks "Hủy" in the confirmation dialog
- **THEN** no API call is made and the list is unchanged

#### Scenario: Assign and Unassign buttons not visible

- **WHEN** the user views the actions column of any driver row
- **THEN** only "Sửa" and "Xoá" buttons are visible; "Phân công xe" and "Hủy phân công" buttons are not rendered
