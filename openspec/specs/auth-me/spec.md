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

The web app SHALL expose `GET /api/auth/me` as a Next.js Route Handler. The handler MUST read the `tms_token` httpOnly cookie from the incoming request, base64url-decode the JWT payload segment, and return `{ id: payload.sub, username: payload.username, role: payload.role }` as JSON. If the cookie is absent or the payload cannot be parsed, the handler MUST return `401 Unauthorized`. The `auth-context.tsx` component SHALL fetch this endpoint once on authenticated layout mount and store the result in `AuthContext`, accessible via `useAuth()`.

#### Scenario: Auth context available after mount

- **WHEN** the authenticated layout mounts for a logged-in user
- **THEN** `useAuth()` returns `{ id, username, role }` populated from the `/api/auth/me` response

#### Scenario: Auth context gracefully handles fetch failure

- **WHEN** the `/api/auth/me` fetch fails (network error or 401)
- **THEN** `useAuth()` returns `{ id: null, username: null, role: null }` without crashing the app

#### Scenario: BFF route returns user data from cookie

- **WHEN** `GET /api/auth/me` is called with a valid `tms_token` cookie
- **THEN** the response is `200 OK` with `{ id, username, role }` decoded from the JWT payload

#### Scenario: BFF route rejects absent cookie

- **WHEN** `GET /api/auth/me` is called without a `tms_token` cookie
- **THEN** the response is `401 Unauthorized`
