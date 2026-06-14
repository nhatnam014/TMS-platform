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

The system SHALL implement a `JwtStrategy` (passport-jwt) that extracts the Bearer token from the `Authorization` header and validates it against `JWT_SECRET`. A `JwtAuthGuard` class MUST be provided for use on controllers. The JWT payload MUST include `sub` (user id), `username`, and `role`. On every token validation, the strategy MUST query the database to verify the user exists and `isActive` is `true`. If the user is not found or `isActive` is `false`, the strategy MUST throw `UnauthorizedException`. The `role` returned to the request context MUST come from the database record (not the token payload) to reflect any role changes without requiring re-login.

#### Scenario: Valid token grants access

- **WHEN** a request to a protected endpoint includes a valid `Authorization: Bearer <token>` header for an active user
- **THEN** the request is processed normally and the response is returned

#### Scenario: Missing token returns 401

- **WHEN** a request to a protected endpoint has no `Authorization` header
- **THEN** the response is `401 Unauthorized`

#### Scenario: Expired or tampered token returns 401

- **WHEN** a request to a protected endpoint includes a token signed with a different secret or past its expiry
- **THEN** the response is `401 Unauthorized`

#### Scenario: Deactivated user is rejected even with a valid token

- **WHEN** a user's `isActive` is set to `false` and they make a request with their previously-valid token
- **THEN** the response is `401 Unauthorized`

#### Scenario: Role change takes effect immediately

- **WHEN** an ADMIN changes a user's role from `ADMIN` to `OPERATOR`
- **THEN** the user's next request reflects the `OPERATOR` role (read from DB, not from the old token)

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

The system SHALL provide a `/login` page with a username/password form. On submit, it MUST call the Next.js BFF route `POST /api/auth/login`, which proxies to NestJS, receives the `access_token`, and sets an httpOnly cookie named `tms_token` with `SameSite=Lax`, `Path=/`, and `maxAge: 604800` (7 days, matching `ACCESS_TOKEN_EXPIRY`). On success, the browser is redirected to `/dashboard`.

#### Scenario: Successful login sets the cookie and redirects

- **WHEN** a user submits valid credentials on the login page
- **THEN** the `tms_token` httpOnly cookie is set with a 7-day `maxAge` and the user is redirected to `/dashboard`

#### Scenario: Failed login shows an error message

- **WHEN** a user submits invalid credentials on the login page
- **THEN** an error message is displayed on the login page and no cookie is set

#### Scenario: Cookie persists across browser restarts

- **WHEN** a user logs in and then closes and reopens the browser within 7 days
- **THEN** the `tms_token` cookie is still present and the user remains authenticated

---

### Requirement: Next.js middleware protects all routes except /login and static assets

The system SHALL include `apps/web/middleware.ts` that checks for the `tms_token` cookie on every incoming request. If the cookie is absent, the JWT payload cannot be parsed, or the JWT `exp` claim is in the past, the middleware MUST delete the `tms_token` cookie and redirect the user to `/login`. Requests to `/login`, `/api/auth/*`, and Next.js internal paths (`/_next/*`, `/favicon.ico`) MUST be excluded from the check.

#### Scenario: Unauthenticated user is redirected to /login

- **WHEN** an unauthenticated user navigates to `/dashboard`
- **THEN** they are redirected to `/login`

#### Scenario: Login page is accessible without a cookie

- **WHEN** an unauthenticated user navigates to `/login`
- **THEN** the login page is rendered without redirect

#### Scenario: Authenticated user passes middleware

- **WHEN** a user with a valid non-expired `tms_token` cookie navigates to `/dashboard`
- **THEN** the middleware allows the request through without redirect

#### Scenario: Expired JWT is rejected by middleware

- **WHEN** a user's `tms_token` cookie contains a JWT whose `exp` claim is in the past
- **THEN** middleware deletes the cookie and redirects the user to `/login`

#### Scenario: Malformed JWT is rejected by middleware

- **WHEN** a user's `tms_token` cookie contains a value that cannot be parsed as a JWT
- **THEN** middleware deletes the cookie and redirects the user to `/login`

---

### Requirement: Logout clears the tms_token cookie

The system SHALL provide a `POST /api/auth/logout` route handler that deletes the `tms_token` cookie. After logout, the client MUST perform a hard browser navigation (full page reload) to `/login`, not a client-side SPA navigation, so that the Next.js Router Cache is flushed and middleware re-evaluates authentication on the next request.

#### Scenario: Logout clears the session

- **WHEN** the user triggers a logout action
- **THEN** the `tms_token` cookie is cleared and the user is redirected to `/login`

#### Scenario: Back navigation after logout is blocked by middleware

- **WHEN** the user triggers logout and then navigates back to an authenticated route (via browser Back, direct URL, or bookmark)
- **THEN** middleware detects the absent `tms_token` cookie and redirects the user to `/login`

#### Scenario: Logout does not leave cached authenticated pages accessible

- **WHEN** the user logs out
- **THEN** the Next.js Router Cache is cleared (full page reload), preventing authenticated page payloads from being served without a valid cookie
