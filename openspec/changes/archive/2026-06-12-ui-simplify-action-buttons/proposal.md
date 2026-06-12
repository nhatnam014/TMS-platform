## Why

The current list pages expose too many workflow action buttons (status transitions, assign/unassign, add-cost) alongside basic CRUD controls, which overwhelms users and increases the risk of accidental state changes. For now, users only need to edit records and soft-delete them; all other workflow actions will be re-enabled later when the full workflow UX is designed.

## What Changes

- **Vehicles page**: Hide MAINTENANCE / ACTIVE / DECOMMISSIONED status-transition buttons; add a red "Xoá" button that sets `status = DECOMMISSIONED` (soft-delete proxy); keep hidden code with `{false && ...}` for future reuse.
- **Drivers page**: Hide Assign / Unassign buttons; add a red "Xoá" button that sets `status = TERMINATED`; keep hidden code with `{false && ...}`.
- **Customers page**: Rename "Deactivate" → "Xoá" (red style); keep code path, add confirmation dialog.
- **Carriers page**: Rename "Deactivate" → "Xoá" (red style); keep code path, add confirmation dialog.
- **Locations page**: Rename "Deactivate" → "Xoá" (red style); keep code path, add confirmation dialog.
- **Yard Moves page** (backend + frontend): Add `isActive Boolean` to `YardMove` DB model; add a general `PATCH /yard-moves/:id` endpoint; expose an Edit modal and a red "Xoá" button (sets `isActive = false`); hide status-transition and add-cost buttons.
- All pages: Destructive "Xoá" action must show a confirmation dialog before executing.

## Capabilities

### New Capabilities

- `yard-move-soft-delete`: Soft-delete support for yard moves via `isActive` field — DB migration, service filter, and API endpoint.
- `yard-move-edit`: General field editing for yard moves (date, container number, from/to zone, location, notes) via a new `PATCH /yard-moves/:id` endpoint and Edit modal in the UI.

### Modified Capabilities

- `vehicle-crud`: Action buttons simplified to Edit + Xoá only; DECOMMISSIONED status used as soft-delete proxy.
- `driver-crud`: Action buttons simplified to Edit + Xoá only; TERMINATED status used as soft-delete proxy.
- `customer-crud`: Deactivate relabelled to Xoá with confirmation dialog.
- `carrier-crud`: Deactivate relabelled to Xoá with confirmation dialog.
- `location-crud`: Deactivate relabelled to Xoá with confirmation dialog.
- `yard-move-interactions`: Action surface replaced by Edit + Xoá buttons; old workflow buttons preserved in hidden code.

## Impact

- **DB schema**: `packages/db/prisma/schema.prisma` — add `isActive` to `YardMove` model + Prisma migration.
- **API**: `apps/api/src/modules/yard-move/` — new DTO, service method, controller route.
- **Frontend**: `apps/web/src/app/(authenticated)/vehicles/page.tsx`, `drivers/page.tsx`, `customers/page.tsx`, `carriers/page.tsx`, `locations/page.tsx`, `yard-moves/page.tsx`.
- No breaking API changes for existing consumers; all other PATCH endpoints already exist.
