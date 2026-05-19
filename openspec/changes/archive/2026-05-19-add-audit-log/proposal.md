## Why

The TMS has no audit trail — dispatchers and admins can modify trip plans, yard moves, and vehicles with no record of who changed what or when. This makes accountability impossible: if a trip status is incorrectly updated or a yard move cost is added erroneously, there is no way to reconstruct what happened, who did it, or what the data looked like before.

## What Changes

- **Add `AuditLog` Prisma model** — an append-only table capturing actor, action, entity reference, before/after snapshots, request context (IP, user-agent), and freeform metadata.
- **Add `AuditAction` enum** — `CREATE`, `UPDATE`, `DELETE`, `STATUS_CHANGE`, `COST_ADDED`, `LOGIN`, `LOGIN_FAILED`, `LOGOUT`, `REGISTER` — used in both Prisma schema and `@tms/shared`.
- **Add `ENTITY_TYPES` constants to `@tms/shared`** — string constants for entity type values (`"TripPlan"`, `"YardMove"`, `"Vehicle"`, `"User"`, etc.) used at call sites instead of raw strings.
- **Add `AuditContextService`** — wraps Node.js `AsyncLocalStorage` to propagate actor context (userId, username, role, IP, user-agent) through the request lifecycle without modifying service signatures.
- **Add `AuditContextInterceptor`** — a global NestJS interceptor that extracts actor context from the JWT and HTTP headers at request entry and stores it via `AuditContextService`.
- **Add `AuditService`** — writes `AuditLog` records; accepts an optional Prisma transaction client so audit writes participate in the same database transaction as the business mutation.
- **Add `AuditModule`** — wires `AuditContextService`, `AuditService`, and the interceptor; registered as a global module.
- **Hook audit into mutating service methods** — `TripPlanService` (create, updateStatus, addCost, delete) and `YardMoveService` (create, updateStatus, addCost). Each method is wrapped in a `$transaction` if not already, and calls `auditService.log(params, tx)` inside that transaction.
- **Hook audit into `AuthService.login()`** — captures `LOGIN` on success and `LOGIN_FAILED` on failure as standalone awaited writes (no business transaction to join).
- **Add `GET /audit-logs` endpoint** — read-only, admin-only, supports filtering by `action`, `entityType`, `entityId`, `actorUserId`, date range; paginated.

## Capabilities

### New Capabilities

- `audit-log`: Append-only audit trail — `AuditLog` Prisma model, `AuditAction` enum, `AuditContextService` (AsyncLocalStorage), `AuditContextInterceptor`, `AuditService`, hooks in TripPlan/YardMove/Auth mutating methods, and `GET /audit-logs` query API.

### Modified Capabilities

<!-- none — no existing specs cover audit logging or observability -->

## Impact

- **`packages/db/prisma/schema.prisma`** — new `AuditLog` model; new `AuditAction` enum
- **`packages/db/prisma/seed.ts`** — no changes required
- **`packages/shared/src/index.ts`** — new `AuditAction` type, `ENTITY_TYPES` constant, `AuditLogFilters` interface
- **`apps/api/src/modules/audit/`** — new module: `AuditContextService`, `AuditService`, `AuditContextInterceptor`, `AuditController`, `AuditModule`
- **`apps/api/src/modules/trip-plan/trip-plan.service.ts`** — wrap mutating methods in `$transaction`; add `auditService.log()` calls
- **`apps/api/src/modules/yard-move/yard-move.service.ts`** — wrap mutating methods in `$transaction`; add `auditService.log()` calls
- **`apps/api/src/modules/auth/auth.service.ts`** — add try/catch around `login()` to capture `LOGIN_FAILED`; add `auditService.log()` calls
- **`apps/api/src/app.module.ts`** — register `AuditModule` as global
- **`apps/web`** — out of scope for this change; audit log viewer UI is a follow-up
