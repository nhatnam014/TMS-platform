## Context

The TMS is a NestJS + Prisma + PostgreSQL backend with a Next.js frontend. All mutating operations occur through NestJS service methods protected by `JwtAuthGuard`. The JWT payload contains `{ sub (userId), username, role }`. The current `User` model has `id`, `username`, `role`, `passwordHash`, `isActive` — no `email` or display name field.

Existing services (`TripPlanService`, `YardMoveService`) already call `findOne()` before mutations for authorization/existence checks, making "before snapshot" capture cost-free for most operations. Some methods (`create`, `addCost`, `delete`) are not currently wrapped in `$transaction`.

## Goals / Non-Goals

**Goals:**
- Capture every state-changing operation with actor identity, timestamp, before/after data, and request context
- Keep audit writes atomic with the business mutation (same transaction — if the mutation rolls back, the audit log also rolls back)
- Zero changes to service method signatures — caller APIs unchanged
- Support filtering the audit trail by action, entity, actor, and date range

**Non-Goals:**
- Frontend audit log viewer UI (follow-up change)
- Audit trail for read operations (GET endpoints are not logged)
- Audit for vehicle CRUD (VehicleService has no mutations in current codebase)
- Real-time audit streaming or webhooks
- Per-field change diffing beyond before/after JSON snapshots

---

### Decision 1: AsyncLocalStorage for request context propagation

**Choice**: A singleton `AuditContextService` wraps Node.js `AsyncLocalStorage`. A global `AuditContextInterceptor` runs before every request, extracts `{ userId, username, role }` from `request.user` and `{ ipAddress, userAgent }` from request headers, and stores them via `AuditContextService.run(ctx, next)`. Any code executing within that async context can call `AuditContextService.get()` to read the actor context without receiving it as a parameter.

**Rationale**: No changes to service method signatures (existing `create(dto)`, `updateStatus(id, status)`, etc. stay identical). Request-scoped injection would require making PrismaService request-scoped (performance regression) or using `@Inject(REQUEST)` on every service.

**Alternative considered**: Explicit `ctx` parameter on every service method — rejected because it requires modifying ~10 method signatures and all their callers.

---

### Decision 2: `actorUsername` instead of `actor_email` / `actor_name`

**Choice**: The `AuditLog` model stores `actorUserId` (String?) and `actorUsername` (String?) — NOT `actorEmail` or `actorName`. The current `User` model has no `email` or display name field; only `username` is available from the JWT payload.

**Rationale**: Shipping nullable `actorEmail`/`actorName` columns that will always be null is misleading. `actorUsername` accurately reflects what we have. If the User model gains `email`/`displayName` in a future change, a follow-up migration can add those audit columns.

**Alternative considered**: Adding `email` and `displayName` to `User` in this change — rejected as out of scope; audit log infrastructure should not depend on unrelated User model changes.

---

### Decision 3: `auditService.log(params, tx?)` — optional transaction client

**Choice**: `AuditService.log(params, tx?)` accepts an optional Prisma transaction client as its second argument. When `tx` is provided, the audit write uses that client (participates in the caller's transaction). When `tx` is omitted (auth events, standalone writes), the service uses its own `PrismaService` instance.

Service methods that currently have no `$transaction` are wrapped in one:

```
Before: return this.prisma.tripPlan.create({ data })
After:  return this.prisma.$transaction(async (tx) => {
          const result = await tx.tripPlan.create({ data });
          await this.auditService.log({ action: 'CREATE', ... }, tx);
          return result;
        });
```

Methods that already have `$transaction` (e.g., DROP_AND_HOOK `updateStatus`) simply add the `auditService.log(params, tx)` call inside the existing callback.

**Rationale**: If a mutation fails and rolls back, the audit log rolls back with it — no phantom audit entries for operations that never committed. This was decision #1 from the user's confirmed requirements.

**Alternative considered**: Fire-and-forget audit writes outside the transaction — rejected; accepted by user as decision #1.

---

### Decision 4: `STATUS_CHANGE` as a distinct `AuditAction` value

**Choice**: The `AuditAction` enum includes `STATUS_CHANGE` separately from `UPDATE`. When `TripPlanService.updateStatus()` or `YardMoveService.updateStatus()` is called, it logs `STATUS_CHANGE` — not `UPDATE`.

**Rationale**: Dispatchers and auditors care about "show me all status transitions today" as a primary query. Using `UPDATE` would require parsing `beforeSnapshot`/`afterSnapshot` JSON to filter those events, making the query needlessly complex.

**Alternative considered**: Generic `UPDATE` for all field mutations — rejected for filterability reasons above.

---

### Decision 5: `entityType` as a `String` with `ENTITY_TYPES` constants

**Choice**: `AuditLog.entityType` is a plain `String` (not a Prisma enum). App-level constants are defined in `@tms/shared`:

```typescript
export const ENTITY_TYPES = {
  TRIP_PLAN: "TripPlan",
  YARD_MOVE: "YardMove",
  TRIP_COST: "TripCost",
  YARD_MOVE_COST: "YardMoveCost",
  USER: "User",
  VEHICLE: "Vehicle",
  CONTAINER: "Container",
} as const;
```

**Rationale**: A Prisma enum requires a migration every time a new entity needs auditing. A String with app-level constants provides IDE autocomplete and compile-time safety without schema migration overhead.

---

### Decision 6: `LOGIN` / `LOGIN_FAILED` are standalone audit writes (no business transaction)

**Choice**: Auth events do not wrap in a `$transaction`. `AuditService.log(params)` is called with no `tx` argument (uses regular `PrismaService`). The auth service is restructured with try/catch to capture failures:

```typescript
async login(username: string, password: string) {
  try {
    const user = await this.validateUser(username, password);
    await this.auditService.log({ action: AuditAction.LOGIN, actorUserId: user.id, ... });
    return { access_token: this.jwtService.sign(payload) };
  } catch (e) {
    await this.auditService.log({ action: AuditAction.LOGIN_FAILED, actorUsername: username, ... });
    throw e;
  }
}
```

**Rationale**: There is no business transaction for a login — no entity is mutated. Forcing a `$transaction` wrapper here adds unnecessary overhead with no benefit. The audit write itself is still awaited (not fire-and-forget), consistent with the reliability decision.

---

### Decision 7: `GET /audit-logs` is admin-only, paginated, filtered

**Choice**: The read endpoint checks `request.user.role === Role.ADMIN` via a role guard (separate from `JwtAuthGuard`). Filters: `action`, `entityType`, `entityId`, `actorUserId`, `dateFrom`, `dateTo`. Paginated with default `limit=50`.

**Rationale**: Audit logs contain actor PII (username, IP address). Restricting to ADMIN role prevents OPERATOR/VIEWER users from seeing who made what changes. Pagination is mandatory because the table grows without bound.

## Risks / Trade-offs

- **Transaction overhead** — wrapping previously non-transactional operations in `$transaction` adds a small latency cost (BEGIN/COMMIT round-trip). At current volume (tens of operations/day), this is negligible. Revisit if bulk import operations are added.

- **Snapshot size** — `beforeSnapshot` and `afterSnapshot` store full entity JSON. Large entities (TripPlan with many costs) produce large JSONB values. Mitigation: Use `select` to trim snapshots to meaningful fields only (exclude internal FK IDs, timestamps), or store null for operations where the snapshot is redundant.

- **AuditLog cannot be rolled back intentionally** — if a legitimate rollback occurs (e.g., duplicate key on TripPlan creation), the audit log rolls back too. This means rolled-back operations leave no trace. Acceptable for MVP; a separate "attempt log" could be added for forensic needs.

- **AsyncLocalStorage context loss across non-async boundaries** — if a service uses `setTimeout` or spawns a worker thread, the async context is lost. Not a concern for current synchronous Prisma operations, but worth documenting.

- **`LOGIN_FAILED` reveals username existence** — logging `actorUsername` on a failed login stores the username the caller attempted. This is fine for internal audit (auditors should see attempted usernames). It does NOT expose this information to the caller — the API still returns generic 401.

## Migration Plan

1. Add `AuditLog` model and `AuditAction` enum to schema
2. Run `pnpm db:generate` + `pnpm db:migrate --name add_audit_log`
3. Deploy `AuditModule` (new module, no breaking changes to existing APIs)
4. Hook audit calls into service methods (internal change, existing endpoints unchanged)

**Rollback**: Drop `audit_logs` table; remove `AuditAction` enum; remove `AuditModule` import from `AppModule`. Existing service methods revert to pre-transaction-wrap state.

## Open Questions

- **Snapshot trimming**: Should `beforeSnapshot`/`afterSnapshot` store the full Prisma result (with all relations), or a trimmed object (just the entity's own fields)? Full snapshot is more complete but larger. Recommend: store the entity's own scalar fields only, exclude nested relations.
- **`COST_ADDED` entity type**: Should cost additions log as `entityType: TRIP_COST` with the cost ID, or as `entityType: TRIP_PLAN` with the parent trip ID? Recommend: `TRIP_COST` with `entityId = cost.id` and `metadata: { tripPlanId }` for traceability.
