## ADDED Requirements

### Requirement: List users
The API SHALL expose `GET /users` returning all users ordered by `createdAt` descending. The response MUST exclude `passwordHash`. The endpoint requires JWT authentication and ADMIN role.

#### Scenario: Returns all users without password hashes
- **WHEN** an ADMIN makes an authenticated request to `GET /users`
- **THEN** the response is `200 OK` with an array where each user includes `id`, `username`, `role`, `isActive`, `createdAt` and does NOT include `passwordHash`

#### Scenario: Non-ADMIN is rejected
- **WHEN** an OPERATOR or VIEWER makes an authenticated request to `GET /users`
- **THEN** the response is `403 Forbidden`

---

### Requirement: Create user
The API SHALL expose `POST /users` to create a new user. The body SHALL include `username` (required, unique), `password` (required, min 6 chars), and `role` (required, one of `ADMIN | OPERATOR | VIEWER`). The password MUST be hashed with bcrypt before storage. New users are created with `isActive: true`. The action SHALL be audit-logged.

#### Scenario: Successful create
- **WHEN** an ADMIN sends `POST /users` with valid `username`, `password`, and `role`
- **THEN** the response is `201 Created` with the new user record (no `passwordHash`) including `id`, `username`, `role`, `isActive: true`

#### Scenario: Duplicate username rejected
- **WHEN** an ADMIN sends `POST /users` with a `username` that already exists
- **THEN** the response is `409 Conflict`

#### Scenario: Missing required fields rejected
- **WHEN** an ADMIN sends `POST /users` without `username`, `password`, or `role`
- **THEN** the response is `400 Bad Request` with validation errors

#### Scenario: Non-ADMIN is rejected
- **WHEN** a non-ADMIN makes a request to `POST /users`
- **THEN** the response is `403 Forbidden`

---

### Requirement: Update user
The API SHALL expose `PATCH /users/:id` to update a user's `role` and/or `isActive`. Both fields are optional. Username is immutable and SHALL NOT be accepted in the body. The action SHALL be audit-logged.

#### Scenario: Successful role update
- **WHEN** an ADMIN sends `PATCH /users/:id` with `{ "role": "VIEWER" }`
- **THEN** the response is `200 OK` with the updated user record (no `passwordHash`)

#### Scenario: Successful deactivation
- **WHEN** an ADMIN sends `PATCH /users/:id` with `{ "isActive": false }` for a different user
- **THEN** the response is `200 OK` and the user's `isActive` is set to `false`

#### Scenario: Self-deactivation rejected
- **WHEN** an ADMIN sends `PATCH /users/:id` with `{ "isActive": false }` where `:id` is their own user id
- **THEN** the response is `403 Forbidden` with a message indicating self-deactivation is not allowed

#### Scenario: User not found
- **WHEN** an ADMIN sends `PATCH /users/:id` with a non-existent `id`
- **THEN** the response is `404 Not Found`

#### Scenario: Non-ADMIN is rejected
- **WHEN** a non-ADMIN makes a request to `PATCH /users/:id`
- **THEN** the response is `403 Forbidden`

---

### Requirement: User management page
The web application SHALL provide a `/users` page accessible only to ADMIN users. The page SHALL list all users and provide controls to create users, update role/status, and reset passwords.

#### Scenario: Non-ADMIN is redirected
- **WHEN** an OPERATOR or VIEWER navigates to `/users`
- **THEN** they are redirected to `/dashboard`

#### Scenario: Page loads all users
- **WHEN** an ADMIN navigates to `/users`
- **THEN** the page fetches `GET /api/users` and displays a table with columns: username, role badge, status badge, created date, actions

#### Scenario: Create user via modal
- **WHEN** the ADMIN clicks "Tạo người dùng" and fills required fields and submits
- **THEN** `POST /api/users` is called, the modal closes, and the list refreshes

#### Scenario: Edit user via modal
- **WHEN** the ADMIN clicks "Sửa" on a user row
- **THEN** a modal opens with role dropdown and isActive toggle (username is not editable)
- **WHEN** the ADMIN saves
- **THEN** `PATCH /api/users/:id` is called and the list refreshes
