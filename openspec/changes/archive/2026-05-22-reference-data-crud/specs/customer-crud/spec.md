## ADDED Requirements

### Requirement: Create customer
The API SHALL expose `POST /customers` to create a new customer. The body SHALL include `code` (unique, required), `name` (required), and optional `address`, `phone`, `email`, `taxCode`. New customers are created with `isActive: true`. The action SHALL be audit-logged.

#### Scenario: Successful create
- **WHEN** an authenticated user sends `POST /customers` with valid `code` and `name`
- **THEN** the response is `201 Created` with the new customer record including `id`, `code`, `name`, `isActive: true`

#### Scenario: Duplicate code rejected
- **WHEN** an authenticated user sends `POST /customers` with a `code` that already exists
- **THEN** the response is `409 Conflict` with an error message indicating the code is already in use

#### Scenario: Missing required fields rejected
- **WHEN** an authenticated user sends `POST /customers` without `code` or without `name`
- **THEN** the response is `400 Bad Request` with validation errors

---

### Requirement: Update customer
The API SHALL expose `PATCH /customers/:id` to update an existing customer. All fields (`code`, `name`, `address`, `phone`, `email`, `taxCode`, `isActive`) are optional in the request body. The action SHALL be audit-logged.

#### Scenario: Successful update
- **WHEN** an authenticated user sends `PATCH /customers/:id` with valid partial data
- **THEN** the response is `200 OK` with the updated customer record

#### Scenario: Soft-deactivate customer
- **WHEN** an authenticated user sends `PATCH /customers/:id` with `{ "isActive": false }`
- **THEN** the customer's `isActive` field is set to `false`
- **THEN** the customer no longer appears in `GET /customers` responses

#### Scenario: Customer not found
- **WHEN** an authenticated user sends `PATCH /customers/:id` with a non-existent `id`
- **THEN** the response is `404 Not Found`

#### Scenario: Duplicate code on update rejected
- **WHEN** an authenticated user sends `PATCH /customers/:id` with a `code` already used by another customer
- **THEN** the response is `409 Conflict`

---

### Requirement: Customer management page
The web application SHALL provide a `/customers` page accessible to all authenticated users. The page SHALL list all active customers and provide controls to create new customers and edit or deactivate existing ones.

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

#### Scenario: Deactivate customer
- **WHEN** the user clicks "Vô hiệu hóa" on a customer row and confirms
- **THEN** `PATCH /api/customers/:id` with `{ isActive: false }` is called
- **THEN** the customer disappears from the list
