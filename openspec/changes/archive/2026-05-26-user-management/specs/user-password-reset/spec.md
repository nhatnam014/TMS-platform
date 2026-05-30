## ADDED Requirements

### Requirement: Admin resets a user's password
The API SHALL expose `PATCH /users/:id/reset-password` to allow an ADMIN to set a new password for any user. The body SHALL include `newPassword` (required, min 6 chars). The new password MUST be hashed with bcrypt before storage. The response SHALL NOT include any credential data. The action SHALL be audit-logged with summary only — no password hash or plaintext in the snapshot.

#### Scenario: Successful password reset
- **WHEN** an ADMIN sends `PATCH /users/:id/reset-password` with a valid `newPassword`
- **THEN** the response is `200 OK` with `{ "message": "Mật khẩu đã được đặt lại" }`
- **THEN** the user can subsequently log in with the new password

#### Scenario: User not found
- **WHEN** an ADMIN sends `PATCH /users/:id/reset-password` with a non-existent `id`
- **THEN** the response is `404 Not Found`

#### Scenario: Short password rejected
- **WHEN** an ADMIN sends `PATCH /users/:id/reset-password` with `newPassword` shorter than 6 characters
- **THEN** the response is `400 Bad Request` with a validation error

#### Scenario: Non-ADMIN is rejected
- **WHEN** a non-ADMIN makes a request to `PATCH /users/:id/reset-password`
- **THEN** the response is `403 Forbidden`

#### Scenario: Audit log does not contain password data
- **WHEN** a password reset is performed
- **THEN** the audit log entry summary is "Password reset for {username}" and the snapshot contains only the username — no `passwordHash` field

---

### Requirement: Password reset UI
The web application SHALL provide a "Đặt lại mật khẩu" action on each user row in the `/users` page. Clicking it SHALL open a focused dialog (not the edit modal) with a single password input field. Submitting SHALL call `PATCH /api/users/:id/reset-password` and display the result inline.

#### Scenario: Reset password via dialog
- **WHEN** the ADMIN clicks "Đặt lại mật khẩu" on a user row
- **THEN** a dialog opens with a single "Mật khẩu mới" input field
- **WHEN** the ADMIN enters a valid password and confirms
- **THEN** `PATCH /api/users/:id/reset-password` is called and a success message is shown

#### Scenario: API error is shown inline
- **WHEN** the reset-password call fails (e.g., validation error)
- **THEN** the error message is displayed inside the dialog without closing it
