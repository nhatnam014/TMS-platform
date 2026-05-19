## ADDED Requirements

### Requirement: Next.js API route handlers proxy mutations to NestJS
The system SHALL provide Next.js route handlers under `apps/web/src/app/api/` that forward browser requests to the NestJS API at `http://localhost:4000/api/v1/`. Each handler MUST read the `tms_token` cookie from the incoming request and attach it as an `Authorization: Bearer` header in the outgoing NestJS request. The handler MUST forward the HTTP method, path, query parameters, and request body unchanged.

#### Scenario: BFF route forwards POST with Bearer token
- **WHEN** the browser sends `POST /api/trip-plans` with a JSON body and a valid `tms_token` cookie
- **THEN** the route handler sends `POST http://localhost:4000/api/v1/trip-plans` with the same body and `Authorization: Bearer <token>` header

#### Scenario: BFF route returns the NestJS response status and body
- **WHEN** NestJS responds with `201 Created` and a trip plan JSON body
- **THEN** the browser receives `201 Created` with the same JSON body

#### Scenario: Missing cookie in BFF route returns 401
- **WHEN** the browser sends a request to a BFF route without the `tms_token` cookie
- **THEN** the route handler returns `401 Unauthorized` without forwarding to NestJS

---

### Requirement: Auth login BFF route proxies credentials and sets the cookie
The system SHALL provide `POST /api/auth/login` as a dedicated route handler. It MUST forward `{ username, password }` to `POST http://localhost:4000/api/v1/auth/login`, extract the `access_token` from the response, and set it as an httpOnly cookie named `tms_token` (`SameSite=Lax`, `Path=/`, `HttpOnly=true`). On NestJS 401, it MUST return `401` to the browser without setting a cookie.

#### Scenario: Successful proxy sets the httpOnly cookie
- **WHEN** `POST /api/auth/login` is called with valid credentials
- **THEN** `tms_token` httpOnly cookie is set in the browser response and the body contains `{ success: true }`

#### Scenario: Failed proxy does not set a cookie
- **WHEN** `POST /api/auth/login` is called with invalid credentials and NestJS returns 401
- **THEN** the browser receives `401` with `{ message: "Invalid credentials" }` and no cookie is set

---

### Requirement: Auth logout BFF route clears the cookie
The system SHALL provide `POST /api/auth/logout` that deletes the `tms_token` cookie (sets it with `Max-Age=0`) and returns a redirect response to `/login`.

#### Scenario: Logout deletes the cookie
- **WHEN** `POST /api/auth/logout` is called
- **THEN** the `tms_token` cookie is expired in the browser response

---

### Requirement: NestJS base URL is configurable via environment variable
The system SHALL read the NestJS API base URL from `NEXT_PUBLIC_API_URL` (for client-side display only) and `API_BASE_URL` (for server-side BFF proxy, not exposed to browser). Both MUST have sensible development defaults (`http://localhost:4000/api/v1`).

#### Scenario: BFF proxy uses API_BASE_URL for NestJS calls
- **WHEN** `API_BASE_URL=http://api-service:4000/api/v1` is set
- **THEN** all BFF route handlers forward requests to that base URL instead of `localhost:4000`
