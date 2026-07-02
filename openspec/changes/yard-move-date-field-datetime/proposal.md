## Why

`YardMove.date` ("Tiến độ vận tải") is currently a free-text `String` column entered via a plain `<input type="text">` (placeholder `"24/06"`, no year, no validation). Users need a real date picker that captures a full day/month/year value, and the Excel import/export flow needs to read and write that same column as an actual date instead of passing through arbitrary text. Existing `YardMove` rows are test data and can be discarded, which removes the main migration risk.

## What Changes

- Change `YardMove.date` from `String` to `DateTime @db.Date` in the Prisma schema (Prisma migration; existing test rows are dropped/reset, no backfill).
- Change `CreateYardMoveDto.date` / `UpdateYardMoveDto.date` validation from `@IsString()` to `@IsDateString()`.
- Replace the `<input type="text" placeholder="24/06">` date field in the create/edit yard move forms (`apps/web/.../yard-moves/page.tsx`) with `<input type="date">`, using the existing `toDateInput`/`formatDate` helpers from `@/lib/date-utils` for value conversion and table display.
- Update `lenh-bai.parser.ts` (Excel import) to read the "NGÀY" column as a real date (handle both native Excel date cells and `dd/mm/yyyy` text) instead of raw text, and reject/report rows with an unparseable date.
- Update `lenh-bai.builder.ts` (Excel export) to write the date column via its existing local `formatDate()` helper (`dd/mm/yyyy` string), matching the convention already used by `kehoach-xe.builder.ts`/`quanly-xe.builder.ts`/`baoduong-xe.builder.ts`, instead of writing the raw pass-through value.
- Update `import.service.ts#importYardMoves` to pass a parsed `Date`/ISO value to Prisma instead of the raw string.
- Update `yard-move.service.ts` audit-log summary strings that currently interpolate `dto.date` directly, so they format the date instead of printing a raw `Date` object.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `yard-move`: `date` field type changes from free-text `String` to `DateTime @db.Date`; `CreateYardMoveDto`/`UpdateYardMoveDto` validate `date` as an ISO date string instead of any string.
- `yard-move-interactions`: create/edit form date field becomes a native date picker (`type="date"`) instead of a free-text input; list display formats the date instead of printing it verbatim.
- `yard-move-excel-import`: the "NGÀY" column is parsed as a date value (Excel date cell or `dd/mm/yyyy` text), not passed through as raw text; rows with an unparseable date are reported as an error instead of silently accepted.
- `yard-move-excel-export`: the "NGÀY" column is written as a real Excel date value with `dd/mm/yyyy` formatting, not a raw string.

## Impact

- `packages/db/prisma/schema.prisma` — `YardMove.date` type change + migration.
- `apps/api/src/modules/yard-move/dto/create-yard-move.dto.ts`, `update-yard-move.dto.ts` — validation change.
- `apps/api/src/modules/yard-move/yard-move.service.ts` — audit summary formatting.
- `apps/web/src/app/(authenticated)/yard-moves/page.tsx` — form input + table display.
- `apps/api/src/modules/import/parsers/lenh-bai.parser.ts` — date cell parsing.
- `apps/api/src/modules/export/builders/lenh-bai.builder.ts` — date cell writing.
- `apps/api/src/modules/import/import.service.ts` — `importYardMoves` data mapping.
- No other modules read `YardMove.date`, so no other call sites are affected.
