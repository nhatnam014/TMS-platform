## Context

The TripCost feature consists of two parts: (1) a catalog table (`trip_costs`) used to pre-populate cost names when entering expenses, and (2) a junction table (`trip_plan_costs`) that links trip plans to cost entries. The client no longer wants catalog management — costs should be typed directly. Simultaneously, the trip plans list action surface is being reduced to just Edit and Delete, requiring a new full-update endpoint that did not previously exist.

Key existing state:

- `TripPlan` already stores cost slots as plain string/decimal snapshots (`phiNangName`, `phiNangAmount`, etc.) — completely independent of the `TripCost` catalog.
- `TripPlanCost.costName` is already a snapshot string — the `tripCostId` FK is nullable and exists only as a "pointer back to catalog" that can safely be dropped.
- No full-update (`PATCH /trip-plans/:id`) endpoint exists today.

## Goals / Non-Goals

**Goals:**

- Remove the TripCost catalog end-to-end (DB, API, UI)
- Replace SELECT dropdowns in cost form slots with plain amount inputs
- Add live thousand-separator formatting to all amount inputs
- Add full trip plan edit via pre-filled modal
- Add trip plan delete with confirmation
- Reduce action column to Edit + Delete only
- Simplify import service (no TripCost catalog creation)

**Non-Goals:**

- Changing the data shape of the 9 fixed cost slots on `TripPlan` (columns remain, just no longer tied to catalog)
- Modifying the `updateStatus` endpoint
- Changing the trip plan list filters, pagination, or columns
- Migrating existing `TripPlanCost` data (orphaned `tripCostId` values are dropped with the column)

## Decisions

### Decision 1: PATCH /trip-plans/:id reuses CreateTripPlanDto + optional status

**Chosen**: Create a `UpdateTripPlanDto` that extends `CreateTripPlanDto` (all fields optional via `PartialType`) and adds an optional `status: TripStatus` field.

**Rationale**: The edit form has the same fields as create. Using `PartialType` avoids duplicating 30+ field declarations. The `updateStatus` endpoint stays as-is (for future use); the new update endpoint also accepts status so the Edit modal can change it in one round-trip.

**Alternative**: Keep status out of the update DTO and rely on `updateStatus`. Rejected — requires two API calls when editing status from the form.

### Decision 2: Number formatting uses text input with raw numeric state

**Chosen**: Amount input fields use `type="text"`. Two pieces of state per slot: a raw numeric string (for math) and a display string (formatted with `toLocaleString("vi-VN")`). On `onChange`, strip non-digit characters, update raw value, derive display. On submit, parse raw to `Number`.

```
rawValue = "1500000"         (state — what we submit)
display  = "1.500.000"       (derived from rawValue — what user sees)

onChange → strip non-digits → set rawValue → derive display
onSubmit → Number(rawValue) → send to API
```

**Rationale**: `type="number"` inputs fight with custom display formatting. `type="text"` with explicit numeric state gives full control.

**Alternative**: A shared `<CurrencyInput>` component. Deferred — single file change, no component system in place.

### Decision 3: Edit modal pre-fills from list data (no extra fetch)

**Chosen**: The trip row already contains all fields needed to pre-fill the edit form (all cost slots, locations, dates, status etc. are in the `TripPlanRow` interface). The Edit modal receives the `TripPlanRow` as a prop and initialises state directly — no additional API call needed.

**Rationale**: The list already fetches all fields. An extra GET on edit would be a round-trip for data we already have.

**Alternative**: Always fetch `GET /trip-plans/:id` on edit open. Kept as future option if the list ever returns a lighter payload.

### Decision 4: Delete is a direct confirm-then-DELETE, no soft delete

**Chosen**: Clicking "Xóa" shows `window.confirm()` prompt; on confirm calls `DELETE /api/trip-plans/:id`; on success removes the row from the local list state.

**Rationale**: No audit-safe soft-delete requirement has been stated. Simple and consistent with other delete patterns in the codebase.

### Decision 5: Cost slot `name` hardcoded from slot label, not user-editable

**Chosen**: For the 8 fixed cost slots (PHÍ NÂNG, PHÍ HẠ, ...), the `*Name` field sent to the API is hardcoded to the slot's label string. Only the amount and SHĐ are user-editable.

**Rationale**: The slot label IS the cost name for fixed slots. Allowing free-text name editing would make the fixed grid meaningless. Only `chiPhiPhatSinh` (CHI PHÍ PHÁT SINH KHÁC) retains a free-text name field since it is explicitly a free-form slot.

### Decision 6: Import service drops TripCost catalog step entirely

**Chosen**: Remove the `tripCost.findFirst` / `tripCost.create` block. Pass `costName` directly to `TripPlanCost.create`. Remove `tripCostId` from the create call. The `warnings.push("Chi phí mới tự tạo: ...")` line is also removed since no catalog entry is created.

**Rationale**: With the catalog gone, the import should be simpler. Existing import data is unaffected (costName snapshot was always written).

## Risks / Trade-offs

- **[Risk] Existing TripPlanCost rows lose tripCostId** → Mitigation: `costName` snapshot has always been written alongside `tripCostId`. The migration drops the column after verifying no business logic reads it (confirmed: UI reads `costName`, not `tripCostId`).
- **[Risk] Edit modal pre-fills stale data if list was loaded long ago** → Mitigation: accepted trade-off per Decision 3. A "Refresh" or re-fetch on edit open can be added later if needed.
- **[Risk] `window.confirm()` is not styleable** → Acceptable for the current UI baseline; a custom confirm modal can replace it later.

## Migration Plan

1. **DB migration** (Prisma): remove `TripCost` model; remove `tripCostId` field from `TripPlanCost`. Run `pnpm db:migrate`.
2. **API**: remove `TripCostModule`; add `UpdateTripPlanDto`; add `update()` method and `PATCH /:id` route; remove `addCost()` and its route.
3. **Shared types**: update `AddTripPlanCostDto` (drop `tripCostId`, add `costName`); add `UpdateTripPlanDto`.
4. **Frontend**: remove trip-costs page and nav link; refactor `CreateTripModal`; add `EditTripModal`; swap action buttons.
5. **Deploy**: no data loss — migration only drops a nullable FK column and an unused catalog table.

**Rollback**: Re-add the column (data loss for new rows only, which have `tripCostId = NULL` anyway). Catalog table drop is reversible by re-running the seed.
