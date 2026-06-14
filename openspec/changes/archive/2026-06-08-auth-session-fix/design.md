## Context

The `tms_token` cookie holds a signed JWT issued by NestJS. Currently, `middleware.ts` only checks for cookie presence — it never inspects the token. This means an expired JWT (or a JWT from a previous NestJS instance with a different secret) can pass middleware, causing the authenticated layout to render while every downstream NestJS call returns 401.

Additionally, `GET /api/auth/me` — the BFF route that `auth-context.tsx` depends on to populate `{ id, username, role }` — was never created. The NestJS `GET /api/v1/auth/me` endpoint already exists in `auth.controller.ts` and is complete; only the Next.js BFF proxy is missing.

Current state:

- Middleware: checks `cookie.exists()` only
- `/api/auth/me` Next.js route: does not exist
- Login cookie: no `maxAge` → session cookie (deleted on browser close)
- JWT: 7-day expiry via `ACCESS_TOKEN_EXPIRY=7d`

## Goals / Non-Goals

**Goals:**

- Redirect to `/login` when the JWT is expired or malformed (not just absent)
- Create the `/api/auth/me` BFF route so `AuthContext` can populate `role`
- Align cookie lifetime with JWT expiry (7 days) so they expire together

**Non-Goals:**

- JWT signature verification in middleware (requires Edge-compatible crypto setup; expiry check alone is sufficient for UX correctness — signature validity is enforced by NestJS on every API call)
- Changing the NestJS `GET /api/v1/auth/me` endpoint (already correct)
- Refresh token flow or sliding sessions

## Decisions

### Decision: Validate JWT expiry in middleware via `atob()`, not signature

**Choice**: Decode the JWT payload using `atob()` + base64url conversion and check `payload.exp`. Do NOT verify the signature in middleware.

**Rationale**: Next.js middleware runs in the Edge Runtime where `crypto.subtle` exists but importing `jose` as an ESM package requires dependency changes. Expiry-only validation catches the primary UX failure (stale session) without full signature verification. NestJS validates the signature on every real API call anyway; middleware is a fast gate, not a security boundary.

**Alternatives considered**:

- `jose` library with `jwtVerify` in Edge — correct but requires adding a dependency and accessing `JWT_SECRET` in the middleware environment
- `jsonwebtoken` — not Edge-compatible

### Decision: BFF `/api/auth/me` decodes JWT payload locally, does not proxy to NestJS

**Choice**: Read the `tms_token` cookie server-side, base64url-decode the JWT payload using `Buffer.from(..., "base64url")`, and return `{ id: payload.sub, username: payload.username, role: payload.role }`.

**Rationale**: The payload was written by our own NestJS backend and stored in an httpOnly cookie. We trust its contents for UI purposes. Proxying to NestJS adds an extra network hop and couples the BFF to NestJS availability for a read-only profile fetch. The middleware + NestJS JwtAuthGuard already enforce auth on real data calls.

**Alternatives considered**:

- Proxy GET to NestJS `/api/v1/auth/me` — correct but slower and unnecessary

### Decision: Set `maxAge: 604800` on login cookie (7 days)

**Choice**: Add `maxAge: 604800` to the `Set-Cookie` in the Next.js login BFF route to match `ACCESS_TOKEN_EXPIRY=7d`.

**Rationale**: Currently the cookie is a session cookie (no `maxAge`), deleted when the browser closes. The JWT inside it lives for 7 days. This mismatch means a restart of the browser forces re-login even though the JWT is still valid. Aligning them means the browser retains the session across restarts for the same 7-day window. The middleware expiry check becomes the hard gate when that window closes.

## Risks / Trade-offs

- **Expiry check without signature verification**: A manually crafted JWT with a future `exp` could pass middleware. This is acceptable — the signature is verified by NestJS on every actual data request. The middleware's job is UX routing, not security enforcement.
- **`atob()` edge case**: base64url → base64 conversion (`-` → `+`, `_` → `/`) must be done before calling `atob()`. A missing padding `=` can cause parse errors; wrapping in try/catch and treating parse failure as "redirect to login" mitigates this.
- **7-day persistent cookie**: With `maxAge: 604800`, the cookie survives browser restarts. If a user logs out from another device, the cookie on this device remains until the JWT expires. This is standard stateless JWT behavior; acceptable given the existing architecture.
