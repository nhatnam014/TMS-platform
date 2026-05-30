## Why

There is currently no way for administrators to manage system users from the UI — creating new accounts, changing roles, or deactivating users requires direct database access. The platform needs a self-contained admin interface for user lifecycle management.

## What Changes

- Add `GET /users`, `POST /users`, `PATCH /users/:id`, and `PATCH /users/:id/reset-password` API endpoints, all restricted to ADMIN role
- Modify `JwtStrategy.validate()` to query the database on every request and reject tokens for deactivated users (`isActive: false`)
- Add a new `/users` frontend page (ADMIN-only) with table, create/edit modals, and password reset action
- Add "Người dùng" nav entry to the ADMIN-only sidebar block

## Capabilities

### New Capabilities

- `user-crud`: List, create, and update users (role + isActive). Admin can create accounts with an initial password. Username is immutable after creation. No hard delete — deactivate via `isActive: false`.
- `user-password-reset`: Admin resets a user's password via a dedicated `PATCH /users/:id/reset-password` endpoint. No email involved — admin communicates the new password out-of-band.

### Modified Capabilities

- `jwt-authentication`: JWT validation now performs a DB lookup on every request to enforce `isActive` status. Deactivated users receive `401` even with a valid, unexpired token.

## Impact

- `apps/api/src/modules/auth/jwt.strategy.ts` — inject `PrismaService`, add DB check in `validate()`
- `apps/api/src/modules/` — new `user/` module (controller, service, module, DTOs)
- `apps/api/src/app.module.ts` — register `UserModule`
- `apps/web/src/app/(authenticated)/users/page.tsx` — new ADMIN-only page
- `apps/web/src/components/nav-sidebar.tsx` — add "Người dùng" to ADMIN block
- `packages/shared/src/index.ts` — add `CreateUserDto`, `UpdateUserDto` interfaces
- No schema migrations needed — `User` model is already complete
