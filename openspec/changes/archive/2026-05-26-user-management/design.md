## Context

The current `JwtStrategy.validate()` is fully stateless — it trusts the token payload without touching the database. The `User` model already has all needed fields (`username`, `passwordHash`, `role`, `isActive`). `RolesGuard` already exists in `apps/api/src/modules/audit/` and enforces ADMIN-only access. `bcrypt` is already used in `AuthService.login()`.

No schema migration is required. The change is purely additive: a new `UserModule` + a small modification to JWT validation.

## Goals / Non-Goals

**Goals:**
- ADMIN users can list, create, and update (role/isActive) other users from the UI
- ADMIN users can reset any user's password via a dedicated endpoint
- Deactivated users are rejected on every request, not just at login
- Audit log captures all mutations

**Non-Goals:**
- Hard delete
- Self-service password change (users changing their own password)
- Email-based password recovery
- "Force change on next login" flag
- Username mutation after creation
- Pagination (team < 50 users)

## Decisions

### D1: JwtStrategy injects PrismaService for isActive check

`JwtStrategy.validate()` becomes `async` and calls `prisma.user.findUnique({ where: { id: payload.sub } })`. If the user is not found or `isActive === false`, it throws `UnauthorizedException`.

**Why:** The requirement is that deactivated users are rejected immediately, even while holding a valid token. A stateless JWT cannot enforce this — the check must hit the database.

**Trade-off:** Every authenticated request now incurs 1 extra DB query. Acceptable for an internal tool with low concurrency. `PrismaService` is globally exported from `AppModule`, so no module wiring change is needed in `AuthModule`.

**Alternative considered:** Add a short-lived blacklist in Redis. Rejected — introduces a new dependency (Redis) for marginal benefit in a small-team context.

### D2: New UserModule follows established service/controller/DTO pattern

`apps/api/src/modules/user/` with `user.module.ts`, `user.service.ts`, `user.controller.ts`, and `dto/`. Follows the same pattern as `CustomerModule`, `DriverModule`, etc.

**Why:** Consistency with the rest of the codebase. `UserService` injects `PrismaService` (global) and `AuditService` (global), so `UserModule` needs no additional imports.

**Note:** `RolesGuard` lives in `apps/api/src/modules/audit/roles.guard.ts` and is imported directly — no need to move or re-export it.

### D3: Separate reset-password endpoint

`PATCH /users/:id/reset-password` is distinct from `PATCH /users/:id`. The main PATCH handles `role` and `isActive` only. Reset-password has its own body `{ newPassword }`.

**Why:** Separates concerns — edit profile (role/status) vs. credential reset. Prevents accidental password overwrites in a general PATCH. Also allows different audit summary ("Password reset for X" without logging any credential data).

### D4: Self-deactivation guard in service layer

`UserService.update()` checks: if `dto.isActive === false` and `actorId === id`, throw `ForbiddenException`. The `actorId` comes from the JWT payload passed from the controller (`req.user.userId`).

**Why:** Guards at the service layer are testable and don't depend on HTTP context. This prevents the last admin from locking themselves out.

### D5: Password never returned or logged

`user.service.ts` always uses `omit` pattern (select specific fields excluding `passwordHash`) in all query return values. Reset-password endpoint returns `{ message: "Mật khẩu đã được đặt lại" }`. Audit snapshot for password reset includes only `{ username }` — no hash, no plaintext.

### D6: Frontend page is ADMIN-only, enforced client-side

The `/users` page checks `role === "ADMIN"` from `useAuth()` and redirects to `/dashboard` if not. The API already enforces `RolesGuard` independently — the client-side gate is UX, not security.

## Risks / Trade-offs

- **DB query per request** — Every JWT validation now queries `users` table. For a small internal tool this is negligible. If load grows, add a Redis session cache later.
- **Token still valid after role change** — When an admin changes a user's role (e.g., OPERATOR → VIEWER), the old role is in the existing JWT. Because `validate()` now reads role from the DB, the new role takes effect immediately on next request. ✓ No risk.
- **Race condition on self-deactivation** — Two ADMIN tabs open simultaneously could theoretically both pass the "not self" check and deactivate the account. Acceptable edge case for internal tool.
- **bcrypt cost factor** — Using the existing `bcrypt.hash(password, 10)` cost factor from `AuthService`. Consistent with current login behavior.

## Open Questions

None — scope is clear and patterns are established.
