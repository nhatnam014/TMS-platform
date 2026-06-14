## MODIFIED Requirements

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
