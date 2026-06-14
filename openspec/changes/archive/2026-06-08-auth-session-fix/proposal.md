## Why

After app restart (or browser-session end), the `tms_token` cookie is either absent or holds a JWT that the middleware never validates — only presence is checked. This causes two failures: (1) an unauthenticated client sees the dashboard briefly before errors flood in because middleware passes stale/present-but-invalid cookies through, and (2) the `/api/auth/me` BFF route was never created, so the `AuthContext` always returns `{ id: null, username: null, role: null }`, breaking role-based UI for all users.

## What Changes

- **Create `GET /api/auth/me` Next.js BFF route** that reads the `tms_token` httpOnly cookie server-side, base64-decodes the JWT payload, and returns `{ id, username, role }` — no extra npm dependency required.
- **Create `GET /api/v1/auth/me` NestJS endpoint** protected by `JwtAuthGuard` that returns the authenticated user's profile from the token payload.
- **Enhance middleware JWT validation** to decode the JWT payload and check the `exp` claim; an expired or malformed token triggers a redirect to `/login` and cookie deletion — same as an absent cookie.
- **Align cookie lifetime with JWT expiry** by setting `maxAge` on the login cookie to match `ACCESS_TOKEN_EXPIRY` (7 days = 604800 seconds), so the browser cookie and JWT expire together.

## Capabilities

### New Capabilities

- none

### Modified Capabilities

- `jwt-authentication`: Middleware must validate JWT expiry (not just cookie presence); login cookie must carry `maxAge` matching the JWT expiry so cookie and token expire together.
- `auth-me`: Implement the previously-specified but never-created `GET /api/auth/me` BFF route and the NestJS `GET /api/v1/auth/me` endpoint.

## Impact

- **Modified files**: `apps/web/middleware.ts`, `apps/web/src/app/api/auth/login/route.ts`
- **New files**: `apps/web/src/app/api/auth/me/route.ts`, `apps/api/src/modules/auth/auth.controller.ts` (new endpoint)
- No new npm dependencies
- No database schema changes
- Login response is unchanged; cookie gets an added `maxAge` attribute (non-breaking)
- Middleware change is backward-compatible: valid tokens continue to pass; only expired/malformed tokens are newly rejected at middleware level
