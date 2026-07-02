## Context

`YardMove` currently models a factory-internal zone shuttle workflow: a container moves between `fromZone`/`toZone`, goes through a `status` lifecycle (`PENDING` → `IN_PROGRESS` → `COMPLETED`/`CANCELLED`), and accrues `YardMoveCost` line items. This was historically tied to container status transitions, but the container-status side effect was already removed in a prior change (see the `REMOVED Requirements` section of `openspec/specs/yard-move/spec.md`), leaving the zone/status/cost machinery without its original purpose.

The business actually tracks "lệnh bãi" in a flat Excel sheet with one row per trip: STT, NGÀY, GPS, FULL NAME, TRUCK, MOOC, BOOKING, CONTAINER, GHI CHÚ, DÃ KÉO. Every field in the sheet is a manually-typed string — there is no validation, no fixed vocabulary for GPS codes, and rows are frequently incomplete (e.g. a row with only a date and booking number). The redesign replaces the zone/status/cost model with a model matching this sheet, and reuses the existing Excel import/export architecture (already proven for trip plans and vehicles) to add file-based create/update for yard moves.

The yard_moves table has no production data, so this is a clean schema replacement rather than a data migration.

## Goals / Non-Goals

**Goals:**
- Replace `YardMove`'s zone/status/cost fields with flat free-text fields matching the Excel sheet columns.
- Keep the existing soft-delete (`isActive`) and audit-logging conventions used elsewhere in the codebase.
- Make every create/edit form field a plain text input — no selects, no date picker, no FK lookups.
- Add Excel import/export for yard moves using the same builder/parser/ExcelJS pattern as the `kehoach-xe` (trip plans) and `quanly-xe` (vehicles) flows, including the hidden `ID` column convention that lets re-imports match existing records.
- Keep list-page pagination at 10 records/page, matching the existing `PAGE_SIZE_YARD` constant already used on this page.

**Non-Goals:**
- No re-introduction of any status workflow, cost tracking, or zone/location linkage for yard moves.
- No validation/format enforcement on GPS, truck, mooc, booking, or container fields (sheet data is inconsistent — e.g. `"60H21349"` vs `"60H-21349"` — and the business wants free-text entry, not normalization).
- No data migration from the old zone/status model — table is empty.
- No change to the `Location` or `Container` entities themselves (only `YardMove`'s use of them is removed).

## Decisions

### 1. `date` stays a column but the API treats it as free text, not `@IsDateString`
The Excel sheet uses `DD/MM` entries with no year, and the user explicitly asked for "ngày" to be a hand-typed text string in the create form, not a date picker. Decision: keep a `date` column on `YardMove` for now (still useful for default sort order) but store/accept it as a plain `String` rather than `DateTime`, and drop the `@IsDateString` validator from the create/update DTOs. The frontend form uses `<input type="text">` instead of `<input type="date">`. List sorting/filtering by "date" becomes a string sort/contains-filter rather than a date-range query — acceptable since the column is inherently unordered free text in the source data (mixed formats, missing years).

Alternative considered: keep `DateTime` and parse `DD/MM` into a real date with an assumed year. Rejected — ambiguous year assignment and silent reformatting would diverge from the source sheet and contradicts the user's explicit "nhập tay text string" requirement.

### 2. Remove `YardMoveCost` and its enum entirely rather than keep unused
`YardCostType`/`YardMoveCost` only existed to support the removed cost-tracking workflow. Decision: drop the model, its table, and the enum from the Prisma schema and `@tms/shared` exports, and delete the `POST /yard-moves/:id/costs` endpoint and `CostModal` component. Confirmed with the user that the table holds no production data, so a destructive migration is acceptable.

Alternative considered: leave the table in place but unused. Rejected — dead schema invites confusion and the user explicitly chose full replacement over a parallel/legacy column approach.

### 3. `containerNumber` keeps its column name but loses format validation
Rather than renaming the column (which would touch more code paths and migrations for no behavioral benefit), keep `containerNumber` as the Prisma/DTO field name but remove the `@Matches(/^[A-Z]{4}\d{7}$/)` validator, making it a plain optional string like the other text fields. This matches the "CONTAINER" column in the sheet, which contains some non-conforming values is not guaranteed.

### 4. New fields: `gps`, `fullName`, `truck`, `mooc`, `booking`, `daKeo` — all optional strings
Mirrors the Excel sheet directly. All optional because real rows are frequently incomplete (sheet row 34 in the source file has only a date and booking number). No enum/select for `gps` despite repeating values (`AK`, `NP`, `NA`, `DTP`) — confirmed with user this is free text, not a fixed vocabulary, so no reference-data table is introduced for it.

### 5. STT is a computed display value, not a stored column
Confirmed with the user: STT is the row's position in the (paginated, filtered) list, computed on the frontend/export builder exactly like the existing `kehoach-xe` and `quanly-xe` exports already do (`index` based, not a stored field). No `tripNumber`-style column is added to `YardMove`.

### 6. Excel import/export follows the existing builder/parser/audit pattern exactly
New files: `apps/api/src/modules/export/builders/lenh-bai.builder.ts` and `apps/api/src/modules/import/parsers/lenh-bai.parser.ts`, wired into the existing `ExportService`/`ExportController` and `ImportService`/`ImportController` the same way `kehoach-xe`/`quanly-xe`/`baoduong-xe` are wired in. This includes:
- Branded header (logo + title block) on rows 1-8, column header row at row 9, data from row 10 — same layout as the other 3 builders.
- Header-row detection in the parser by scanning the first 25 rows for "stt" in an early column, with diacritic-stripped header matching for column resolution (tolerates `Đ`/`D`, accents) — same as `kehoach-xe.parser.ts`.
- A hidden trailing `ID` column so re-imports can match and update existing records by id; rows without an ID are treated as new records.
- Preview (`?confirm=false`) and execute (`?confirm=true`) modes returning `{ imported, updated, warnings[], errors[], changedRecords[] }`, matching `quanly-xe`'s contract.
- Per-record and summary `AuditService` log entries (`entityType: "YardMove"`), matching the existing convention.

Alternative considered: a generic/shared builder+parser parameterized by column config, to avoid the 4th near-duplicate implementation. Rejected for this change — the existing 3 flows are not yet unified behind a shared abstraction, and introducing one now would mix an unrelated refactor into this change. Noted as a candidate follow-up, not part of this scope.

### 7. List page UI: plain table, no status badges, no zone labels
The list page table is simplified to render the 10 sheet-matching columns directly with no derived badge/coloring logic (status badges and zone-label mapping are deleted entirely along with the fields they displayed). GHI CHÚ is rendered as plain text — the Excel cell-fill colors seen in the source sheet are not modeled or reproduced (confirmed with user: text only, no color semantics).

## Risks / Trade-offs

- **[Risk] Treating `date` as free text loses the ability to do real date-range filtering/sorting on yard moves.** → Mitigation: this matches the source data's actual structure (inconsistent, yearless date strings); if date-range filtering becomes a real need later, it would require a separate follow-up to introduce a normalized date field alongside the free-text display value.
- **[Risk] Dropping `YardMoveStatus`/`YardCostType` enums could break other code if something else references them.** → Mitigation: grep `@tms/shared` and the web app for `YardMoveStatus`/`YardCostType` usage before removing; only remove if exclusively used by the yard-move feature being replaced.
- **[Risk] A 4th near-duplicate import/export builder+parser increases maintenance surface.** → Mitigation: accepted for consistency with the existing 3 flows; explicitly scoped out of this change as a refactor candidate (see Decision 6).
- **[Risk] Free-text `gps`/`truck`/`mooc`/`booking`/`containerNumber` with no validation allows inconsistent data entry (e.g. `"60H21349"` vs `"60H-21349"`).** → Mitigation: accepted per explicit user direction — the source sheet already has this inconsistency and normalizing it is out of scope.

## Migration Plan

1. Prisma migration: drop `fromZone`, `toZone`, `locationId` (and its FK constraint), `status` columns from `yard_moves`; drop the `yard_move_costs` table; drop `YardMoveStatus`/`YardCostType` enums if unreferenced elsewhere; add `gps`, `fullName`, `truck`, `mooc`, `booking`, `daKeo` as nullable `String` columns; change `date` from `DateTime` to `String`; relax `containerNumber` to nullable.
2. No data backfill needed (table is empty in all environments).
3. Deploy backend (DTOs, controller, service, export builder, import parser) and frontend together — the API response shape changes are breaking, so the old frontend would not render correctly against the new API and vice versa.
4. Rollback: if needed, a down-migration restoring the old columns/enums/table is straightforward since there is no data to lose either direction.

## Open Questions

None outstanding — all open design questions (workflow removal, data retention, STT semantics, GPS vocabulary, color handling) were confirmed with the user during exploration.
