## 1. Shared Types

- [x] 1.1 Add `AuditAction` type to `packages/shared/src/index.ts` (9 values: CREATE, UPDATE, DELETE, STATUS_CHANGE, COST_ADDED, LOGIN, LOGIN_FAILED, LOGOUT, REGISTER)
- [x] 1.2 Add `ENTITY_TYPES` constant object to `packages/shared/src/index.ts` (TripPlan, TripCost, YardMove, YardMoveCost, User, Vehicle, Container)
- [x] 1.3 Add `AuditLogFilters` interface to `packages/shared/src/index.ts` (action?, entityType?, entityId?, actorUserId?, dateFrom?, dateTo?)

## 2. Prisma Schema & Migration

- [x] 2.1 Add `AuditAction` enum to `packages/db/prisma/schema.prisma` (9 values matching shared type)
- [x] 2.2 Add `AuditLog` model to `packages/db/prisma/schema.prisma` with all required fields (id, actorUserId, actorUsername, actorRole, action, entityType, entityId, summary, beforeSnapshot, afterSnapshot, metadata, ipAddress, userAgent, createdAt — no updatedAt)
- [x] 2.3 Add indexes to `AuditLog`: `@@index([entityType, entityId])`, `@@index([actorUserId, createdAt])`, `@@index([action, createdAt])`, `@@index([createdAt])`
- [x] 2.4 Run `pnpm db:generate` to regenerate Prisma client
- [x] 2.5 Run `pnpm db:migrate -- --name add_audit_log` to apply migration

## 3. AuditContextService (AsyncLocalStorage)

- [x] 3.1 Create `apps/api/src/modules/audit/audit-context.service.ts` — singleton `@Injectable()` wrapping `AsyncLocalStorage<AuditContext>`; expose `run(ctx, fn)` and `get()` methods
- [x] 3.2 Define `AuditContext` interface: `{ userId?: string; username?: string; role?: string; ipAddress?: string; userAgent?: string }`

## 4. AuditContextInterceptor

- [x] 4.1 Create `apps/api/src/modules/audit/audit-context.interceptor.ts` — global `NestInterceptor` that extracts `request.user` and headers (`x-forwarded-for`, `user-agent`) on each request and calls `auditContextService.run(ctx, () => next.handle())`
- [x] 4.2 Handle the unauthenticated case gracefully: if `request.user` is undefined, set actor fields to undefined (do not throw)

## 5. AuditService

- [x] 5.1 Create `apps/api/src/modules/audit/audit.service.ts` with `log(params, tx?)` method
- [x] 5.2 `log()` params type: `{ action: AuditAction; entityType: string; entityId?: string; summary: string; beforeSnapshot?: object; afterSnapshot?: object; metadata?: object }`
- [x] 5.3 Inside `log()`, call `auditContextService.get()` to populate `actorUserId`, `actorUsername`, `actorRole`, `ipAddress`, `userAgent`
- [x] 5.4 When `tx` is provided, write via `tx.auditLog.create()`; otherwise write via `this.prisma.auditLog.create()`

## 6. AuditController & Role Guard

- [x] 6.1 Create `apps/api/src/modules/audit/roles.guard.ts` — a `CanActivate` guard that checks `request.user.role === 'ADMIN'`; returns 403 if not admin
- [x] 6.2 Create `apps/api/src/modules/audit/audit.controller.ts` — `GET /audit-logs` with `@UseGuards(JwtAuthGuard, RolesGuard)`, query params matching `AuditLogFilters` + `page`/`limit`, calls `auditService.findAll(filters, pagination)`
- [x] 6.3 Implement `AuditService.findAll(filters, pagination)` — paginated query on `audit_logs` table applying all filter conditions, ordered by `createdAt DESC`

## 7. AuditModule

- [x] 7.1 Create `apps/api/src/modules/audit/audit.module.ts` — `@Global()` module providing `AuditContextService`, `AuditService`, `AuditContextInterceptor` (registered as `APP_INTERCEPTOR`), and `AuditController`
- [x] 7.2 Register `AuditModule` in `apps/api/src/app.module.ts` imports

## 8. Hook TripPlanService

- [x] 8.1 Inject `AuditService` into `TripPlanService` constructor
- [x] 8.2 Wrap `create()` in `$transaction`; capture `afterSnapshot` from created entity; call `auditService.log({ action: 'CREATE', entityType: ENTITY_TYPES.TRIP_PLAN, entityId: result.id, summary: '...', afterSnapshot: result }, tx)`
- [x] 8.3 Extend existing `$transaction` in `updateStatus()` (DROP_AND_HOOK path) and wrap the STANDARD path in its own `$transaction`; capture `beforeSnapshot: { status: oldStatus }` and `afterSnapshot: { status: newStatus }`; call `auditService.log({ action: 'STATUS_CHANGE', ... }, tx)`
- [x] 8.4 Wrap `addCost()` in `$transaction`; call `auditService.log({ action: 'COST_ADDED', entityType: ENTITY_TYPES.TRIP_COST, entityId: cost.id, summary: '...', afterSnapshot: cost, metadata: { tripPlanId } }, tx)`
- [x] 8.5 Wrap `delete()` in `$transaction`; capture `beforeSnapshot` from `findOne()` result; call `auditService.log({ action: 'DELETE', entityType: ENTITY_TYPES.TRIP_PLAN, entityId: id, summary: '...', beforeSnapshot }, tx)`

## 9. Hook YardMoveService

- [x] 9.1 Inject `AuditService` into `YardMoveService` constructor
- [x] 9.2 Wrap `create()` in `$transaction`; call `auditService.log({ action: 'CREATE', entityType: ENTITY_TYPES.YARD_MOVE, entityId: result.id, summary: '...', afterSnapshot: result }, tx)`
- [x] 9.3 Extend existing `$transaction` in `updateStatus()` (COMPLETED path) and wrap non-COMPLETED path in its own `$transaction`; capture before/after status; call `auditService.log({ action: 'STATUS_CHANGE', ... }, tx)`
- [x] 9.4 Wrap `addCost()` in `$transaction`; call `auditService.log({ action: 'COST_ADDED', entityType: ENTITY_TYPES.YARD_MOVE_COST, entityId: cost.id, summary: '...', afterSnapshot: cost, metadata: { yardMoveId: id } }, tx)`

## 10. Hook AuthService

- [x] 10.1 Inject `AuditService` into `AuthService` constructor
- [x] 10.2 Restructure `login()` with try/catch; on success call `auditService.log({ action: 'LOGIN', entityType: ENTITY_TYPES.USER, entityId: user.id, summary: 'User logged in', actorUserId: user.id })` (standalone, no tx)
- [x] 10.3 In the catch block, call `auditService.log({ action: 'LOGIN_FAILED', entityType: ENTITY_TYPES.USER, summary: 'Failed login attempt', metadata: { attemptedUsername: username } })` before re-throwing

## 11. Verification

- [x] 11.1 Run `cd apps/api && npx tsc --noEmit` and fix any TypeScript errors
- [ ] 11.2 Manually verify: create a TripPlan → check `GET /audit-logs?entityType=TripPlan` returns a CREATE entry with actorUsername and afterSnapshot
- [ ] 11.3 Manually verify: attempt login with wrong password → check `GET /audit-logs?action=LOGIN_FAILED` returns an entry with the attempted username
- [ ] 11.4 Manually verify: call `GET /audit-logs` with an OPERATOR token → confirm 403 response
