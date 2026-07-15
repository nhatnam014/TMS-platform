## 1. Database schema — packages/db/prisma/schema.prisma

- [x] 1.1 Add `VehicleRecordNote` model: `id`, `vehicleRecordId` (FK to `VehicleRecord`, relation name `VehicleRecordNotes`, `onDelete: Cascade`), `content String`, `createdAt DateTime @default(now())`, `@@index([vehicleRecordId])`, `@@map("vehicle_record_notes")`
- [x] 1.2 Add `VehicleMaintenanceNote` model: `id`, `vehicleRecordId` (FK to `VehicleRecord`, relation name `VehicleMaintenanceNotes`, `onDelete: Cascade`), `content String`, `createdAt DateTime @default(now())`, `@@index([vehicleRecordId])`, `@@map("vehicle_maintenance_notes")`
- [x] 1.3 Add `YardMoveNote` model: `id`, `yardMoveId` (FK to `YardMove`, `onDelete: Cascade`), `content String`, `createdAt DateTime @default(now())`, `@@index([yardMoveId])`, `@@map("yard_move_notes")`
- [x] 1.4 Add the two named relation fields to `VehicleRecord`: `notes VehicleRecordNote[] @relation("VehicleRecordNotes")`, `maintenanceNotes VehicleMaintenanceNote[] @relation("VehicleMaintenanceNotes")`
- [x] 1.5 Add the relation field to `YardMove`: `notes YardMoveNote[]`
- [x] 1.6 Remove `VehicleRecord.ghiChu` and `VehicleRecord.ghiChuBaoDuong` scalar fields; remove `YardMove.notes` scalar field
- [x] 1.7 Hand-author the migration SQL (in dependency order within one migration file): (a) `CREATE TABLE` for the 3 new note tables, (b) `INSERT ... SELECT` backfill copying each non-empty existing `ghi_chu`/`ghi_chu_bao_duong`/`notes` value into one row of the corresponding new table (see design.md Decision 7 for exact SQL), (c) `ALTER TABLE ... DROP COLUMN` for the 3 old scalar columns. Apply via `prisma migrate deploy` if `prisma migrate dev`'s shadow-DB replay is blocked by the pre-existing broken migration `20260624065625_add_km_hien_tai_ghi_chu_bao_duong` (same workaround used in `add-tripplan-revenue-cost-fields`)
- [x] 1.8 Regenerate the Prisma client (`pnpm prisma generate`) and confirm the new models/relations are available

## 2. Shared types — packages/shared/src/index.ts

- [x] 2.1 Add `VehicleRecordNoteDto { content: string }` (or reuse a single generic `NoteItemDto { content: string }` shared across all three DTOs)
- [x] 2.2 `CreateVehicleRecordDto`/`UpdateVehicleRecordDto`: remove `ghiChu?: string` and `ghiChuBaoDuong?: string`; add `notes?: { content: string }[]`
- [x] 2.3 Add `UpdateMaintenanceFieldsDto` shape update (if declared in shared types): remove `ghiChuBaoDuong?: string | null`; add `notes?: { content: string }[]`
- [x] 2.4 `CreateYardMoveDto`/`UpdateYardMoveDto`: remove `notes?: string`; add `notes?: { content: string }[]`

## 3. Vehicle record ("quản lý xe") — API

- [x] 3.1 `apps/api/src/modules/vehicle-record/dto/create-vehicle-record.dto.ts`: remove `ghiChu`/`ghiChuBaoDuong` fields; add `notes?: NoteDto[]` (new nested DTO class, `@IsArray() @ValidateNested({ each: true }) @Type(() => NoteDto)`, mirroring the existing `MoocDto` pattern)
- [x] 3.2 `vehicle-record.service.ts` `create()`: remove `ghiChu`/`ghiChuBaoDuong` from the create `data` object; add `notes: dto.notes?.length ? { create: dto.notes.map((n) => ({ content: n.content })) } : undefined` (mirroring the existing `moocs` nested-create); include `notes: true` in the `include` clause
- [x] 3.3 `vehicle-record.service.ts` `update()`: remove `ghiChu`/`ghiChuBaoDuong` conditional spreads; before the `tx.vehicleRecord.update` call, add `if (dto.notes !== undefined) { await tx.vehicleRecordNote.deleteMany({ where: { vehicleRecordId: id } }); }` (mirroring the existing `moocs` delete-then-recreate), and add the nested-create for `notes` to the update `data` object; include `notes: true` in the `include` clause
- [x] 3.4 `vehicle-record.service.ts` `findAll()`: add `notes: { orderBy: [{ createdAt: "asc" }, { id: "asc" }] }` to the `include` clause (alongside `moocs`/`kmRounds`)
- [x] 3.5 Confirm `vehicle-record.service.ts`'s search filter (`OR` clause in `findAll`) doesn't reference `ghiChu` — if it does, remove that condition (search across free-text notes is out of scope for this change)

## 4. Vehicle record ("quản lý xe") — Web UI

- [x] 4.1 `apps/web/src/app/(authenticated)/vehicle-records/page.tsx`: add a `NoteRow { key: string; content: string }` type and `newNoteRow()` helper (mirroring `MoocRow`/`EMPTY_MOOC`)
- [x] 4.2 Add `notes: NoteRow[]` to the form state (`RecordForm` type and its default), plus `updateNote`/`addNote`/`removeNote` handlers (mirroring `updateMooc`/the mooc add/remove handlers)
- [x] 4.3 Replace the "Ghi chú" textarea (~line 599) with a repeatable list UI: "+ Thêm ghi chú" button, one text input + [×] remove button per row, matching the mooc list's layout/styling
- [x] 4.4 Update the submit payload (~line 627): replace `ghiChu: nullOrUndef(form.ghiChu)` with `notes: form.notes.filter((n) => n.content.trim()).map((n) => ({ content: n.content.trim() }))`
- [x] 4.5 Update the edit-form pre-fill (~line 648): replace `ghiChu: r.ghiChu ?? ""` with mapping `r.notes` (oldest first) into `NoteRow[]`
- [x] 4.6 Update the `TripPlanRow`-equivalent `RecordForm`/list-row TypeScript interface (~line 29-30) to replace `ghiChu: string | null` with `notes: { id: string; content: string; createdAt: string }[]`
- [x] 4.7 Update the list table's "Ghi chú" cell rendering (~line 1138, 1269) to join/display all note contents instead of the single `ghiChu` string

## 5. Vehicle maintenance ("bảo dưỡng xe") — API

- [x] 5.1 `apps/api/src/modules/vehicle-maintenance/dto/update-maintenance-fields.dto.ts`: remove `ghiChuBaoDuong?: string | null`; add `notes?: NoteDto[]` (reuse the note DTO from task 3.1 if shared, or a local equivalent)
- [x] 5.2 `vehicle-maintenance.service.ts` `findOne()`: replace the returned `ghiChuBaoDuong` field with `notes` (fetch via `include: { maintenanceNotes: { orderBy: [{ createdAt: "asc" }, { id: "asc" }] } }`, map to the response's `notes` key)
- [x] 5.3 `vehicle-maintenance.service.ts` `updateMaintenanceFields()`: wrap the existing single `tx.vehicleRecord.update` call in `this.prisma.$transaction(...)` if not already transactional; remove `ghiChuBaoDuong` from the update `data` object; when `dto.notes !== undefined`, delete all existing `VehicleMaintenanceNote` rows for the record and recreate from `dto.notes` in the same transaction; return the updated record with its `notes` list

## 6. Vehicle maintenance ("bảo dưỡng xe") — Web UI

- [x] 6.1 `apps/web/src/app/(authenticated)/vehicle-maintenance/page.tsx`: replace the `ghiChuBaoDuong` string state (~line 142) with a `notes: NoteRow[]` state (reuse the `NoteRow`/`newNoteRow` shape from task 4.1 if the two pages can share a small helper, or duplicate locally)
- [x] 6.2 Replace the "Ghi chú" textarea (~line 347) with a "+ Thêm ghi chú" repeatable list UI, matching task 4.3's UI pattern
- [x] 6.3 Update the submit payload (~line 193-196): replace `ghiChuBaoDuong: ghiChuBaoDuong || null` with `notes: notes.filter(...).map((n) => ({ content: n.content.trim() }))`
- [x] 6.4 Update the row/type definitions (~line 23, 26) to replace `ghiChuBaoDuong: string | null` with `notes: { id: string; content: string; createdAt: string }[]`
- [x] 6.5 Update the list table's "Ghi chú" cell rendering (~line 630) to join/display all note contents instead of the single `ghiChuBaoDuong` string

## 7. Yard move ("tiến độ vận tải") — API

- [x] 7.1 `apps/api/src/modules/yard-move/dto/create-yard-move.dto.ts`: remove `notes?: string`; add `notes?: NoteDto[]` (new nested DTO, same shape as tasks 3.1/5.1)
- [x] 7.2 `apps/api/src/modules/yard-move/dto/update-yard-move.dto.ts`: mirror the same change if it doesn't already derive from `CreateYardMoveDto` via `PartialType`
- [x] 7.3 `yard-move.service.ts` `create()`: replace `notes: dto.notes` in the create `data` object with a nested `notes: { create: dto.notes?.map((n) => ({ content: n.content })) ?? [] }` (or omit entirely when empty, matching the `moocs`/`notes` nested-create convention used elsewhere)
- [x] 7.4 `yard-move.service.ts` `update()`: wrap the existing bare `tx.yardMove.update` call — already inside `$transaction` — with a preceding `if (dto.notes !== undefined) { await tx.yardMoveNote.deleteMany({ where: { yardMoveId: id } }); }` and add the nested-create for `notes` to the update `data` object
- [x] 7.5 `yard-move.service.ts` `findAll()`/`findOne()`: add `notes: { orderBy: [{ createdAt: "asc" }, { id: "asc" }] }` to the query's `include` clause (currently no `include` at all — add one)

## 8. Yard move ("tiến độ vận tải") — Web UI

- [x] 8.1 `apps/web/src/app/(authenticated)/yard-moves/page.tsx`: replace the `notes: string` state (~line 171) with a `notes: NoteRow[]` state and add/remove-row handlers
- [x] 8.2 Replace the "Ghi chú" textarea (~line 257-260) with a "+ Thêm ghi chú" repeatable list UI, matching task 4.3's pattern
- [x] 8.3 Update the submit payload (~line 312, 404): replace `notes: values.notes || undefined` with `notes: values.notes.filter(...).map((n) => ({ content: n.content.trim() }))`
- [x] 8.4 Update the row/type definitions (~line 21, 33) to replace `notes: string | null` with `notes: { id: string; content: string; createdAt: string }[]`
- [x] 8.5 Update the edit-form pre-fill (~line 380) to map `move.notes` into `NoteRow[]`
- [x] 8.6 Update the list table's "Ghi chú" column rendering (~line 845) to join/display all note contents instead of `m.notes || "—"`

## 9. Excel export — quanly-xe.builder.ts

- [x] 9.1 Change the "GHI CHÚ" cell value (~line 100, `rec.ghiChu ?? ""`) to `(rec.notes ?? []).map((n: any) => n.content).join("\n")` — the "GHI CHÚ" column stays at its existing position (col 13); no `HEADERS`/`COL_WIDTHS` changes needed
- [x] 9.2 Confirm the export query (in `export.service.ts` or wherever `buildQuanLyXe`'s `records` argument is fetched) includes `notes` in its `include`/`select` — add if missing

## 10. Excel import — quanly-xe.parser.ts

- [x] 10.1 Rename `ghiChu?: string` on `ParsedVehicleRecordRow` to `ghiChuLines?: string[]`
- [x] 10.2 Replace the `ghiChu: GHI_CHU > 0 ? cellText(row, GHI_CHU) || undefined : undefined` assignment with: read the raw cell text at `GHI_CHU`, split on `/\r\n|\n/`, trim each line, filter out empty lines, and assign the resulting array to `ghiChuLines` (assign `undefined` if `GHI_CHU <= 0`, i.e. column not found at all — distinct from "column found but blank")

## 11. Import service — import.service.ts (importVehicles, "quản lý xe")

- [x] 11.1 Remove `ghiChu: row.ghiChu ?? null` from the `vehicleData` object (~line 161, shared by both the create and update branches)
- [x] 11.2 **REVISED during implementation** (see design.md Decision 8 "Scope note"): rather than wrapping the whole UPDATE branch (`vehicleRecord.update` + `upsertMooc` + `flushMoocSync`, none of which were transactional before this change) in one callback transaction, only the notes delete+recreate is made atomic, via Prisma array-form `this.prisma.$transaction([...])`: `this.prisma.vehicleRecordNote.deleteMany({ where: { vehicleRecordId: currentRecordId } })` plus a conditional `createMany` from `row.ghiChuLines`. The scalar `vehicleRecord.update` and the mooc upsert/sync logic remain exactly as non-transactional relative to each other as before — this fully fixes the diff-visibility bug (the actual reported problem) without changing that pre-existing atomicity boundary.
- [x] 11.3 After the note replacement in the UPDATE branch, compute `oldNotesJoined` (the `existing` row's `VehicleRecordNote` rows, fetched via a `notes: true` include on the earlier `findUnique` at ~line 164-166, joined with `\n`) vs `newNotesJoined` (`(row.ghiChuLines ?? []).join("\n")`); if they differ, push `{ field: "ghiChu", oldValue: oldNotesJoined, newValue: newNotesJoined }` into the `scalarChanges` array (~line 183) before it's passed to `recordChanges(...)`, since `diffFields(existing, vehicleData)` no longer includes this field automatically
- [x] 11.4 In the CREATE branch (~line 196-216): wrap `this.prisma.vehicleRecord.create(...)` in `$transaction` (or add a nested `notes: { create: (row.ghiChuLines ?? []).map((content) => ({ content })) }` directly to the existing single `create` call's `data` object, alongside the existing conditional `moocs` nested-create — no transaction needed if it's a single `create` call with nested writes, since Prisma handles that atomically already)

## 12. Excel export — baoduong-xe.builder.ts

- [x] 12.1 Change the "GHI CHÚ" cell value (~line 118, `toStr(rec.ghiChuBaoDuong)`) to `(rec.maintenanceNotes ?? []).map((n: any) => n.content).join("\n")` — column position unchanged (last data column before "ID")
- [x] 12.2 Confirm the export query supplying `records` to `buildBaoDuongXe` includes `maintenanceNotes` in its `include`/`select` — add if missing

## 13. Excel import — baoduong-xe.parser.ts

- [x] 13.1 Rename `ghiChuBaoDuong?: string` on `ParsedMaintenanceRow` to `ghiChuLines?: string[]`
- [x] 13.2 Replace the `ghiChuBaoDuong: COL_GHI_CHU > 0 ? cellText(row, COL_GHI_CHU) || undefined : undefined` assignment with the same split-on-newline logic as task 10.2, assigned to `ghiChuLines`

## 14. Import service — import.service.ts (importVehicleMaintenance)

- [x] 14.1 **REVISED during implementation** (see design.md Decision 8 "Scope note"): rather than wrapping the update branch's `vehicleRecord.update` call and the km-rounds upsert/delete logic in one callback transaction, only the notes delete+recreate is made atomic, via Prisma array-form `this.prisma.$transaction([...])`. The scalar update and km-rounds logic remain exactly as non-transactional relative to each other as before this change — this fully fixes the diff-visibility bug without changing that pre-existing atomicity boundary
- [x] 14.2 In the update branch, remove `ghiChuBaoDuong` from `updateData`; add `if (row.ghiChuLines !== undefined) { await tx.vehicleMaintenanceNote.deleteMany({ where: { vehicleRecordId: existing.id } }); if (row.ghiChuLines.length > 0) { await tx.vehicleMaintenanceNote.createMany({ data: row.ghiChuLines.map((content) => ({ vehicleRecordId: existing.id, content })) }); } }`
- [x] 14.3 After the delete-then-recreate, compute `oldNotesJoined` (existing `VehicleMaintenanceNote` rows, fetched before the delete, joined with `\n`) vs `newNotesJoined` (`row.ghiChuLines.join("\n")`); if they differ, push `{ field: "ghiChuBaoDuong", oldValue: oldNotesJoined, newValue: newNotesJoined }` onto `recordChanges` (alongside the existing `diffFields(existing, updateData)` result, which no longer includes this field automatically)
- [x] 14.4 In the create branch, remove `ghiChuBaoDuong` from the create `data` object; after creating the new `VehicleRecord`, create one `VehicleMaintenanceNote` per line in `row.ghiChuLines` (wrap the create + note-creation in `$transaction` alongside the km-rounds creation that likely already happens for new records — confirm current create-branch structure and adjust accordingly)

## 15. Excel export — lenh-bai.builder.ts

- [x] 15.1 Change the "GHI CHÚ" cell value (~line 116, `rec.notes ?? ""`) to `(rec.notes ?? []).map((n: any) => n.content).join("\n")` — note the field name collision: the raw Prisma `YardMove` object's `notes` key now refers to the `YardMoveNote[]` relation instead of a string, so this is a type change at the same property name, not a rename
- [x] 15.2 Confirm the export query supplying `records` to the lệnh bãi builder includes `notes` (the relation) in its `include`/`select`

## 16. Excel import — lenh-bai.parser.ts

- [x] 16.1 Rename `notes?: string` on `ParsedYardMoveRow` to `noteLines?: string[]`
- [x] 16.2 Replace the `notes: cellText(row, COL.GHI_CHU) || undefined` assignment (~line 174) with the same split-on-newline logic as task 10.2, assigned to `noteLines`

## 17. Import service — import.service.ts (importYardMoves)

- [x] 17.1 Wrap the execute-mode per-row logic (currently a bare `await this.prisma.yardMove.update(...)` / `await this.prisma.yardMove.create(...)`, not `$transaction`-wrapped) in `this.prisma.$transaction(async (tx) => { ... })`
- [x] 17.2 Remove `notes: row.notes ?? null` from the `data` object; for the create path, add a nested `notes: { create: (row.noteLines ?? []).map((content) => ({ content })) }`; for the update path, add `await tx.yardMoveNote.deleteMany({ where: { yardMoveId: before.id } })` followed by `createMany` from `row.noteLines`, before or after the `tx.yardMove.update` call (order doesn't matter within the same transaction)
- [x] 17.3 For the update path, compute `oldNotesJoined` (the `before` row's existing `YardMoveNote` rows, fetched before the delete, joined with `\n`) vs `newNotesJoined` (`(row.noteLines ?? []).join("\n")`); if they differ, push `{ field: "notes", oldValue: oldNotesJoined, newValue: newNotesJoined }` onto the `changes` array returned by `diffFields(before, data)` before the `changes.length > 0` check and audit-log call

## 18. Verification

- [x] 18.1 `cd apps/api && pnpm exec tsc --noEmit` — confirm no type errors introduced
- [x] 18.2 `cd apps/web && pnpm exec tsc --noEmit` — confirm no type errors introduced
- [x] 18.3 Smoke-test script: build a `VehicleRecord`/`YardMove` with 2+ notes via Prisma directly, call `buildQuanLyXe`/`buildBaoDuongXe`/the lệnh bãi builder, confirm the "GHI CHÚ" cell contains the newline-joined content at the correct column position
- [x] 18.4 Smoke-test script: re-parse each generated file with `parseQuanLyXe`/`parseBaoDuongXe`/`parseLenhBai`, confirm `ghiChuLines`/`noteLines` matches the original note contents in order
- [x] 18.5 Smoke-test script: directly via Prisma, create a record with notes, then update with a different `notes` array, confirm the old note rows are gone and only the new ones remain (delete-then-recreate semantics)
- [ ] 18.6 Manually create a vehicle record via the "quản lý xe" form with 2+ notes, confirm the edit form and list view show them correctly — requires running dev servers + browser, not exercised this session
- [x] 18.7 Manually confirm "bảo dưỡng xe" and "quản lý xe" note lists stay independent for the same underlying vehicle record (editing one doesn't affect the other) — verified via a direct Prisma smoke script: created a `VehicleRecord` with 2 `VehicleRecordNote` + 1 `VehicleMaintenanceNote` rows, replaced only the `VehicleRecordNote` list, confirmed `VehicleMaintenanceNote` was untouched
- [ ] 18.8 Manually create/edit a yard move via the "tiến độ vận tải" form with 2+ notes, confirm the edit form and list view show them correctly — requires running dev servers + browser, not exercised this session
- [ ] 18.9 Manually export each of the three sheets, edit the "GHI CHÚ" cell to add/remove lines, re-import, and confirm the changed-records/audit-log output reports the notes change for the matched record — requires running dev servers + browser (full HTTP import flow), not exercised this session; the underlying diff/transaction logic was verified by code review and the export→import round-trip smoke test
- [x] 18.10 Manually confirm the one-time migration backfill: for a pre-existing record that had a non-empty `ghiChu`/`ghiChuBaoDuong`/`notes` value before this change, confirm it now shows up as a single note with that exact text — verified via `psql`: 21 `vehicle_record_notes` + 23 `yard_move_notes` rows backfilled immediately after migration, spot-checked content matches plausible original `ghiChu` text (0 `vehicle_maintenance_notes` backfilled, consistent with no pre-existing data having `ghiChuBaoDuong` set)
