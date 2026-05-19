## ADDED Requirements

### Requirement: Prisma schema includes a User model
The system SHALL add a `User` model to `packages/db/prisma/schema.prisma` with fields: `id` (cuid), `username` (unique string), `passwordHash` (string), `role` (`Role` enum), `isActive` (boolean, default true), `createdAt`, `updatedAt`. A `Role` enum MUST be added with values `ADMIN`, `OPERATOR`, `VIEWER`.

#### Scenario: Migration creates the users table
- **WHEN** `pnpm db:migrate` is run after the schema change
- **THEN** a `users` table is created in PostgreSQL with all defined columns

#### Scenario: Username uniqueness is enforced at the database level
- **WHEN** two `User` records with the same `username` are inserted
- **THEN** the second insert fails with a unique constraint violation

---

### Requirement: Seed creates an initial admin user
The system SHALL update `packages/db/prisma/seed.ts` to create one `User` record with `role: ADMIN`. The password MUST be read from the `SEED_ADMIN_PASSWORD` environment variable and stored as a bcrypt hash (cost factor 12). If `SEED_ADMIN_PASSWORD` is unset, the seed MUST throw an error rather than using a default.

#### Scenario: Seed creates the admin user with a hashed password
- **WHEN** `SEED_ADMIN_PASSWORD=secret pnpm db:seed` is run
- **THEN** a user row exists in the database with `passwordHash` that is not equal to "secret" and bcrypt.compare("secret", passwordHash) returns true

#### Scenario: Seed fails if SEED_ADMIN_PASSWORD is unset
- **WHEN** `pnpm db:seed` is run without `SEED_ADMIN_PASSWORD` set
- **THEN** the process exits with a non-zero code and prints an error message

---

### Requirement: NestJS AuthModule provides a login endpoint
The system SHALL add an `AuthModule` at `apps/api/src/modules/auth/` that exposes `POST /api/v1/auth/login`. The endpoint accepts `{ username: string, password: string }`, validates credentials against the `User` record (bcrypt compare), and returns `{ access_token: string }` on success.

#### Scenario: Valid credentials return an access token
- **WHEN** `POST /api/v1/auth/login` is called with correct username and password
- **THEN** the response is `200 OK` with `{ access_token: "<JWT>" }`

#### Scenario: Invalid password returns 401
- **WHEN** `POST /api/v1/auth/login` is called with a wrong password
- **THEN** the response is `401 Unauthorized`

#### Scenario: Unknown username returns 401
- **WHEN** `POST /api/v1/auth/login` is called with a username that does not exist
- **THEN** the response is `401 Unauthorized` (same response as wrong password — no username enumeration)

---

### Requirement: JWT strategy validates Bearer tokens on protected routes
The system SHALL implement a `JwtStrategy` (passport-jwt) that extracts the Bearer token from the `Authorization` header and validates it against `JWT_SECRET`. A `JwtAuthGuard` class MUST be provided for use on controllers. The JWT payload MUST include `sub` (user id), `username`, and `role`.

#### Scenario: Valid token grants access
- **WHEN** a request to a protected endpoint includes a valid `Authorization: Bearer <token>` header
- **THEN** the request is processed normally and the response is returned

#### Scenario: Missing token returns 401
- **WHEN** a request to a protected endpoint has no `Authorization` header
- **THEN** the response is `401 Unauthorized`

#### Scenario: Expired or tampered token returns 401
- **WHEN** a request to a protected endpoint includes a token signed with a different secret or past its expiry
- **THEN** the response is `401 Unauthorized`

---

### Requirement: All existing API controllers are protected with JwtAuthGuard
The system SHALL apply `@UseGuards(JwtAuthGuard)` to all methods in `TripPlanController`, `VehicleController`, and `DashboardController`. The `AuthController` login endpoint MUST remain public (no guard).

#### Scenario: Unauthenticated request to trip-plan is rejected
- **WHEN** `GET /api/v1/trip-plans` is called without an Authorization header
- **THEN** the response is `401 Unauthorized`

#### Scenario: Login endpoint is accessible without a token
- **WHEN** `POST /api/v1/auth/login` is called without an Authorization header
- **THEN** the request is processed (not blocked by a guard)

---

### Requirement: Next.js login page authenticates and sets the httpOnly cookie
The system SHALL provide a `/login` page with a username/password form. On submit, it MUST call the Next.js BFF route `POST /api/auth/login`, which proxies to NestJS, receives the `access_token`, and sets an httpOnly cookie named `tms_token` with `SameSite=Lax` and `Path=/`. On success, the browser is redirected to `/dashboard`.

#### Scenario: Successful login sets the cookie and redirects
- **WHEN** a user submits valid credentials on the login page
- **THEN** the `tms_token` httpOnly cookie is set in the browser and the user is redirected to `/dashboard`

#### Scenario: Failed login shows an error message
- **WHEN** a user submits invalid credentials on the login page
- **THEN** an error message is displayed on the login page and no cookie is set

---

### Requirement: Next.js middleware protects all routes except /login and static assets
The system SHALL include `apps/web/middleware.ts` that checks for the `tms_token` cookie on every incoming request. If the cookie is absent or cannot be parsed, the user MUST be redirected to `/login`. Requests to `/login`, `/api/auth/*`, and Next.js internal paths (`/_next/*`, `/favicon.ico`) MUST be excluded from the check.

#### Scenario: Unauthenticated user is redirected to /login
- **WHEN** an unauthenticated user navigates to `/dashboard`
- **THEN** they are redirected to `/login`

#### Scenario: Login page is accessible without a cookie
- **WHEN** an unauthenticated user navigates to `/login`
- **THEN** the login page is rendered without redirect

#### Scenario: Authenticated user passes middleware
- **WHEN** a user with a valid `tms_token` cookie navigates to `/dashboard`
- **THEN** the middleware allows the request through without redirect

---

### Requirement: Logout clears the tms_token cookie
The system SHALL provide a `POST /api/auth/logout` route handler that deletes the `tms_token` cookie and redirects the user to `/login`.

#### Scenario: Logout clears the session
- **WHEN** the user triggers a logout action
- **THEN** the `tms_token` cookie is cleared and the user is redirected to `/login`
