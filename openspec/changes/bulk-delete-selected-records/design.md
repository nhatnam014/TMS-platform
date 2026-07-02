## Context

Today, every list page renders its own `<table>` and its own local `Modal` component; there is no shared table or dialog component (`packages/ui` is an empty stub). Delete behavior is inconsistent across the 8 in-scope resources:

- **Hard-delete already**: `trip-plan`, `vehicle-record`, `service-types`, `container-sizes`, `cost-templates` — each has `@Delete(":id")`. `service-types`/`container-sizes` additionally guard against deletion when referenced by a trip plan (`ConflictException`, 409).
- **Soft-delete only**: `yard-move`, `customer`, `carrier`, `location` — each only has `@Patch(":id")` toggling `isActive: false`; no `@Delete` route exists at all today.

Five of the eight services (`trip-plan`, `vehicle-record`, `yard-move`, `customer`, `carrier`) and also `location` already call a shared `AuditService.log({ action, entityType, entityId, summary, beforeSnapshot?, afterSnapshot? }, tx)` inside a `prisma.$transaction`, keyed off `ENTITY_TYPES` in `packages/shared`. `service-types`, `container-sizes`, `cost-templates` do not audit-log today.

`Customer` and `Carrier` are real Prisma relations from `TripPlan` (`customerId` required, `carrierId` optional) with default `Restrict` delete behavior — deleting a referenced row throws a DB constraint error unless guarded first. `Location` is only stored as free-text strings on `TripPlan` (no real FK) and `YardMove` has no incoming relations — both are safe to hard-delete without a guard.

The Next.js BFF proxy (`apps/web/src/app/api/[...path]/route.ts`) already forwards method + body + headers generically for GET/POST/PATCH/PUT/DELETE, so no proxy changes are needed for a new `POST .../bulk-delete` route.

## Goals / Non-Goals

**Goals:**
- One reusable selection + confirm-dialog UX in `packages/ui`, adopted by all 8 pages.
- One consistent `POST /:resource/bulk-delete` contract across all 8 resources, with partial-success reporting.
- Preserve every existing single-record delete/deactivate flow exactly as-is — bulk-delete is a net-new, additive code path.
- Reuse existing FK-guard and audit-logging conventions rather than inventing new ones.

**Non-Goals:**
- No changes to `vehicle-maintenance` (explicitly excluded — sub-view of vehicle-records).
- No cross-page/cross-pagination-page selection ("select all matching filter across all pages") — selection is scoped to the rows currently rendered on the page.
- No bulk-restore/undo capability for hard-deleted records.
- No retrofitting audit logging onto `service-types`/`container-sizes`/`cost-templates` beyond what bulk-delete itself needs (they get no audit call, matching their current un-audited single-delete).

## Decisions

**1. Shared UI components in `packages/ui`: `SelectableTable` wrapper pattern, not a full table replacement.**
Rather than replacing each page's hand-rolled `<table>` markup (rows differ a lot across pages — different columns, inline edit affordances), add two small composable pieces:
- A `useRowSelection(ids: string[])` hook (or equivalent local pattern exported from `packages/ui`) managing a `Set<string>` of selected ids, a `toggle(id)`, `toggleAll()`, and `clear()`.
- A `<SelectionCheckbox>` cell component and a `<BulkActionBar selectedCount count onDelete onClear />` component that appears above the table once `selectedCount > 0`.
- A shared `<ConfirmDialog title message onConfirm onCancel danger />` component, replacing the copy-pasted local `Modal` **only for the new bulk-delete confirmation** — existing single-delete modals are left untouched to avoid regressing unrelated flows.
Alternative considered: a full generic `<DataTable columns rows />` — rejected as a much larger refactor than this change needs; every page's column set and row rendering (inline links, status badges, formatted dates) is bespoke enough that a generic table would need heavy per-page configuration, defeating the simplicity win. Composable pieces let each page keep its existing table markup and just add a checkbox column + the two new components.

**2. API contract: `POST /:resource/bulk-delete` with `{ ids: string[] }`, partial-success response.**
```
POST /api/v1/customers/bulk-delete
Body:  { "ids": ["id1", "id2", "id3"] }
200:   { "deleted": ["id1", "id2"], "skipped": [{ "id": "id3", "reason": "Referenced by 2 trip plan(s)" }] }
```
Applied identically across all 8 resources for consistency, even though `location`/`yard-move` never actually populate `skipped` (no FK guard applies). A `class-validator` DTO (`BulkDeleteDto { @IsArray() @ArrayNotEmpty() @IsString({ each: true }) ids: string[] }`) is shared via `packages/shared` or duplicated per module following the existing per-module `dto/` convention (matches how `CreateXDto`/`UpdateXDto` are already duplicated per module rather than centralized).

**3. FK-guard logic factored as a small reusable check, not shared code.**
`customer.service.ts` and `carrier.service.ts` each gain a private helper (`countTripPlanReferences(id)`) mirroring `service-types.service.ts`'s existing inline `tripPlanCount` check — called per id inside the bulk loop, building the `skipped` list instead of throwing. Kept local to each service (not extracted into a shared utility) since the referencing model/field differs per resource (`customerId` vs `carrierId`) and the existing codebase already duplicates this exact pattern per-module rather than centralizing it.

**4. Bulk delete executes as one `$transaction` per resource call, looping ids inside it.**
Each id's guard-check + delete + audit-log call happens inside a single `prisma.$transaction`, consistent with how `create`/`update` already wrap guard+mutate+audit together. If the whole request fails unexpectedly (e.g. DB connection drop mid-batch), the transaction rolls back entirely — a 500 the client can retry — as opposed to partial success, which is deliberately reserved for known/expected FK conflicts, not infrastructure failures.

**5. Audit logging: bulk-delete emits one `AuditService.log(... action: "DELETE" ...)` call per successfully deleted record**, for the 6 resources that already audit-log today (`trip-plan`, `vehicle-record`, `yard-move`, `customer`, `carrier`, `location`). `service-types`/`container-sizes`/`cost-templates` bulk-delete does not call `AuditService`, matching their current un-audited single-delete.

**6. Hard-delete introduction for `yard-move`/`customer`/`carrier`/`location` is scoped to the bulk-delete code path only.**
These services gain a `bulkDelete(ids)` method that performs a true `prisma.<model>.delete(...)`. Their existing single-record `update(id, { isActive: false })` deactivate flow and its `PATCH` route are untouched — a user can still deactivate one record at a time exactly as before; hard-delete is only reachable via multi-select.

**7. Selection state is page-local and cleared on any list refetch** (pagination change, filter change, or after the bulk-delete call completes) to avoid stale ids pointing at rows no longer visible.

## Risks / Trade-offs

- **[Risk] Hard-deleting `customer`/`carrier`/`location`/`yard-move` is irreversible, unlike their current soft-delete** → Mitigation: confirm dialog explicitly states the count and that this cannot be undone; FK-guard prevents deleting anything still referenced by a trip plan for `customer`/`carrier`.
- **[Risk] A large selection (e.g. 200 ids) run as one transaction could hold a long-lived DB lock** → Mitigation: page-local selection naturally caps batch size to one page of results (existing page sizes are small, per `per-page-search`/pagination specs); no explicit batch-size limit is added beyond that, but this is called out for implementation to double-check current page-size defaults.
- **[Risk] Two confirm-dialog implementations now exist side by side (new shared `ConfirmDialog` for bulk-delete, old local `Modal` per page for single-delete)** → Mitigation: accepted as a deliberate scope boundary for this change; migrating single-delete flows onto the shared component is explicitly a non-goal here to keep this change's blast radius to bulk-delete only.
- **[Trade-off] `service-types`/`container-sizes`/`cost-templates` bulk-delete stays un-audited** → consistent with their current behavior; extending audit coverage to them is out of scope.

## Migration Plan

No data migration needed (no schema changes). Rollout is purely additive:
1. Ship `packages/ui` components first (no consumers yet, zero behavior change).
2. Ship backend `bulk-delete` endpoints per resource (new routes, no change to existing routes).
3. Wire up each of the 8 pages to the new UI + endpoint, one page at a time — each page's rollout is independent and can ship/rollback individually since it only adds new UI affordances.
Rollback: revert the per-page wiring commit(s); the new endpoints and components can remain dormant/unused with no impact if a specific page's rollout needs to be reverted.

## Open Questions

- Should there be a maximum batch size enforced by the API (e.g. reject `ids.length > 100`) as a safety net, or is page-size-based capping sufficient? Left to implementation to confirm current default page sizes before deciding.
