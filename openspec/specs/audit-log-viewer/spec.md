## ADDED Requirements

### Requirement: Admin-only audit log page
The web app SHALL provide a `/audit-logs` page that is only visible and accessible to users with `role === "ADMIN"`. The page SHALL fetch `GET /api/audit-logs` and display a paginated table.

Columns: timestamp, actor (username), action, entity type, entity ID, summary.

#### Scenario: Admin can view audit logs
- **WHEN** an ADMIN user navigates to `/audit-logs`
- **THEN** the page fetches and displays audit log entries in a table

#### Scenario: Non-admin sees access denied message
- **WHEN** a non-ADMIN user navigates to `/audit-logs`
- **THEN** the page displays an access denied message (API returns 403)

---

### Requirement: Audit log link visible only to admins in nav
The nav sidebar SHALL display the "Nhật ký kiểm tra" link only when `useAuth().role === "ADMIN"`. The link SHALL be hidden for all other roles.

#### Scenario: Admin sees audit log link
- **WHEN** the authenticated user has role `ADMIN`
- **THEN** the nav sidebar includes a "Nhật ký kiểm tra" link pointing to `/audit-logs`

#### Scenario: Operator does not see audit log link
- **WHEN** the authenticated user has role `OPERATOR` or `VIEWER`
- **THEN** the nav sidebar does not include the "Nhật ký kiểm tra" link

---

### Requirement: Fix audit log pagination coercion
The `AuditService.findAll` method SHALL coerce `page` and `limit` query parameters to numbers before passing them to Prisma, matching the fix already applied to `TripPlanService`.

#### Scenario: Audit logs endpoint accepts numeric string limit
- **WHEN** `GET /audit-logs?limit=20` is called
- **THEN** Prisma receives `take: 20` (number) and the request succeeds with `200 OK`
