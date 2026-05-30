## MODIFIED Requirements

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
