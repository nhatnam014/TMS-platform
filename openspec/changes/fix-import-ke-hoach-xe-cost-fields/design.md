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
- Make STT (Excel) and `tripNumber` (DB) a single synced value: export writes the real `tripNumber`, import writes `tripNumber` from STT on both create and update.
- Persist `documentSentDate` on both create and update.
- Default-sort the trip plans list by `tripNumber` ascending instead of `tripDate`.
- Surface, per import run, which existing records were changed (fields + old/new values), both as individual Audit Log entries and in the import API response/UI.

**Non-Goals:**
- No changes to `trip-plan.service.ts` create/update (UI form) — already uses the correct fixed-slot model.
- No schema/migration changes — all target columns already exist.
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

**3. `tripNumber` is set from STT on UPDATE only; new records (no `id`) always get an auto-incremented `tripNumber`, ignoring any STT value in the file; export writes the real `tripNumber` instead of row position.**
Superseded an earlier draft of this decision, which set `tripNumber` from STT on both create and update. Revised again after a follow-up requirement: STT in an exported file is meaningful only for *existing* rows (it round-trips the real `tripNumber`); for brand-new rows (no `id`, whether typed directly into the UI's create form or added as a new row in an imported sheet) there's no reliable STT to read — a freshly-added Excel row has no real position semantics, and the UI form has no STT input at all. So:
- `kehoach-xe.builder.ts`: STT column = `tp.tripNumber ?? (idx + 1)` (fallback only for legacy rows that were created via the UI form before this change, which never set `tripNumber`).
- `import.service.ts` UPDATE branch: `...(row.tripNumber !== undefined && { tripNumber: row.tripNumber })` — STT from the file still drives `tripNumber` for existing rows; a blank STT cell doesn't null out an existing value.
- `import.service.ts` CREATE branch and `trip-plan.service.ts create()`: `row.tripNumber`/any STT-equivalent input is ignored entirely; `tripNumber` is always computed as `(max existing TripPlan.tripNumber ?? 0) + 1` (see decision 7).
This is safe because export now always reflects the true `tripNumber` for existing rows — a re-import without editing STT writes back the same value it read for those rows, and a re-import after deliberately renumbering STT updates them; new rows get a fresh number regardless of what (if anything) is in their STT cell.

**4. `documentSentDate` added to both create and update data objects**, following the same `!== undefined` conditional-spread pattern already used for `donViSuaChua`/`ngayLam`-style optional dates elsewhere in this file.

**5. Default sort changes to `tripNumber asc` via a one-line default change in `trip-plan.service.ts findAll`.**
`sortBy = pagination.sortBy ?? "tripNumber"`, `sortOrder = pagination.sortOrder ?? "asc"`. The trip plans page never sends an explicit `sortBy`/`sortOrder` today, so this takes effect immediately with no frontend change required. Existing rows with `tripNumber = null` (created via the UI form, never imported) sort first under Prisma's default null-ordering for ascending sort — acceptable since this only affects rows that have never gone through Excel import.

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
  tripPlanId: string;
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

**7. New `TripPlan` records (no `id`) always get `tripNumber = (max(TripPlan.tripNumber) ?? 0) + 1`, computed globally across the whole table — not scoped by date or customer.**
Applies identically to both creation paths: `trip-plan.service.ts create()` (UI form) and `import.service.ts`'s CREATE branch (new rows in an imported sheet). The max-lookup and the `tripPlan.create` write happen inside the same `$transaction` so the computed number is consistent with what was just written, given each creation already runs inside its own transaction and import rows are processed sequentially (one row's transaction completes — including its create — before the next row's transaction starts, so there's no cross-row race within a single import run). Alternative considered: scope the max per day or per customer (mirroring a daily/customer trip counter). Rejected — STT/`tripNumber` has always behaved as a single global ordering value (that's what made the original STT-on-create approach meaningful), and the customer didn't ask for a scoped counter.

## Risks / Trade-offs

- **[Risk]** Existing `TripPlanCost` rows created by past imports for the 8 fixed-slot cost names (e.g. rows with `costName = "PHÍ NÂNG"`) will become orphaned/stale once import stops creating them — they won't be cleaned up automatically. → **Mitigation**: out of scope for this fix (no backfill requested); note in tasks as a manual follow-up if the customer needs historical data reconciled. Going forward, new imports won't add more.
- **[Risk]** Marking this **BREAKING** in the proposal is a behavior change for anyone relying on the old (no-op) import semantics for these 8 columns, or on STT being a no-op on re-import for existing rows. → **Mitigation**: this is the explicit bug being fixed; the old behavior was never correct relative to the rest of the system, and the new behavior was explicitly requested.
- **[Risk]** Existing `TripPlan` rows created via the UI form have `tripNumber = null`; once they're sorted by `tripNumber asc` by default, they'll cluster at one end of the list ahead of/behind imported rows rather than chronologically. → **Mitigation**: accepted trade-off per explicit user choice; these rows can get a real `tripNumber` the first time they're included in an export+reimport cycle, same as any other row.
- **[Trade-off]** Setting `*Name` to a fixed literal on import (rather than reading a name from the file) means a user can't relabel a fixed slot via Excel import — but the UI form doesn't expose changing these labels either, so this preserves parity rather than introducing a regression.
- **[Trade-off]** The changed-record diff only covers fields written via `tripPlanData` (fixed-slot costs, `documentSentDate`, `tripNumber`, core fields); changes to "CHI PHÍ PHÁT SINH KHÁC" via the `TripPlanCost` delete+recreate are not included in the diff/audit detail. → **Mitigation**: acceptable for now since that's a single column out of ~20 diffable fields; can be added later by comparing the old vs new cost sum if needed.

## Migration Plan

No DB migration needed. Deploy is a backend + frontend code change (`import.service.ts`, `kehoach-xe.parser.ts`, `kehoach-xe.builder.ts`, `trip-plan.service.ts`, `packages/shared/src/index.ts`, `import-export/page.tsx`). No rollback concerns beyond standard revert of the commit, since no schema or stored-data shape changes.
