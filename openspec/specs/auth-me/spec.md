## ADDED Requirements

### Requirement: Authenticated user profile endpoint
The API SHALL expose a `GET /auth/me` endpoint protected by `JwtAuthGuard` that returns the authenticated user's `id`, `username`, and `role` decoded from the JWT payload. No database query is required.

#### Scenario: Valid token returns user profile
- **WHEN** an authenticated request is made to `GET /auth/me`
- **THEN** the response is `200 OK` with `{ id, username, role }`

#### Scenario: Missing or invalid token is rejected
- **WHEN** a request to `GET /auth/me` is made without a valid JWT
- **THEN** the response is `401 Unauthorized`

---

### Requirement: Web app exposes role via React context
The web app SHALL fetch `GET /api/auth/me` once on authenticated layout mount and store `{ username, role }` in a React context (`AuthContext`) accessible to all child components.

#### Scenario: Auth context available after mount
- **WHEN** the authenticated layout mounts
- **THEN** `useAuth()` returns the current user's `username` and `role`

#### Scenario: Auth context gracefully handles fetch failure
- **WHEN** the `/api/auth/me` fetch fails (network error or 401)
- **THEN** `useAuth()` returns `{ username: null, role: null }` without crashing the app
