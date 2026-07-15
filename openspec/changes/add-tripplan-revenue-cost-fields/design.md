## Context

`TripPlan` (`packages/db/prisma/schema.prisma`) already has 8 "fixed cost slot" columns (`phiNangAmount`, `phiHaAmount`, `phiVeSinhAmount`, `phiCuocAmount`, `veCongAmount`, `chiPhiKhacAmount`, `chiPhiTraiTuyenAmount`, `cauDuongAmount`), each read/written directly by `TripPlanService`, the create/edit web form's "Chi phí chuyến" grid, `kehoach-xe.builder.ts` (export), and `kehoach-xe.parser.ts` (import). Most of these slots also carry a companion `*Name` column (editable label) and some a `*Shd` (invoice number) column.

This change adds 7 more amount-only fields to the same area: LƯƠNG, CƯỚC, DOANH THU, PHỤ THU, CHI PHÍ, TIỀN DẦU, NEO XE. Unlike the 8 existing slots, these have no editable label and no invoice number — confirmed with the user during exploration (`/spx-plan`): "amount-only" shape, appended to the end of the existing "Chi phí chuyến" grid, and positioned in the Excel template and list view immediately after CẦU ĐƯỜNG and before NGÀY GỬI CT (which, along with NỘI DUNG/GHI CHÚ, must stay at the end of the row).

This change lands on top of the in-progress change `fix-import-ke-hoach-xe-cost-fields`, whose code (not yet archived, but implemented in the working tree) already converted `kehoach-xe.parser.ts` from fixed-column-index mapping to header-text matching (`COLUMN_CANDIDATES` + `buildHeaderMap`/`colIdx`), and generalized the import changed-record diff to cover "all fields present in `tripPlanData`". Both mechanisms are reused as-is for the 7 new fields rather than re-implemented.

`openspec/specs/trip-plan-excel-export/spec.md` and `trip-plan-excel-import/spec.md` already document a pre-refactor model (cost columns populated from generic `TripPlanCost` rows matched by catalog name) that doesn't match the actual code (fixed-slot scalar columns, `CHI PHÍ PHÁT SINH KHÁC` is the only column still routed through `TripPlanCost`). This is pre-existing drift, noted as out-of-scope in `fix-import-ke-hoach-xe-cost-fields`. This change's spec deltas describe the 7 new columns accurately (matching real code) without attempting to correct the older, unrelated drift in the surrounding paragraphs.

## Goals / Non-Goals

**Goals:**
- Persist 7 new amount-only financial figures per trip plan: `luongAmount`, `cuocAmount`, `doanhThuAmount`, `phuThuAmount`, `chiPhiAmount`, `tienDauAmount`, `neoXeAmount`.
- Expose them in the create/edit web form, appended to the existing "Chi phí chuyến" grid after CẦU ĐƯỜNG.
- Round-trip them through Excel export/import, positioned after CẦU ĐƯỜNG and before NGÀY GỬI CT — NỘI DUNG/GHI CHÚ/ID remain the last columns.
- Re-importing an edited export must update these 7 fields on existing rows, same guarantee the 8 existing fixed slots already have (via the changed-record diff / audit log).

**Non-Goals:**
- No editable name/label for any of the 7 fields — the Excel header and form label are the only place the name appears, hardcoded, never stored or user-editable (unlike the 8 existing slots, which store a `*Name` snapshot).
- No invoice number (SHĐ) field for any of the 7 fields.
- Not correcting the pre-existing spec-vs-code drift in `trip-plan-excel-export`/`trip-plan-excel-import` beyond the column list directly affected by this change.
- Not changing the position, shape, or behavior of any of the 8 existing fixed cost slots or `CHI PHÍ PHÁT SINH KHÁC`.

## Decisions

**1. Amount-only columns — no `*Name`/`*Shd` companion columns.**
The 8 existing slots pair `*Name` (editable, defaults to a hardcoded Vietnamese label on submit) with `*Amount` because the product originally modeled cost entries generically (a name+amount pair), a holdover from the pre-refactor `TripPlanCost`-per-name model. The user confirmed during exploration that the 7 new fields don't need this — the label is always fixed (e.g. "LƯƠNG"), so a single `Decimal(15,2)?` column per field is sufficient. This avoids 14 unnecessary DB columns and simplifies the DTO/form/parser code for these fields (no "set name to hardcoded label" step needed anywhere).

**2. Validation: `@IsOptional() @IsNumber() @IsPositive()`, matching the 8 existing amount fields.**
Keeps behavior consistent — a `0` or negative value is rejected with HTTP 400, same as `phiNangAmount` etc. Alternative considered: allow `0`/negative (e.g. a correction/refund). Rejected — no such requirement was raised, and diverging validation between "cost slot" fields would be a surprising inconsistency.

**3. Column position: appended after CẦU ĐƯỜNG, before NGÀY GỬI CT, in the fixed order LƯƠNG → CƯỚC → DOANH THU → PHỤ THU → CHI PHÍ → TIỀN DẦU → NEO XE.**
This was the exact ordering confirmed with the user. It groups the new fields with the existing "cost slot" block rather than scattering them, and satisfies the hard requirement that NỘI DUNG/GHI CHÚ (and the trailing ID column) stay last.

```
...CẦU ĐƯỜNG │ LƯƠNG │ CƯỚC │ DOANH THU │ PHỤ THU │ CHI PHÍ │ TIỀN DẦU │ NEO XE │ NGÀY GỬI CT │ CHI PHÍ PHÁT SINH KHÁC │ NỘI DUNG │ GHI CHÚ │ ID
```

**4. Excel import: extend `COLUMN_CANDIDATES`/`buildHeaderMap` header-text matching (already in place from `fix-import-ke-hoach-xe-cost-fields`) instead of adding new fixed-index lookups.**
```ts
// kehoach-xe.parser.ts — new entries in COLUMN_CANDIDATES
LUONG:      { occurrence: 0, texts: ["LƯƠNG"] },
CUOC:       { occurrence: 0, texts: ["CƯỚC"] },
DOANH_THU:  { occurrence: 0, texts: ["DOANH THU"] },
PHU_THU:    { occurrence: 0, texts: ["PHỤ THU"] },
CHI_PHI:    { occurrence: 0, texts: ["CHI PHÍ"] },
TIEN_DAU:   { occurrence: 0, texts: ["TIỀN DẦU"] },
NEO_XE:     { occurrence: 0, texts: ["NEO XE"] },
```
`colIdx()` matches the full stripped header-cell text against the candidate string (not a substring search), so `"CHI PHÍ"` cannot accidentally match `"CHI PHÍ KHÁC/ PHÍ ĐỨT TEM"` or `"CHI PHÍ TRÁI TUYẾN/ CHỈ ĐỊNH/ BP CAM"` — those are different full strings. No `occurrence` disambiguation is needed since none of the 7 new header texts are reused elsewhere in the template (unlike the two bare `"SHĐ"` columns).

**5. Import service: write the 7 new fields into `tripPlanData` alongside the 8 existing fixed-slot fields, so they're automatically covered by the existing changed-record diff.**
`import.service.ts`'s diff logic (from `fix-import-ke-hoach-xe-cost-fields`) already compares every field present in `tripPlanData` field-by-field before an UPDATE. Adding the 7 new fields to that same object (conditional-spread, `row.luongAmount !== undefined && { luongAmount: row.luongAmount }`, etc.) means no new diff/audit code is needed — they're picked up for free.

**6. Export builder: append the 7 new fields to the `HEADERS`/`COL_WIDTHS`/data-row arrays at the position decided in #3.**
No structural change to `buildKeHoachXe` — it already iterates a fixed array of columns per row.

## Risks / Trade-offs

- **[Risk]** Inserting 7 columns in the middle of the Excel layout shifts every downstream column's position for anyone reading the file by fixed index instead of header text. → **Mitigation**: the import parser already reads by header text (post `fix-import-ke-hoach-xe-cost-fields`), so reordering is tolerated; this is only a concern for external tooling outside this system, which is out of scope.
- **[Risk]** `"CHI PHÍ"` as a new column header is easy to visually confuse with the existing `"CHI PHÍ KHÁC/ PHÍ ĐỨT TEM"` and `"CHI PHÍ TRÁI TUYẾN/ CHỈ ĐỊNH/ BP CAM"` columns for someone editing the exported file by hand. → **Mitigation**: this exact label was explicitly requested by the user ("user yêu cầu vậy nên cứ làm vậy") during exploration; header-text matching is an exact full-string match so there's no functional ambiguity, only a visual one for end users, which is accepted as-is.
- **[Trade-off]** No editable name for any of the 7 fields means a future request to rename one of these columns requires a code change, not a UI edit — consistent with the confirmed "amount-only" decision and out of scope to hedge against speculatively.

## Migration Plan

One DB migration: add 7 new nullable `Decimal(15,2)` columns to `trip_plans` (`luong_amount`, `cuoc_amount`, `doanh_thu_amount`, `phu_thu_amount`, `chi_phi_amount`, `tien_dau_amount`, `neo_xe_amount`). Purely additive — no backfill, no data loss, no impact on existing rows (`NULL` for all pre-existing rows). Rollback: revert the commit and the migration.
