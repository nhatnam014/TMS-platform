## Context

`TripPlan` (`packages/db/prisma/schema.prisma`) already has 8 "fixed cost slot" columns (`phiNangAmount`, `phiHaAmount`, `phiVeSinhAmount`, `phiCuocAmount`, `veCongAmount`, `chiPhiKhacAmount`, `chiPhiTraiTuyenAmount`, `cauDuongAmount`), each read/written directly by `TripPlanService`, the create/edit web form's "Chi phí chuyến" grid, `kehoach-xe.builder.ts` (export), and `kehoach-xe.parser.ts` (import). Most of these slots also carry a companion `*Name` column (editable label) and some a `*Shd` (invoice number) column.

This change adds 7 more fields to the same area: LƯƠNG, CƯỚC, DOANH THU, PHỤ THU, CHI PHÍ, TIỀN DẦU, NEO XE, appended to the end of the existing "Chi phí chuyến" grid, and positioned in the Excel template and list view immediately after CẦU ĐƯỜNG and before NGÀY GỬI CT (which, along with NỘI DUNG/GHI CHÚ, must stay at the end of the row). These 7 fields shipped in three revisions the same day (2026-07-15): (1) originally amount-only; (2) an editable `*Name` companion added, matching the 8 existing slots' `Combobox`-driven name behavior; (3) this revision adds an SHĐ (invoice number) companion to all 7 as well — so each of the 7 now has the full `*Name` + `*Amount` + `shd*` shape, same as the 4 existing slots that already carry SHĐ (`phiNang`, `phiHa`, `phiVeSinh`, `veCong`).

This revision also adds an unrelated but same-session request: the "kế hoạch xe" Excel export/import currently has no column for the trip's `status` (`TripStatus` enum) at all — the web list page already shows a "Trạng thái" column, but the exported file doesn't. This revision adds a "TRẠNG THÁI" column to the Excel template, positioned right after "KHÁCH HÀNG" (confirmed with the user), independent of where "Trạng thái" sits in the web list (which is unchanged — it already exists near the end of that table).

A further same-session, same-page request: let users change a trip's status directly from the list table instead of only through the edit modal. `TripPlanController`/`TripPlanService` already exposed `PATCH /trip-plans/:id/status` → `updateStatus()` (with its own audit-log entry), unused by any part of the UI until now. This is a frontend-only change: the list table's "Trạng thái" cell becomes an interactive `<select>` (same color styling as the previous read-only badge) wired to that existing endpoint via an optimistic update, no backend or schema change needed.

This change lands on top of the in-progress change `fix-import-ke-hoach-xe-cost-fields`, whose code (not yet archived, but implemented in the working tree) already converted `kehoach-xe.parser.ts` from fixed-column-index mapping to header-text matching (`COLUMN_CANDIDATES` + `buildHeaderMap`/`colIdx`), and generalized the import changed-record diff to cover "all fields present in `tripPlanData`". Both mechanisms are reused as-is for the 7 new fields rather than re-implemented.

`openspec/specs/trip-plan-excel-export/spec.md` and `trip-plan-excel-import/spec.md` already document a pre-refactor model (cost columns populated from generic `TripPlanCost` rows matched by catalog name) that doesn't match the actual code (fixed-slot scalar columns, `CHI PHÍ PHÁT SINH KHÁC` is the only column still routed through `TripPlanCost`). This is pre-existing drift, noted as out-of-scope in `fix-import-ke-hoach-xe-cost-fields`. This change's spec deltas describe the 7 new columns accurately (matching real code) without attempting to correct the older, unrelated drift in the surrounding paragraphs.

## Goals / Non-Goals

**Goals:**
- Persist 7 new financial figures per trip plan: `luongAmount`, `cuocAmount`, `doanhThuAmount`, `phuThuAmount`, `chiPhiAmount`, `tienDauAmount`, `neoXeAmount`.
- Each of the 7 fields also gets an editable `*Name` string companion (`luongName`, `cuocName`, `doanhThuName`, `phuThuName`, `chiPhiName`, `tienDauName`, `neoXeName`), selectable-or-typeable via the same `Combobox` + `CostTemplate` catalog used by the 8 existing fixed slots.
- Each of the 7 fields also gets an SHĐ (invoice number) string companion (`shdLuong`, `shdCuoc`, `shdDoanhThu`, `shdPhuThu`, `shdChiPhi`, `shdTienDau`, `shdNeoXe`), matching the 4 existing slots that carry SHĐ.
- Expose all three (name/amount/SHĐ) in the create/edit web form, appended to the existing "Chi phí chuyến" grid after CẦU ĐƯỜNG.
- Round-trip the 7 `*Amount` fields (already done) and the 7 `shd*` fields through Excel export/import, positioned after CẦU ĐƯỜNG and before NGÀY GỬI CT — NỘI DUNG/GHI CHÚ/ID remain the last columns.
- Re-importing an edited export must update the `*Amount` and `shd*` fields on existing rows, same guarantee the 8 existing fixed slots already have (via the changed-record diff / audit log).
- Add a "TRẠNG THÁI" column to the Excel export/import, reflecting `TripPlan.status`, positioned right after "KHÁCH HÀNG".

**Non-Goals:**
- No new Excel column for the 7 `*Name` fields — confirmed with the user that the Name is a form/DB convenience only, same as the 8 existing slots (whose `*Name` is never written to the exported sheet either). The Excel header for the amount column stays the fixed text ("LƯƠNG", "CƯỚC", etc.) regardless of what name the user picked/typed.
- Not changing where "Trạng thái" appears in the web list table — it already exists there (near the end, before "Thao tác") and stays put; only the Excel file gains a status column, at a different position (after KHÁCH HÀNG) chosen independently for the spreadsheet layout.
- Not allowing `status` to be set via `POST /trip-plans` (create) — `CreateTripPlanDto` intentionally has no `status` field (new trips always start `PLANNED`); this revision does not change that constraint, so import only applies a parsed status on the UPDATE branch (re-import), never on CREATE.
- Not refactoring the web page's existing local `STATUS_LABELS` constant to use the new shared `TRIP_STATUS_LABELS` — left as duplicated, out of scope.
- Not correcting the pre-existing spec-vs-code drift in `trip-plan-excel-export`/`trip-plan-excel-import` beyond the columns directly affected by this change.
- Not changing the position, shape, or behavior of any of the 8 existing fixed cost slots or `CHI PHÍ PHÁT SINH KHÁC`.

## Decisions

**1. Add `*Name` and `shd*` string companion columns to all 7 fields — full parity with the 4 SHĐ-bearing existing slots (`phiNang`, `phiHa`, `phiVeSinh`, `veCong`).**
This change went through three same-day revisions (see git history / Context): amount-only → `*Name` added → this revision adds `shd*` too. Concretely: `luongName`/`shdLuong`, `cuocName`/`shdCuoc`, `doanhThuName`/`shdDoanhThu`, `phuThuName`/`shdPhuThu`, `chiPhiName`/`shdChiPhi`, `tienDauName`/`shdTienDau`, `neoXeName`/`shdNeoXe` — each a plain `String?` column, no forced default, populated the same way `phiNangName`/`shdNang` are today.

**2. Validation: `@IsOptional() @IsNumber() @IsPositive()` for amounts, `@IsOptional() @IsString()` for name/SHĐ — matching the 8 existing fixed slots exactly.**
Keeps behavior consistent. Alternative considered for amounts: allow `0`/negative (e.g. a correction/refund). Rejected — no such requirement was raised, and diverging validation between "cost slot" fields would be a surprising inconsistency.

**3. Column position: appended after CẦU ĐƯỜNG, before NGÀY GỬI CT, in the fixed order LƯƠNG → CƯỚC → DOANH THU → PHỤ THU → CHI PHÍ → TIỀN DẦU → NEO XE; each field's SHĐ column immediately follows its amount column, same adjacency pattern as `PHÍ NÂNG │ SHĐ NÂNG`.**

```
...CẦU ĐƯỜNG │ LƯƠNG │ SHĐ LƯƠNG │ CƯỚC │ SHĐ CƯỚC │ DOANH THU │ SHĐ DOANH THU │ PHỤ THU │ SHĐ PHỤ THU │ CHI PHÍ │ SHĐ CHI PHÍ │ TIỀN DẦU │ SHĐ TIỀN DẦU │ NEO XE │ SHĐ NEO XE │ NGÀY GỬI CT │ ...
```

**4. New TRẠNG THÁI column, positioned right after KHÁCH HÀNG (confirmed with the user).**

```
STT │ NGÀY │ SỐ XE │ KHÁCH HÀNG │ TRẠNG THÁI │ LOẠI HÌNH │ ĐƠN VỊ │ ...
```
Rendered as the Vietnamese label (`TRIP_STATUS_LABELS[tp.status]`), not the raw enum value — consistent with how every other Vietnamese-labeled column in this template reads.

**5. Excel import: extend `COLUMN_CANDIDATES`/`buildHeaderMap` header-text matching (already in place) with 7 SHĐ candidates + 1 status candidate, instead of adding new fixed-index lookups.**
```ts
// kehoach-xe.parser.ts — new entries in COLUMN_CANDIDATES
SHD_LUONG:      { occurrence: 0, texts: ["SHĐ LƯƠNG"] },
SHD_CUOC:       { occurrence: 0, texts: ["SHĐ CƯỚC"] },
SHD_DOANH_THU:  { occurrence: 0, texts: ["SHĐ DOANH THU"] },
SHD_PHU_THU:    { occurrence: 0, texts: ["SHĐ PHỤ THU"] },
SHD_CHI_PHI:    { occurrence: 0, texts: ["SHĐ CHI PHÍ"] },
SHD_TIEN_DAU:   { occurrence: 0, texts: ["SHĐ TIỀN DẦU"] },
SHD_NEO_XE:     { occurrence: 0, texts: ["SHĐ NEO XE"] },
TRANG_THAI:     { occurrence: 0, texts: ["TRẠNG THÁI"] },
```
Each SHĐ text is field-specific (not the bare `"SHĐ"` reused by `PHI_VE_SINH`/`VE_CONG`), so no `occurrence` disambiguation is needed and there's no collision risk with the two existing bare-`"SHĐ"` columns or with each other.

**6. Status parsing: reverse-lookup the Vietnamese label to the `TripStatus` enum via the new shared `TRIP_STATUS_LABELS` map; unrecognized text produces a per-row warning and leaves the field unset (no partial/guessed match).**
```ts
// kehoach-xe.parser.ts
const raw = cellText(row, COL.TRANG_THAI);
const status = raw ? reverseStatusLabel(raw) : undefined; // undefined if unrecognized
if (raw && !status) warnings.push(`Hàng ${rowNum}: không nhận dạng được trạng thái "${raw}"`);
```
`reverseStatusLabel` compares after `stripDiacritics()` (same normalization already used for header matching) so accent/case variants of a valid label still match; a completely different string does not.

**7. Import service: `status` is applied on the UPDATE branch only, never on CREATE.**
`CreateTripPlanDto` intentionally has no `status` field — new trip plans always start `PLANNED`, enforced today at the DTO/service level. Rather than bypass that constraint from the import path, `importTripPlans`'s CREATE branch ignores a parsed status entirely (new rows from import start `PLANNED`, same as manual creation); the UPDATE branch (re-import) applies it via conditional-spread and includes it in the changed-record diff, exactly like the 7 `shd*`/`*Amount` fields.

**8. Import service: write the 7 new `shd*` fields into `tripPlanData` alongside the existing fixed-slot fields, so they're automatically covered by the existing changed-record diff.** (Same mechanism already used for `*Amount` in the prior revision — conditional-spread, no new diff/audit code needed.)

**9. Web form: reuse `CostSlotInput` (the same component the 8 existing slots use) with `hasShd={true}`, instead of the amount-only `ExtraCostInput`.**
`CostSlotInput` already renders a `Combobox` for the name, an amount input, and (when `hasShd` is true) an SHĐ text input. Rendering the 7 new fields with `CostSlotInput`/`hasShd={true}` gets full parity with the 8 existing slots for free — no new UI component needed. `ExtraCostInput` becomes unused by this change and can be deleted if nothing else references it.

**10. New shared `TRIP_STATUS_LABELS` constant in `packages/shared/src/index.ts`, used by both the export builder and the import parser.**
Avoids duplicating the Vietnamese status-label map in two backend files. The web page's existing local `STATUS_LABELS` constant (used for form/list rendering) is left as-is — refactoring it to import the shared constant is a nice-to-have, not required for this change, and is out of scope to avoid unrelated churn in `trip-plans/page.tsx`.

## Risks / Trade-offs

- **[Risk]** Inserting columns in the middle of the Excel layout shifts every downstream column's position for anyone reading the file by fixed index instead of header text. → **Mitigation**: the import parser already reads by header text, so reordering is tolerated; this is only a concern for external tooling outside this system, which is out of scope.
- **[Risk]** `"CHI PHÍ"` as a column header is easy to visually confuse with the existing `"CHI PHÍ KHÁC/ PHÍ ĐỨT TEM"` and `"CHI PHÍ TRÁI TUYẾN/ CHỈ ĐỊNH/ BP CAM"` columns for someone editing the exported file by hand. → **Mitigation**: this exact label was explicitly requested by the user during an earlier exploration; header-text matching is an exact full-string match so there's no functional ambiguity, only a visual one for end users, which is accepted as-is.
- **[Trade-off]** The `*Name` value a user picks/types for these 7 fields is stored but never surfaced in the Excel export or the list table — same as the 8 existing slots today. Confirmed acceptable with the customer.
- **[Risk]** A hand-edited "TRẠNG THÁI" cell with a typo or a status label from a future enum value won't be recognized and silently leaves the row's status unchanged on re-import (only a warning is surfaced, not a hard failure). → **Mitigation**: consistent with how this parser already treats every other unrecognized value (soft warning, not a rejected import); the alternative (failing the whole row) was not requested and would be a larger behavior change.
- **[Trade-off]** Status can only be changed via re-import (UPDATE), never via a fresh import-created row — a first-time bulk import of historical data will have every row start as `PLANNED` regardless of what its "TRẠNG THÁI" cell says, requiring a second re-import pass to apply real statuses. Accepted because changing this would require loosening `CreateTripPlanDto`'s intentional "no status on create" rule, which is a separate decision outside this change's scope — flagged here in case the customer wants it revisited.

## Migration Plan

Three DB migrations in total for the `*Amount`/`*Name`/`shd*` trio (or combine the not-yet-applied ones — check with the user/team before deciding to squash):
1. (Already applied) 7 new nullable `Decimal(15,2)` columns on `trip_plans`: `luong_amount`, `cuoc_amount`, `doanh_thu_amount`, `phu_thu_amount`, `chi_phi_amount`, `tien_dau_amount`, `neo_xe_amount`.
2. (Not yet applied) 7 new nullable `String` columns on `trip_plans`: `luong_name`, `cuoc_name`, `doanh_thu_name`, `phu_thu_name`, `chi_phi_name`, `tien_dau_name`, `neo_xe_name`.
3. (New, this revision) 7 new nullable `String` columns on `trip_plans`: `shd_luong`, `shd_cuoc`, `shd_doanh_thu`, `shd_phu_thu`, `shd_chi_phi`, `shd_tien_dau`, `shd_neo_xe`.

No schema/migration change is needed for the TRẠNG THÁI column — `TripPlan.status` already exists; this is purely an export/import mapping change.

All migrations are purely additive — no backfill, no data loss, no impact on existing rows (`NULL` for all pre-existing rows). Rollback: revert the commit and the migration(s).
