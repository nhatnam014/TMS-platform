## 1. Shared Types

- [x] 1.1 Add `CreateUserDto`, `UpdateUserDto` interfaces to `packages/shared/src/index.ts`
- [x] 1.2 Add `UserRole` type alias (`"ADMIN" | "OPERATOR" | "VIEWER"`) to `packages/shared/src/index.ts`

## 2. Backend — JWT Strategy (isActive enforcement)

- [x] 2.1 In `apps/api/src/modules/auth/jwt.strategy.ts`, inject `PrismaService`, make `validate()` async, add `prisma.user.findUnique({ where: { id: payload.sub } })`, throw `UnauthorizedException` if user not found or `isActive === false`, return `role` from DB record (not token)

## 3. Backend — User Module (new)

- [x] 3.1 Create `apps/api/src/modules/user/` directory with `user.module.ts`, `user.service.ts`, `user.controller.ts`
- [x] 3.2 Create `apps/api/src/modules/user/dto/create-user.dto.ts` (`username` required, `password` required min-length 6, `role` required enum)
- [x] 3.3 Create `apps/api/src/modules/user/dto/update-user.dto.ts` (all optional: `role` enum, `isActive` boolean)
- [x] 3.4 Create `apps/api/src/modules/user/dto/reset-password.dto.ts` (`newPassword` required min-length 6)
- [x] 3.5 In `user.service.ts`, implement `findAll()`: return all users ordered by `createdAt` desc, select `id, username, role, isActive, createdAt` (exclude `passwordHash`)
- [x] 3.6 In `user.service.ts`, implement `create(dto, actorId)`: hash password with `bcrypt.hash(password, 10)`, create user, audit log `CREATE`, handle Prisma `P2002` as `409 ConflictException`
- [x] 3.7 In `user.service.ts`, implement `update(id, dto, actorId)`: find user (throw `404` if not found), guard self-deactivation (throw `403` if `actorId === id && dto.isActive === false`), wrap in `$transaction`, update fields, audit log `UPDATE` with before/after snapshot (excluding `passwordHash`)
- [x] 3.8 In `user.service.ts`, implement `resetPassword(id, newPassword)`: find user (throw `404` if not found), hash new password, update `passwordHash`, audit log `UPDATE` with summary `"Password reset for {username}"` and snapshot `{ username }` only
- [x] 3.9 In `user.controller.ts`, add `@Get()`, `@Post()`, `@Patch(':id')`, `@Patch(':id/reset-password')` endpoints with `@UseGuards(JwtAuthGuard, RolesGuard)`, `@ApiTags("Users")`, `@ApiBearerAuth`; pass `req.user.userId` as `actorId` to service methods that need it
- [x] 3.10 Register `UserModule` in `apps/api/src/app.module.ts`

## 4. Frontend — Users Page (new, ADMIN-only)

- [x] 4.1 Create `apps/web/src/app/(authenticated)/users/page.tsx` as `"use client"` component; add role guard at top: if `role !== "ADMIN"` redirect to `/dashboard`
- [x] 4.2 Fetch `GET /api/users` on mount; render table with columns: Username, Role (badge: ADMIN=red, OPERATOR=blue, VIEWER=gray), Status (Active/Inactive badge), Ngày tạo, Actions
- [x] 4.3 Add "Tạo người dùng" button → create modal with 3 fields: username (required), password (required), role dropdown (required) — calls `POST /api/users`
- [x] 4.4 Add "Sửa" button per row → edit modal with 2 fields: role dropdown and isActive toggle (username label shown read-only, not editable) — calls `PATCH /api/users/:id`
- [x] 4.5 Add "Đặt lại mật khẩu" button per row → separate password reset dialog with single `newPassword` input — calls `PATCH /api/users/:id/reset-password`; show success/error message inline
- [x] 4.6 Show API errors inline in all modals; refresh list after successful mutation

## 5. Frontend — Navigation

- [x] 5.1 Add `{ href: "/users", label: "Người dùng" }` to the ADMIN-only block in `apps/web/src/components/nav-sidebar.tsx` (after "Nhật ký kiểm tra")

## 6. Verification

- [x] 6.1 Run `npx tsc --noEmit -p apps/api/tsconfig.json` and fix any type errors
- [x] 6.2 Run `npx tsc --noEmit -p apps/web/tsconfig.json` and fix any type errors
- [ ] 6.3 Manually verify: create a user, log in as that user, verify access, deactivate the user, verify their existing token is rejected on next request, reset password, verify new password works
