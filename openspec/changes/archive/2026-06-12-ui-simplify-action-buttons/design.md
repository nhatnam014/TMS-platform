## Context

Six list pages (Vehicles, Drivers, Customers, Carriers, Locations, Yard Moves) each expose a mix of CRUD buttons and domain-workflow buttons (status transitions, assign/unassign, cost management) in the same action column. This coupling makes the UI feel noisy and puts users one click away from unintended workflow state changes. The immediate need is to reduce the action surface to exactly two operations: **Edit** (PATCH) and **Delete** (soft delete), while preserving all existing code so workflow buttons can be re-enabled without effort later.

The backend situation varies across modules:

| Module                        | Soft-delete mechanism                               | General PATCH | Edit modal |
| ----------------------------- | --------------------------------------------------- | ------------- | ---------- |
| Customer / Carrier / Location | `isActive: false` via existing `PATCH /:id`         | ✅ exists     | ✅ exists  |
| Vehicle                       | `status = DECOMMISSIONED` via existing `PATCH /:id` | ✅ exists     | ✅ exists  |
| Driver                        | `status = TERMINATED` via existing `PATCH /:id`     | ✅ exists     | ✅ exists  |
| Yard Move                     | ❌ no `isActive`, no general PATCH                  | ❌ missing    | ❌ missing |

## Goals / Non-Goals

**Goals:**

- Simplify every list page to exactly two row-level action buttons: Sửa (Edit) and Xoá (soft delete).
- Preserve all hidden workflow code with `{false && ...}` so it can be re-enabled without re-writing.
- Add full soft-delete and general edit support for Yard Moves (DB migration + API + UI).
- Require an explicit confirmation dialog before any soft-delete executes.

**Non-Goals:**

- Removing or permanently deleting any record (hard delete).
- Redesigning the Edit modal UX beyond adding the missing Yard Move modal.
- Re-enabling or redesigning workflow buttons (deferred to a future change).
- Adding bulk-delete or undo functionality.

## Decisions

### D1: Use `{false && ...}` to preserve hidden workflow buttons

**Decision**: Wrap every hidden button group in `{false && <button ...>}` rather than deleting code or using a feature flag.

**Rationale**: The simplest reversible approach. No state, no config, no feature-flag infrastructure. A developer can restore buttons by replacing `false` with the original condition. Avoids the risk of losing conditional logic or event handlers.

**Alternative considered**: CSS `display:none` — rejected because it still renders handlers and could trigger accidental keyboard activation.

### D2: Map Vehicles soft-delete to `status = DECOMMISSIONED`

**Decision**: The "Xoá" button for vehicles sends `PATCH /vehicles/:id { status: "DECOMMISSIONED" }`.

**Rationale**: The Vehicle model has no `isActive` field; DECOMMISSIONED is the terminal status and is already supported by the existing `UpdateVehicleDto`. Adding a new `isActive` field would require a migration and does not fit the domain model (a vehicle in MAINTENANCE is not "active" but it is not deleted either). DECOMMISSIONED cleanly signals "removed from service."

**Alternative considered**: Adding `isActive` to Vehicle — rejected; adds schema complexity and misaligns with the existing status-driven lifecycle.

### D3: Map Drivers soft-delete to `status = TERMINATED`

**Decision**: The "Xoá" button for drivers sends `PATCH /drivers/:id { status: "TERMINATED" }`.

**Rationale**: Same reasoning as D2 — Driver has no `isActive` field and TERMINATED is the existing terminal status supported by `UpdateDriverDto`.

### D4: Add `isActive` to YardMove for soft delete

**Decision**: Add `isActive Boolean @default(true)` to the `YardMove` Prisma model and use `PATCH /yard-moves/:id { isActive: false }` for soft delete.

**Rationale**: YardMove has no existing terminal status that maps cleanly to "deleted" — CANCELLED is a valid workflow state (the move was attempted but cancelled), not a deletion marker. Using `isActive` is consistent with Customer / Carrier / Location and makes it trivially easy to exclude deleted records from all queries.

**Alternative considered**: Using CANCELLED as soft-delete — rejected; it pollutes workflow semantics and makes data reporting misleading.

### D5: Add a general `PATCH /yard-moves/:id` endpoint

**Decision**: Create a new `UpdateYardMoveDto` (all fields from `CreateYardMoveDto` made optional, plus `isActive`) and add `PATCH /yard-moves/:id` to `YardMoveController`.

**Rationale**: The existing `PATCH /yard-moves/:id/status` is workflow-specific. A general PATCH is needed to support field editing (date, container number, zones, location, notes) and soft delete without conflating workflow state with record management.

### D6: Inline confirmation dialog (no external library)

**Decision**: Implement the delete confirmation as a local React state `confirmDeleteId` rendered inline in each page component — a simple modal overlay with "Hủy" and "Xoá" buttons.

**Rationale**: The project already uses inline-styled modals for Create/Edit forms; introducing a separate dialog component or a toast-based confirm would break consistency. Keeping it local avoids shared state complexity.

## Risks / Trade-offs

- **DECOMMISSIONED / TERMINATED as soft-delete proxy**: These statuses already have semantic meaning in reporting. If a vehicle is accidentally "deleted" (DECOMMISSIONED), it disappears from the active list but still appears in historical reports under DECOMMISSIONED status — acceptable, and actually correct behaviour for an audit trail.

- **YardMove `isActive` migration**: Adding a NOT NULL column with a default is safe for an online migration on Postgres (Prisma generates `ALTER TABLE ... ADD COLUMN ... DEFAULT true`). Rollback is a simple `ALTER TABLE ... DROP COLUMN`.

- **Code hidden with `{false && ...}`**: Stale code accumulates over time. This is intentional (per proposal) and should be cleaned up when workflow UX is redesigned.

## Migration Plan

1. Run `npx prisma migrate dev --name add-yard-move-is-active` — adds `is_active` column with default `true` to `yard_moves` table. All existing rows get `true` automatically.
2. Deploy API (new DTO, service method, controller route).
3. Deploy frontend (UI changes to all 6 pages).
4. Rollback: revert API deploy, then `DROP COLUMN is_active` if needed.

## Open Questions

- None. All decisions resolved during exploration phase.
