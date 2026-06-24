## Context

`TripPlan` has two distinct cost storage shapes (see `packages/db/prisma/schema.prisma:128-209`):

1. **8 fixed cost slots** — dedicated scalar columns: `phiNangName`/`phiNangAmount`/`shdNang`, `phiHaName`/`phiHaAmount`/`shdHa`, `phiVeSinhName`/`phiVeSinhAmount`/`shdVeSinh`, `phiCuocName`/`phiCuocAmount`, `veCongName`/`veCongAmount`/`shdVeCong`, `chiPhiKhacName`/`chiPhiKhacAmount`, `chiPhiTraiTuyenName`/`chiPhiTraiTuyenAmount`, `cauDuongName`/`cauDuongAmount`. These are what `TripPlanService.create`/`update` (used by the web UI form) read and write, and what `kehoach-xe.builder.ts` reads for the matching Excel columns.
2. **Ad-hoc costs** — the `TripPlanCost` relation, used only for "CHI PHÍ PHÁT SINH KHÁC" (other/free-form costs), which the UI form calls `otherCosts` and the export aggregates as a single sum.

The Excel import path (`kehoach-xe.parser.ts` + `import.service.ts importTripPlans`) currently treats *all* 9 cost columns (the 8 fixed slots + the one ad-hoc column) identically — as generic `TripPlanCost` rows, deleted and recreated on every import. This matches an older data model (pre `trip-plan-refactor`) and is why editing fixed-slot columns and reimporting has no visible effect: the UI/export never look at `TripPlanCost` for those 8 columns, only at the dedicated scalar fields.

Additionally, `tripNumber` (STT) is blindly overwritten by the parsed STT cell on import, but export writes row position instead of `tripNumber`, so the two never stay in sync; `documentSentDate` (parsed correctly) is dropped before reaching the database write; the trip plans list defaults to sorting by `tripDate` instead of STT; and re-imports that update existing rows produce no record of what actually changed.

## Goals / Non-Goals

**Goals:**
- Importing a previously-exported "kế hoạch xe" file and editing one of the 8 fixed cost columns must update the same `TripPlan` scalar fields the UI form and export already use.
- Preserve current behavior for "CHI PHÍ PHÁT SINH KHÁC" (still ad-hoc `TripPlanCost`, delete+recreate per row).
- `tripNumber` stores the raw Excel STT value verbatim (create and update via import); it is not auto-incremented and not treated as a global ordering key.
- Persist `documentSentDate` on both create and update.
- Default-sort the trip plans list by most-recently-touched batch first, STT order within a batch (`listSortedAt desc, tripNumber asc`) — not by `tripDate`, and not by a single global `tripNumber` sequence.
- The "STT" column shown in the trip plans UI is the row's display position (frontend-computed), decoupled from the stored `tripNumber`.
- Surface, per import run, which existing records were changed (fields + old/new values), both as individual Audit Log entries and in the import API response/UI.
- Across all three Excel import flows (`importVehicles`, `importTripPlans`, `importVehicleMaintenance`): a row whose `id` cell doesn't match any existing record falls back to CREATE (with a warning), instead of erroring or silently skipping.

**Non-Goals:**
- No changes to `trip-plan.service.ts` create/update business logic for the 8 fixed cost fields (UI form) — already uses the correct fixed-slot model. (`create()` does gain a one-line `listSortedAt: now()` set, and loses the `tripNumber` auto-increment it briefly had.)
- One schema migration is required: `TripPlan.listSortedAt` (new nullable-with-default `DateTime` column). No other schema changes — all other target columns already exist.
- Not fixing the `trip-plan-excel-export` spec doc drift for cost columns (noted in proposal as a follow-up) — only the STT column's source is changing in the export builder.
- Not changing the cost *name* shown for fixed slots (e.g. still literal "PHÍ NÂNG") — import will set `phiNangName` to the same fixed label the UI defaults to, consistent with what a manual edit through the form would produce when the slot is filled with the default label.
- Not adding a manual sort-column picker to the trip plans UI — only the *default* sort changes; the page doesn't currently expose sort controls at all.
- Not generalizing changed-record diffing/logging to other import flows (vehicle, vehicle-maintenance) — scoped to `importTripPlans` only, since that's the flow under investigation.

## Decisions

**1. Map fixed-slot columns directly onto `ParsedTripPlanRow` as named optional fields, not a `costs[]` array.**
Mirrors the shape `CreateTripPlanDto`/`UpdateTripPlanDto` already expect (`phiNangAmount`, `shdNang`, ...). Alternative considered: keep `costs[]` and translate by name in `import.service.ts`. Rejected — string-keyed translation is fragile (typos, localized name drift) versus typed fields set directly off known columns.

```ts
// kehoach-xe.parser.ts — new fields on ParsedTripPlanRow
phiNangAmount?: number; shdNang?: string;
phiHaAmount?: number; shdHa?: string;
phiVeSinhAmount?: number; shdVeSinh?: string;
phiCuocAmount?: number;
veCongAmount?: number; shdVeCong?: string;
chiPhiKhacAmount?: number;       // from "CHI PHÍ KHÁC / PHÍ ĐỨT TEM" column
chiPhiTraiTuyenAmount?: number;  // from "CHI PHÍ TRÁI TUYẾN / CHỈ ĐỊNH / BP CAM" column
cauDuongAmount?: number;
```
Each slot's `*Name` field is set to the slot's fixed Vietnamese label (e.g. `"PHÍ NÂNG"`) whenever its amount is present, matching the label the UI shows for that slot — so a value imported this way looks identical to one entered through the form.

**2. `costs: ParsedCostItem[]` on `ParsedTripPlanRow` is kept, but only ever populated from the "CHI PHÍ PHÁT SINH KHÁC" column.**
Keeps the existing `otherCosts` delete+recreate logic in `import.service.ts` untouched for that one column — smallest possible diff for the part that isn't broken.

**3. [SUPERSEDED — see Decision 7'] `tripNumber` is set from STT on UPDATE only; new records (no `id`) always get an auto-incremented `tripNumber`...**
This decision (and the matching code in tasks 2.4/2.7b/4b) was implemented, then reverted by a later requirement. Kept here for history; see **Decision 7'** below for the current behavior. The core problem with this decision: treating `tripNumber` as a single globally-incrementing sequence meant two different Excel files imported on different days would silently renumber each other's rows on re-import (whoever imports last "owns" the STT sequence from the point their file diverges), and the trip plans list sorting by that global sequence put old UI-form rows (`tripNumber = null`) in a confusing position relative to imported rows. The customer's actual mental model is simpler: **the most recently imported (or created) batch of rows should show up first, and within a batch, rows should keep the order they had in the source Excel file** — not "everything lives on one eternal counter."

**3'. `tripNumber` stores the raw STT value from the Excel file, verbatim, for both CREATE and UPDATE. It is never auto-incremented and never globally unique.**
- `import.service.ts` CREATE branch: `tripNumber: row.tripNumber ?? null` (previously: ignored STT, computed `max + 1`).
- `import.service.ts` UPDATE branch: unchanged — `...(row.tripNumber !== undefined && { tripNumber: row.tripNumber })`.
- `trip-plan.service.ts create()` (UI form): drop the `max + 1` auto-increment added by Decision 7; `tripNumber` is simply not set on manual creation (`null`), since the UI form has no STT input.
- `kehoach-xe.builder.ts` export: unchanged, `tp.tripNumber ?? (idx + 1)`.
`tripNumber` is no longer the primary sort key (see Decision 5') — it now only matters as a tie-breaker within a single import batch, so duplicate/non-sequential values across different files are harmless.

**4. `documentSentDate` added to both create and update data objects**, following the same `!== undefined` conditional-spread pattern already used for `donViSuaChua`/`ngayLam`-style optional dates elsewhere in this file.

**5. [SUPERSEDED — see Decision 5'] Default sort changes to `tripNumber asc`...**
Reverted along with Decision 3, for the same reason: a single global `tripNumber asc` sort doesn't express "most recent batch first, STT order within the batch."

**5'. New nullable `TripPlan.listSortedAt DateTime?` column drives default sort: `listSortedAt desc, tripNumber asc`.**
`listSortedAt` is a "this row's position in the list should be reconsidered" timestamp — not a generic `updatedAt`:
- Set to `now()` whenever a row is **created** (both `trip-plan.service.ts create()` and `import.service.ts`'s CREATE branch) and whenever a row is **touched by an import run**, even if the import made no field changes (UPDATE branch in `importTripPlans`, unconditionally, before the per-field diff/audit logic).
- **Not** touched by a regular UI edit (`trip-plan.service.ts update()`, used by the edit form) — editing a single field (e.g. a note) must not bump a row to the top of the list.
- Requires a migration: `ALTER TABLE trip_plans ADD COLUMN list_sorted_at TIMESTAMP NOT NULL DEFAULT now()`. Backfilling existing rows to `now()` at migration time is fine — it just means pre-existing rows form one "batch" that sorts above/below newly-touched rows depending on when the migration ran relative to future imports (consistent with "no listSortedAt info available for old rows, treat as one batch").
- This makes the previously-confusing `tripNumber = null` ordering problem (Risk in `## Risks / Trade-offs`) moot: rows are primarily ordered by recency-of-touch, and `tripNumber` (possibly `null`) is only a same-batch tie-breaker.
- `GET /trip-plans` default: `sortBy = pagination.sortBy ?? "listSortedAt"`, `sortOrder = pagination.sortOrder ?? "desc"`, with `tripNumber asc` as a hardcoded secondary `orderBy` whenever the primary sort is the default (not applied when the user explicitly picks a different `sortBy`).

**6. Changed-record diff is computed by reading the existing `TripPlan` row inside the same transaction, before the update write, and comparing field-by-field.**
Only fields actually present in `tripPlanData` (including the 8 fixed-slot fields and `documentSentDate`) are compared; `costs`/`TripPlanCost` are excluded from the diff (the delete+recreate pattern makes a meaningful "old value" ambiguous, and the cost amount is already visible via the fixed-slot diff for 8 of the 9 columns). If at least one field differs, the import service:
- calls `auditService.log({ action: "UPDATE", entityType: "TripPlan", entityId: row.id, beforeSnapshot: <old fields>, afterSnapshot: <new fields> }, tx)` — one entry per changed record, inside the same transaction as the update.
- appends a `{ rowNum, identifier, changes: [{ field, oldValue, newValue }] }` entry to an in-memory `changedRecords` array, returned as part of `ImportResult`.
Rows where nothing actually changed (re-importing an untouched export) produce no audit entry and no `changedRecords` entry — only genuine changes are reported, otherwise every full-sheet re-import would flood the audit log with no-op entries.

```ts
// packages/shared/src/index.ts — ImportResult addition
export interface ImportChangedField {
  field: string;
  oldValue: unknown;
  newValue: unknown;
}
export interface ImportChangedRecord {
  rowNum: number;
  identifier: string;       // e.g. vehiclePlate + tripDate, or tripNumber
  entityId: string;
  changes: ImportChangedField[];
}
export interface ImportResult {
  imported: number;
  updated?: number;
  warnings: string[];
  errors: string[];
  changedRecords?: ImportChangedRecord[];
}
```

**7. [SUPERSEDED — see Decision 3'] New `TripPlan` records always get `tripNumber = (max(TripPlan.tripNumber) ?? 0) + 1`...**
Reverted along with Decisions 3 and 5: there is no global counter anymore. New rows (via import or the UI form) get `tripNumber` set verbatim from STT if present (import) or left `null` (UI form) — see Decision 3'.

**8. Frontend "STT" column renders the row's display position, not the raw `tripNumber` from the API.**
`apps/web/.../trip-plans/page.tsx` currently renders `{trip.tripNumber ?? "—"}` directly (line ~1887). Change to a computed value: `(page - 1) * pageSize + index + 1` (or equivalent based on however the page already tracks pagination offset). This decouples the visible "row number" from the stored `tripNumber`/STT entirely — STT as data only exists to (a) let import preserve a file's internal row order as a same-batch tie-breaker (Decision 5') and (b) round-trip through export. The column header stays "STT"; only its value source changes.

**9. Unify "row has an `id` that isn't found in the DB" handling across all three import flows (`importVehicles`, `importTripPlans`, `importVehicleMaintenance`) to fall back to CREATE.**
Current behavior is inconsistent and was never intentional:
- `importVehicles` / `importTripPlans`: call `update({ where: { id: row.id } })` without checking existence first → Prisma throws `P2025` → caught by the per-row `try/catch` → recorded as a row **error**, no record created.
- `importVehicleMaintenance`: explicitly checks existence first, and if missing, pushes a **warning** and `continue`s — silently drops the row entirely, no record created either.
New unified behavior for all three: check existence by `id` first (already required for the changed-record diff, which needs the "before" snapshot anyway); if found → UPDATE as today; if **not found**, ignore the stale `id` value from the file and CREATE a new record the same way a row with no `id` column at all would be created (new `id` auto-generated by Prisma's `@default(cuid())`), and push a warning: `` `Hàng {rowNum}: ID "{row.id}" không tồn tại — đã tạo mới` ``. Rows with no `id` cell at all are unaffected (already CREATE, unchanged).

## Risks / Trade-offs

- **[Risk]** Existing `TripPlanCost` rows created by past imports for the 8 fixed-slot cost names (e.g. rows with `costName = "PHÍ NÂNG"`) will become orphaned/stale once import stops creating them — they won't be cleaned up automatically. → **Mitigation**: out of scope for this fix (no backfill requested); note in tasks as a manual follow-up if the customer needs historical data reconciled. Going forward, new imports won't add more.
- **[Risk]** Marking this **BREAKING** in the proposal is a behavior change for anyone relying on the old (no-op) import semantics for these 8 columns, or on STT being a no-op on re-import for existing rows. → **Mitigation**: this is the explicit bug being fixed; the old behavior was never correct relative to the rest of the system, and the new behavior was explicitly requested.
- **[Risk]** Existing `TripPlan` rows created via the UI form have `tripNumber = null`; once they're sorted by `tripNumber asc` by default, they'll cluster at one end of the list ahead of/behind imported rows rather than chronologically. → **Mitigation**: accepted trade-off per explicit user choice; these rows can get a real `tripNumber` the first time they're included in an export+reimport cycle, same as any other row.
- **[Trade-off]** Setting `*Name` to a fixed literal on import (rather than reading a name from the file) means a user can't relabel a fixed slot via Excel import — but the UI form doesn't expose changing these labels either, so this preserves parity rather than introducing a regression.
- **[Trade-off]** The changed-record diff only covers fields written via `tripPlanData` (fixed-slot costs, `documentSentDate`, `tripNumber`, core fields); changes to "CHI PHÍ PHÁT SINH KHÁC" via the `TripPlanCost` delete+recreate are not included in the diff/audit detail. → **Mitigation**: acceptable for now since that's a single column out of ~20 diffable fields; can be added later by comparing the old vs new cost sum if needed.

## Migration Plan

One DB migration: add `TripPlan.list_sorted_at` (`DateTime`, default `now()`, backfilled to `now()` for existing rows). Otherwise this is a backend + frontend code change (`import.service.ts` for all three flows, `kehoach-xe.parser.ts`, `kehoach-xe.builder.ts`, `trip-plan.service.ts`, `packages/shared/src/index.ts`, `import-export/page.tsx`, `trip-plans/page.tsx`). Rollback: revert the commit and the migration; no destructive data changes (the column is additive and `tripNumber` keeps its existing nullable shape).
