## MODIFIED Requirements

### Requirement: Customer management page

The web application SHALL provide a `/customers` page accessible to all authenticated users. The page SHALL list all active customers and provide controls to create new customers and edit or soft-delete existing ones. The row action button previously labelled "Vô hiệu hóa" SHALL be relabelled "Xoá" with a red/danger visual style, and SHALL require a confirmation dialog before executing.

#### Scenario: Page loads active customers

- **WHEN** an authenticated user navigates to `/customers`
- **THEN** the page fetches `GET /api/customers` and displays the list of active customers in a table

#### Scenario: Create customer via modal

- **WHEN** the user clicks "Tạo khách hàng" and fills required fields and submits
- **THEN** `POST /api/customers` is called, the modal closes, and the list refreshes

#### Scenario: Edit customer via modal

- **WHEN** the user clicks "Sửa" on a customer row
- **THEN** a modal opens pre-filled with the customer's current data
- **WHEN** the user saves changes
- **THEN** `PATCH /api/customers/:id` is called and the list refreshes

#### Scenario: Soft-delete customer via Xoá button

- **WHEN** the user clicks "Xoá" on a customer row
- **THEN** a confirmation dialog appears asking "Bạn có chắc muốn xoá khách hàng này?"
- **WHEN** the user confirms
- **THEN** `PATCH /api/customers/:id` with `{ "isActive": false }` is called
- **THEN** the customer disappears from the list

#### Scenario: Soft-delete confirmation cancelled

- **WHEN** the user clicks "Xoá" on a customer row and then clicks "Hủy" in the confirmation dialog
- **THEN** no API call is made and the list is unchanged
