## Why

Every list page in the app only supports deleting one record at a time, each requiring its own confirmation and its own API round-trip. Cleaning up a batch of stale reference data (customers, carriers, locations, service types, etc.) or removing a handful of trip plans/vehicle records today means repeating that single-delete flow N times. Users need a way to select multiple records and delete them together with one confirmation.

## What Changes

- Add checkbox-based multi-select to the table on 8 pages: trip-plans, vehicle-records, service-types, container-sizes, cost-templates, yard-moves, customers, carriers, locations. (`vehicle-maintenance` is explicitly out of scope — it's a sub-view of vehicle-records, not a standalone list.)
- Add a "Delete selected (N)" action that appears once one or more rows are checked, opening a single confirmation dialog showing the count before performing the bulk delete.
- Add new `SelectableTable` and `ConfirmDialog` components to `packages/ui` (currently an empty stub) for this bulk-delete flow. Existing single-row delete/deactivate flows and their current ad-hoc modals are untouched.
- Add a `POST /:resource/bulk-delete` endpoint (body: `{ ids: string[] }`) to each of the 8 resource controllers in `apps/api`.
- For `yard-moves`, `customers`, `carriers`, `locations` — which currently only support soft-delete via `PATCH { isActive: false }` — introduce a true hard-delete, used exclusively by the new bulk-delete action. The existing single-record deactivate flow keeps working unchanged.
- Add FK-reference guards to the `customers` and `carriers` bulk-delete (skip records referenced by a trip plan), following the same 409-style check already used by `service-types`/`container-sizes` single-delete. `locations` and `yard-moves` have no incoming FK relations, so no guard is needed there.
- Bulk-delete is partial-success: the API deletes everything it safely can and reports what was skipped and why (`{ deleted: string[], skipped: { id, reason }[] }`), surfaced in the UI as a summary message (e.g., "7 deleted, 3 skipped: referenced by trip plans").

## Capabilities

### New Capabilities
- `bulk-delete`: Multi-select UI (checkboxes, select-all, "Delete selected (N)" action), the shared confirmation dialog, and the `POST /:resource/bulk-delete` API contract (partial-success response, FK-guard skip behavior) across all 8 in-scope resources.

### Modified Capabilities
(none — this adds a new, additive capability; no existing requirement text changes)

## Impact

- **Frontend**: `packages/ui` gains `SelectableTable` and `ConfirmDialog` components; the 8 page files under `apps/web/src/app/(authenticated)/{trip-plans,vehicle-records,service-types,container-sizes,cost-templates,yard-moves,customers,carriers,locations}/page.tsx` adopt them for a new bulk-delete action.
- **Backend**: 8 NestJS modules under `apps/api/src/modules/*` each gain a `bulk-delete` controller route + service method (with FK-guard logic reused for `customer` and `carrier`).
- **BFF proxy**: `apps/web/src/app/api/[...path]/route.ts` already forwards POST generically — no change expected, but worth confirming during implementation.
- **Database**: no schema changes. Hard-delete on `yard-moves`/`customers`/`carriers`/`locations` uses existing Prisma relations/constraints as-is.
