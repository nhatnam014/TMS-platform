## Context

Three entities — Customer, Carrier, Location — are foreign-key dependencies for TripPlan creation and are currently read-only from the API perspective (only `GET /list` endpoints exist). Users and carriers are seeded directly into the database. No DTOs, create/update endpoints, or management UIs exist for these entities.

All three have an `isActive: boolean` field in the Prisma schema that was never surfaced in the API or UI. The existing list endpoints return all records regardless of active status.

The change follows established patterns already in place for `TripPlan` and `YardMove`: NestJS controller → service → Prisma, with audit logging via the global `AuditService`, and shared DTO types in `@tms/shared`. Frontend pages are `"use client"` components with inline modals and `useEffect`-driven fetching.

## Goals / Non-Goals

**Goals:**
- Create/update customers, carriers, locations from the web UI
- Soft-deactivate entities (set `isActive: false`) rather than hard delete
- Filter list endpoints to return only active records by default
- Audit log all mutations (CREATE, UPDATE actions)
- Add navigation pages for all three entities, accessible to all authenticated roles

**Non-Goals:**
- Hard DELETE endpoints (no entity is ever permanently removed)
- Role-gating beyond JWT authentication (all authenticated users can mutate)
- Pagination on list endpoints (entity counts are small; no pagination needed)
- Driver/Vehicle management (separate change)
- Customer/Carrier financial data or complex relations

## Decisions

### D1: Soft-delete only (no DELETE endpoint)

`Customer`, `Carrier`, `Location` all have `isActive: boolean`. Deactivating is `PATCH /:id` with `{ isActive: false }`. No `DELETE` endpoint is added.

**Why:** These entities are referenced by historical TripPlan records. Hard-deleting a customer would orphan past trips or require cascade logic. Soft-delete preserves data integrity while hiding inactive entities from active use.

**Alternative considered:** Hard delete with cascade nullification — rejected because it destroys audit history.

### D2: Single `PATCH /:id` for both edit and deactivate

A single `PATCH /:id` endpoint accepts a partial body. Sending `{ isActive: false }` deactivates; sending `{ name: "..." }` updates a field. No separate `/deactivate` endpoint.

**Why:** Simpler API surface. The frontend can deactivate and edit with the same endpoint. NestJS `class-validator` uses `@IsOptional()` on all fields.

### D3: Filter list endpoints to `isActive: true` by default

Existing `GET /customers`, `GET /carriers`, `GET /locations` are modified to add `where: { isActive: true }` in the Prisma query.

**Why:** The trip-plan create modal populates dropdowns from these endpoints. Showing deactivated entities there would confuse dispatchers. The `reference-data` spec is updated to reflect this.

**Trade-off:** Anyone relying on seeing all customers (e.g., audit/admin view) would need a separate `?includeInactive=true` param — but no such consumer exists today.

### D4: DTOs in `@tms/shared`, class-validator in API

`CreateCustomerDto`, `UpdateCustomerDto`, etc. are defined as interfaces in `packages/shared/src/index.ts` (for frontend type safety). Separate NestJS DTO classes with `class-validator` decorators live in `apps/api/src/modules/<entity>/dto/`.

**Why:** Same pattern used by `CreateTripPlanDto` — shared interface for frontend, decorated class for backend validation.

### D5: Frontend — one page pattern, repeated three times

Each management page (`/customers`, `/carriers`, `/locations`) is a `"use client"` component with:
- A table listing active entities
- A "Tạo mới" button that opens a create modal
- Inline "Sửa" and "Vô hiệu hóa" actions per row
- Single `useEffect` on a `refresh` counter to re-fetch after mutations

This repeats the trip-plan page pattern without pagination (entity counts are small).

### D6: Audit logging for all mutations

All `POST` and `PATCH /:id` calls are wrapped in `prisma.$transaction` with `auditService.log(...)`. `ENTITY_TYPES.CUSTOMER`, `ENTITY_TYPES.CARRIER`, `ENTITY_TYPES.LOCATION` are added to `@tms/shared`.

**Why:** Consistent with TripPlan and YardMove patterns. Audit trail for reference data changes is operationally useful.

## Risks / Trade-offs

- **`code` uniqueness constraint** — `Customer.code`, `Carrier.code`, `Location.code` are `@unique` in Prisma. A duplicate `code` on create returns a Prisma `P2002` error. The service must catch this and return a `409 Conflict` with a readable message. → Mitigation: Add `P2002` error handling in each service's create method.

- **Existing trip-plan dropdowns after isActive filtering** — After this change, the customer/carrier dropdowns in the trip-plan create modal will hide deactivated entities. If a dispatcher tries to create a trip for a deactivated customer, they can't select them. → Acceptable: deactivated means "no longer operational." If needed, the customer can be re-activated via PATCH.

- **No findOne for detail/edit prefill** — Currently no `GET /customers/:id` endpoint. The edit modal can pre-fill from the row data already in state (no extra network call needed since all active entities are loaded). → Mitigation: Pre-populate edit modal from in-memory row data rather than a separate fetch.

## Open Questions

- None — scope is clear and patterns are established.
