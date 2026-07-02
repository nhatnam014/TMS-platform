## Context

`YardMove.date` is a free-text `String` column (`packages/db/prisma/schema.prisma`), entered via a plain `<input type="text">` with placeholder `"24/06"`. It is never parsed or validated anywhere in the stack — the DTOs use `@IsString()`, the service passes it straight to Prisma, the Excel parser (`lenh-bai.parser.ts`) reads the "NGÀY" cell as raw text via `cellText()`, and the Excel builder (`lenh-bai.builder.ts`) writes `rec.date` straight into a cell with no formatting. The user confirmed the required granularity is day/month/year (no time-of-day), and that all existing `YardMove` rows are test data that can be dropped without a backfill.

The web app already has a shared date-utils module (`apps/web/src/lib/date-utils.ts`, see spec `date-formatting`) providing `formatDate`, `formatDateTime`, and `toDateInput` — the same pattern `TripPlan.tripDate` (`DateTime @db.Date`) already uses with a native `<input type="date">`. This change brings `YardMove.date` in line with that existing, working pattern rather than inventing a new one.

## Goals / Non-Goals

**Goals:**
- `YardMove.date` becomes a real `DateTime @db.Date` column, entered via a native `<input type="date">`.
- Excel import reads the "NGÀY" column as a real date (native Excel date cell or `dd/mm/yyyy` text) and rejects rows where it can't be parsed.
- Excel export writes the "NGÀY" column as a real Excel date value (not a string), formatted `dd/mm/yyyy`, so a round-trip export → import preserves the value.
- Reuse the existing `@/lib/date-utils` helpers (`toDateInput`, `formatDate`) rather than adding a new date utility or a custom picker component.

**Non-Goals:**
- No time-of-day component — the field stays date-only (`@db.Date`), matching `TripPlan.tripDate`.
- No backfill/migration of existing `YardMove` rows — they are test data and will be dropped as part of the Prisma migration.
- No change to any other `YardMove` field or to the `TripPlan` module.

## Decisions

**1. `String` → `DateTime @db.Date`, not a validated ISO string kept as `String`.**
Using a real `DateTime` column matches the existing `TripPlan.tripDate` pattern exactly and lets Postgres/Prisma handle date semantics (sorting, comparisons) natively instead of relying on lexically-sortable ISO strings. Since existing data is disposable test data, there's no migration-complexity reason to avoid the type change.

**2. Reuse `@/lib/date-utils` instead of a new component.**
`toDateInput()` already converts a `DateTime`/ISO value to `yyyy-mm-dd` for `<input type="date">`, and `formatDate()` already renders `dd/mm/yyyy` for display. The `date-formatting` spec already lists `yard-moves/page.tsx` as a page that *should* use `formatDate` — today it doesn't, because `date` wasn't a real date. This change makes the yard-moves page finally comply with that existing spec, closing a gap rather than opening a new one.

**3. Excel export: write a formatted `dd/mm/yyyy` string, matching every other export builder — not a native date cell.**
Checked `kehoach-xe.builder.ts`, `quanly-xe.builder.ts`, and `baoduong-xe.builder.ts`: all three write date columns via a local `formatDate()` helper producing a plain `dd/mm/yyyy` string cell — none use `cell.numFmt` with a native `Date` value. `lenh-bai.builder.ts` already has this exact `formatDate()` helper (currently only used for the branded header's "Ngày xuất" line); reusing it for the NGÀY data column keeps the four export builders consistent instead of introducing a one-off native-date-cell approach. On the import side, `lenh-bai.parser.ts` reuses the existing shared `parseExcelDate()` utility (`apps/api/src/modules/import/utils/excel-date.ts`, already used by `kehoach-xe.parser.ts`), which accepts a native Excel date cell, an Excel serial number, or `dd/mm/yyyy`/`dd-mm-yyyy`/ISO text — so a hand-typed `dd/mm/yyyy` string (matching what export now produces) parses back correctly, keeping the export → re-import round-trip lossless.

**4. Rows with an unparseable "NGÀY" value are reported as an import error, not silently coerced.**
Today, any non-empty string in the "NGÀY" column is accepted (since it's freeform). After this change, a value that isn't a recognizable date must be rejected per-row (added to `errors`, row skipped) rather than crashing the whole import or silently writing an invalid value — consistent with the existing "missing date" error-row pattern already in `lenh-bai.parser.ts`.

## Risks / Trade-offs

- **[Risk]** Users have been typing dates as `"24/06"` (no year) — a native `<input type="date">` requires a year, so the create/edit form UX changes (users must now pick a full date). → **Mitigation**: this is the explicit, confirmed requirement; no mitigation needed beyond documenting it in the proposal.
- **[Risk]** Hand-edited Excel files may contain dates in inconsistent text formats (`24/06/2026`, `24-06-2026`, `2026-06-24`, etc.). → **Mitigation**: parser accepts native Excel date cells (preferred) and `dd/mm/yyyy` text; any other format is treated as unparseable and reported as a row error, matching the existing "missing NGÀY" error convention.
- **[Risk]** Existing `YardMove` test rows in any shared/staging database become invalid once the column type changes. → **Mitigation**: explicitly confirmed acceptable by the user (test data only); the Prisma migration will reset/drop existing rows rather than attempt a backfill.
- **[Risk, found during implementation]** The shared `parseExcelDate` utility (`apps/api/src/modules/import/utils/excel-date.ts`) builds dates from text input with the local-timezone `new Date(y, m, d)` constructor. Serialized directly to `@db.Date`, this silently shifted every imported date by a day on this server's `Asia/Saigon` (UTC+7) timezone. → **Mitigation**: `lenh-bai.parser.ts` re-anchors the parsed value to UTC midnight of the same *local* calendar day, but only for the text-input path — native Excel date cells and numeric day-serials from `parseExcelDate` are already UTC-anchored correctly and are passed through unchanged, so the fix doesn't introduce a reverse shift for native-date-cell inputs in negative-UTC-offset environments. The shared utility itself is untouched, since `kehoach-xe.parser.ts` (trip-plan import) also depends on it and fixing that is out of this change's scope — worth flagging separately, since trip-plan Excel imports likely have the same latent bug in this deployment's timezone.

## Migration Plan

1. Update `packages/db/prisma/schema.prisma`: `date String` → `date DateTime @db.Date`.
2. Generate a Prisma migration; since existing `yard_moves` rows can't be losslessly cast from free text to `date`, the migration truncates the `yard_moves` table (or drops/recreates the `date` column) rather than attempting a data cast.
3. Update DTOs, service, web form, Excel parser/builder, and import service mapping (see proposal's "What Changes").
4. Run `prisma migrate dev` (or the project's equivalent) locally, verify the app still builds and the yard-moves page round-trips create/edit/import/export.

No rollback beyond reverting the migration and code changes is needed, since there is no production data at stake.
