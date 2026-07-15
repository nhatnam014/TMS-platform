## Why

Users of "quản lý xe" (VehicleRecord), "bảo dưỡng xe" (VehicleRecord's maintenance fields), and "tiến độ vận tải" (YardMove) can currently only store a single free-text note per record (`ghiChu`, `ghiChuBaoDuong`, `notes` respectively). The customer needs to record multiple, separate note entries per record — the same multi-row pattern "quản lý xe" already uses for mooc numbers (`VehicleRecordMooc`).

## What Changes

- Add three new child tables, each with a hard foreign key and cascade delete to its parent, mirroring the existing `VehicleRecordMooc` pattern: `VehicleRecordNote` (→ `VehicleRecord`, powers "quản lý xe"), `VehicleMaintenanceNote` (→ `VehicleRecord`, powers "bảo dưỡng xe" — a separate list from `VehicleRecordNote` even though both point at the same parent table), `YardMoveNote` (→ `YardMove`, powers "tiến độ vận tải"). Each row is `{ id, <parent>Id, content: String, createdAt: DateTime @default(now()) }` — free text plus an automatic timestamp, no user-entered date.
- **BREAKING**: Remove the scalar `VehicleRecord.ghiChu`, `VehicleRecord.ghiChuBaoDuong`, and `YardMove.notes` columns after a one-time data migration that copies each non-empty existing value into a single note row (`content` = the old value) in the corresponding new table. Any external script or saved API payload referencing these three scalar fields directly will break.
- Update `CreateVehicleRecordDto`/`UpdateVehicleRecordDto` to replace `ghiChu?: string` with `notes?: { content: string }[]` (mirroring the existing `moocs?: MoocItem[]` shape). The dead `ghiChuBaoDuong?: string` field already present on this DTO (accepted but never sent by the "quản lý xe" web form today — confirmed no reference in `vehicle-records/page.tsx`) is removed outright rather than converted, since the "bảo dưỡng xe" note list belongs solely to the `vehicle-maintenance` module's DTO below.
- Update `UpdateMaintenanceFieldsDto` (vehicle-maintenance module) to replace `ghiChuBaoDuong?: string` with `notes?: { content: string }[]`.
- Update `CreateYardMoveDto`/`UpdateYardMoveDto` to replace `notes?: string` with `notes?: { content: string }[]`.
- `vehicle-record.service.ts`, `vehicle-maintenance.service.ts`, and `yard-move.service.ts`: on update, replace the note list wholesale (delete all existing rows for the parent, then create the submitted rows) — the same delete-then-recreate transaction pattern already used for `moocs`. No per-row diffing.
- Web forms (`vehicle-records/page.tsx`, `vehicle-maintenance/page.tsx` create/edit forms, `yard-moves/page.tsx` create/edit forms): replace the single "Ghi chú" textarea with a repeatable list UI — "+ Thêm ghi chú" button, one text input + remove button per row — visually and behaviorally identical to the existing "+ Thêm mooc" UI in `vehicle-records/page.tsx`.
- List views on all three pages: render the note column as the joined note contents (e.g. newline- or comma-separated preview) instead of a single string field.
- Excel export (`quanly-xe.builder.ts`, `baoduong-xe.builder.ts`, `lenh-bai.builder.ts`): the existing "GHI CHÚ" column keeps its position and stays a single cell — multiple note rows are joined with a newline (`\n`) inside that one cell. No new columns added.
- Excel import (`quanly-xe.parser.ts`, `baoduong-xe.parser.ts`, `lenh-bai.parser.ts`): the "GHI CHÚ" cell's text is split on newlines into one note row per non-empty line, replacing the record's entire note list for that column (same delete-then-recreate semantics as the API update path). A blank cell clears the note list for that column (consistent with re-importing an unedited export producing no accidental data loss only when the cell still contains the same joined text).

## Capabilities

### New Capabilities
- `vehicle-maintenance-notes`: multi-row notes for "bảo dưỡng xe" (`VehicleMaintenanceNote`) — CRUD form behavior and the "GHI CHÚ" Excel column's join/split behavior in `baoduong-xe.builder.ts`/`baoduong-xe.parser.ts`. No prior archived spec exists for the "bảo dưỡng xe" area, so this is captured fresh rather than as a delta against a non-existent base.

### Modified Capabilities
- `vehicle-record-crud`: `ghiChu` (single string) replaced by a `notes` one-to-many list (`VehicleRecordNote`), with matching create/edit form UI and API shape changes.
- `vehicle-excel-export`: the "quản lý xe" export's "GHI CHÚ" column now joins multiple `VehicleRecordNote` rows with newlines instead of reading a single `ghiChu` string.
- `vehicle-excel-import`: the "quản lý xe" import's "GHI CHÚ" column now splits on newlines into multiple `VehicleRecordNote` rows instead of setting a single `ghiChu` string.
- `yard-move`: `notes` (single string) replaced by a `notes` one-to-many list (`YardMoveNote`), with matching create/edit form UI and API shape changes.
- `yard-move-excel-export`: the "GHI CHÚ" column now joins multiple `YardMoveNote` rows with newlines instead of reading a single `notes` string.
- `yard-move-excel-import`: the "GHI CHÚ" column now splits on newlines into multiple `YardMoveNote` rows instead of setting a single `notes` string.

## Impact

- `packages/db/prisma/schema.prisma` (3 new models: `VehicleRecordNote`, `VehicleMaintenanceNote`, `YardMoveNote`; removal of `VehicleRecord.ghiChu`, `VehicleRecord.ghiChuBaoDuong`, `YardMove.notes`)
- **Database migration required**: additive (3 new tables) + data backfill (copy existing scalar values into the first note row per parent) + destructive (drop 3 scalar columns) — must run in that order within the migration.
- `apps/api/src/modules/vehicle-record/` (DTOs, service, controller if note endpoints are exposed separately)
- `apps/api/src/modules/vehicle-maintenance/` (DTOs, service)
- `apps/api/src/modules/yard-move/` (DTOs, service)
- `apps/api/src/modules/export/builders/quanly-xe.builder.ts`, `baoduong-xe.builder.ts`, `lenh-bai.builder.ts`
- `apps/api/src/modules/import/parsers/quanly-xe.parser.ts`, `baoduong-xe.parser.ts`, `lenh-bai.parser.ts`
- `packages/shared/src/index.ts` (DTO/type shape changes for all three entities)
- `apps/web/src/app/(authenticated)/vehicle-records/page.tsx`, `vehicle-maintenance/page.tsx`, `yard-moves/page.tsx`
- Coordinates with the in-progress `rename-lenh-bai-to-tien-do-van-tai` change, which is mid-flight on the same `lenh-bai.builder.ts`/`lenh-bai.parser.ts` files (renaming labels only, not touched here structurally) — this change should land its Excel column logic changes without reverting that rename's in-flight text changes.
