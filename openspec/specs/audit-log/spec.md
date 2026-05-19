## ADDED Requirements

### Requirement: AuditAction enum defines all auditable operation types
The system SHALL define an `AuditAction` enum exported from `@tms/shared` with values: `CREATE`, `UPDATE`, `DELETE`, `STATUS_CHANGE`, `COST_ADDED`, `LOGIN`, `LOGIN_FAILED`, `LOGOUT`, `REGISTER`. This enum MUST be used in the Prisma schema and in all `AuditService.log()` call sites.

#### Scenario: AuditAction enum is available in shared package
- **WHEN** a consuming package imports from `@tms/shared`
- **THEN** `AuditAction` is available as an exported type with all nine values

---

### Requirement: ENTITY_TYPES constants define auditable entity names
The system SHALL export an `ENTITY_TYPES` constant object from `@tms/shared` with string values: `"TripPlan"`, `"TripCost"`, `"YardMove"`, `"YardMoveCost"`, `"User"`, `"Vehicle"`, `"Container"`. These values MUST be used at all `AuditService.log()` call sites for the `entityType` field.

#### Scenario: ENTITY_TYPES constants are available in shared package
- **WHEN** a consuming package imports from `@tms/shared`
- **THEN** `ENTITY_TYPES` is available as an exported constant with all defined entity name strings

---

### Requirement: AuditLog Prisma model stores the append-only audit trail
The system SHALL add an `AuditLog` model to the Prisma schema with the following fields:
- `id` (cuid, primary key)
- `actorUserId` (String?, nullable — null for pre-auth events like LOGIN_FAILED)
- `actorUsername` (String?, nullable — denormalized from JWT at time of action)
- `actorRole` (String?, nullable — denormalized role)
- `action` (AuditAction enum)
- `entityType` (String — value from ENTITY_TYPES constants)
- `entityId` (String?, nullable — null for auth events)
- `summary` (String — human-readable description of the action)
- `beforeSnapshot` (Json?, nullable — entity state before mutation)
- `afterSnapshot` (Json?, nullable — entity state after mutation)
- `metadata` (Json?, nullable — catch-all for action-specific context)
- `ipAddress` (String?, nullable)
- `userAgent` (String?, nullable)
- `createdAt` (DateTime, default now())

No `updatedAt` field — the table is append-only and rows MUST NOT be updated after creation.

#### Scenario: AuditLog record is created with required fields
- **WHEN** an `AuditLog` is inserted with `action`, `entityType`, and `summary`
- **THEN** the record is persisted with a generated `id` and `createdAt` timestamp

#### Scenario: AuditLog has indexes for common query patterns
- **WHEN** the migration is applied
- **THEN** composite indexes exist on `(entityType, entityId)`, `(actorUserId, createdAt)`, `(action, createdAt)`, and `(createdAt)`

---

### Requirement: AuditContextService propagates request context via AsyncLocalStorage
The system SHALL provide an `AuditContextService` that uses Node.js `AsyncLocalStorage` to store and retrieve per-request actor context `{ userId, username, role, ipAddress, userAgent }` without requiring it to be passed as a parameter to service methods.

#### Scenario: Context is retrievable within the same async call chain
- **WHEN** `AuditContextService.run(ctx, fn)` is called and `fn` executes synchronous or async Prisma operations
- **THEN** `AuditContextService.get()` returns the same `ctx` within those operations

#### Scenario: Context is null outside a request lifecycle
- **WHEN** `AuditContextService.get()` is called outside any `run()` scope (e.g., during startup)
- **THEN** it returns `undefined` without throwing

---

### Requirement: AuditContextInterceptor is applied globally and populates context per request
The system SHALL register `AuditContextInterceptor` as a global NestJS interceptor. For every incoming HTTP request, it MUST extract `request.user` (set by `JwtAuthGuard`) and request headers (`x-forwarded-for` or `req.ip`, `user-agent`), then call `AuditContextService.run()` to make that context available for the duration of the request.

#### Scenario: Interceptor populates actor context for authenticated requests
- **WHEN** an authenticated request reaches a protected endpoint
- **THEN** `AuditContextService.get()` returns `{ userId, username, role, ipAddress, userAgent }` during that request's execution

#### Scenario: Interceptor tolerates unauthenticated context gracefully
- **WHEN** a request reaches the interceptor without `request.user` (e.g., the login endpoint before JWT validation)
- **THEN** the interceptor sets a partial context with null actor fields and does not throw

---

### Requirement: AuditService writes AuditLog records within the caller's transaction
The system SHALL provide an `AuditService` with a `log(params, tx?)` method. When `tx` (a Prisma transaction client) is provided, the write MUST use that client. When `tx` is omitted, the write MUST use the regular `PrismaService`. The method MUST read actor context from `AuditContextService` to populate actor fields.

#### Scenario: Audit write participates in the caller's transaction
- **WHEN** `auditService.log(params, tx)` is called inside a Prisma `$transaction` callback
- **THEN** the `audit_logs` row is written using the same transaction; if the transaction rolls back, the audit log row is also rolled back

#### Scenario: Audit write succeeds as a standalone operation
- **WHEN** `auditService.log(params)` is called without a `tx` argument
- **THEN** the `audit_logs` row is written using the regular Prisma client

---

### Requirement: TripPlan mutations are audit-logged within the same transaction
The system SHALL instrument four `TripPlanService` methods so that each calls `auditService.log(params, tx)` inside a `$transaction`. The `beforeSnapshot` MUST be captured before the mutation and `afterSnapshot` after:

| Method | AuditAction | entityType | beforeSnapshot | afterSnapshot |
|---|---|---|---|---|
| `create()` | `CREATE` | `"TripPlan"` | null | created entity |
| `updateStatus()` | `STATUS_CHANGE` | `"TripPlan"` | `{ status: oldStatus }` | `{ status: newStatus }` |
| `addCost()` | `COST_ADDED` | `"TripCost"` | null | created cost |
| `delete()` | `DELETE` | `"TripPlan"` | entity before delete | null |

#### Scenario: Creating a TripPlan writes a CREATE audit log
- **WHEN** `POST /api/v1/trip-plans` is called with valid data and succeeds
- **THEN** an `AuditLog` row exists with `action = CREATE`, `entityType = "TripPlan"`, `entityId` matching the created trip plan's id, and `afterSnapshot` containing the trip plan data

#### Scenario: Updating TripPlan status writes a STATUS_CHANGE audit log
- **WHEN** `PATCH /api/v1/trip-plans/:id/status` is called and succeeds
- **THEN** an `AuditLog` row exists with `action = STATUS_CHANGE`, `beforeSnapshot = { status: <old> }`, `afterSnapshot = { status: <new> }`

#### Scenario: If TripPlan mutation rolls back, no audit log is written
- **WHEN** `TripPlanService.create()` throws an error inside the transaction (e.g., FK constraint violation)
- **THEN** no `AuditLog` row exists for that failed operation

---

### Requirement: YardMove mutations are audit-logged within the same transaction
The system SHALL instrument three `YardMoveService` methods so that each calls `auditService.log(params, tx)` inside a `$transaction`:

| Method | AuditAction | entityType | beforeSnapshot | afterSnapshot |
|---|---|---|---|---|
| `create()` | `CREATE` | `"YardMove"` | null | created entity |
| `updateStatus()` | `STATUS_CHANGE` | `"YardMove"` | `{ status: oldStatus }` | `{ status: newStatus }` |
| `addCost()` | `COST_ADDED` | `"YardMoveCost"` | null | created cost |

#### Scenario: Creating a YardMove writes a CREATE audit log
- **WHEN** `POST /api/v1/yard-moves` is called with valid data and succeeds
- **THEN** an `AuditLog` row exists with `action = CREATE` and `entityType = "YardMove"`

#### Scenario: Completing a YardMove writes a STATUS_CHANGE audit log
- **WHEN** `PATCH /api/v1/yard-moves/:id/status` is called with `status: COMPLETED`
- **THEN** an `AuditLog` row exists with `action = STATUS_CHANGE`, `entityType = "YardMove"`, and both before and after status snapshots

---

### Requirement: Auth events are audit-logged as standalone writes
The system SHALL instrument `AuthService.login()` to write audit logs for successful and failed login attempts. These writes MUST be awaited but are NOT wrapped in a business `$transaction` (auth has no entity mutation to join). The `LOGIN_FAILED` log MUST be written even when `validateUser()` throws.

#### Scenario: Successful login writes a LOGIN audit log
- **WHEN** `POST /api/v1/auth/login` is called with valid credentials
- **THEN** an `AuditLog` row exists with `action = LOGIN`, `actorUserId` set, `actorUsername` set, `entityType = "User"`, `entityId` set to the user's id

#### Scenario: Failed login writes a LOGIN_FAILED audit log
- **WHEN** `POST /api/v1/auth/login` is called with invalid credentials and returns 401
- **THEN** an `AuditLog` row exists with `action = LOGIN_FAILED`, `actorUserId = null`, `actorUsername` set to the attempted username, `entityType = "User"`, `entityId = null`

---

### Requirement: GET /audit-logs returns paginated, filtered audit entries (admin only)
The system SHALL expose `GET /api/v1/audit-logs` protected by `JwtAuthGuard` and a role check that restricts access to users with `role = ADMIN`. Query parameters `action` (AuditAction), `entityType` (string), `entityId` (string), `actorUserId` (string), `dateFrom` (ISO string), `dateTo` (ISO string), `page` (number), and `limit` (number, default 50) MUST be supported. Results MUST be ordered by `createdAt` descending.

#### Scenario: Admin can retrieve all audit logs
- **WHEN** `GET /api/v1/audit-logs` is called with a valid ADMIN token
- **THEN** the response is `200 OK` with a paginated list of audit log entries ordered newest-first

#### Scenario: Non-admin receives 403
- **WHEN** `GET /api/v1/audit-logs` is called with a valid OPERATOR or VIEWER token
- **THEN** the response is `403 Forbidden`

#### Scenario: Filter by entityType and entityId returns entity history
- **WHEN** `GET /api/v1/audit-logs?entityType=TripPlan&entityId=<id>` is called by an admin
- **THEN** only audit logs for that specific trip plan are returned

#### Scenario: Filter by action returns matching entries
- **WHEN** `GET /api/v1/audit-logs?action=STATUS_CHANGE` is called by an admin
- **THEN** only audit logs with `action = STATUS_CHANGE` are returned

#### Scenario: Unauthenticated request returns 401
- **WHEN** `GET /api/v1/audit-logs` is called without an Authorization header
- **THEN** the response is `401 Unauthorized`
