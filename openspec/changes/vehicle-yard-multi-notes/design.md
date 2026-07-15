## Context

Three pages currently store exactly one free-text note per record, as a plain scalar column:

| Page | Model | Scalar field | Service (write path) | Excel builder / parser |
|---|---|---|---|---|
| "quản lý xe" | `VehicleRecord` | `ghiChu` | `vehicle-record.service.ts` | `quanly-xe.builder.ts` / `quanly-xe.parser.ts` |
| "bảo dưỡng xe" | `VehicleRecord` (same table, different fields) | `ghiChuBaoDuong` | `vehicle-maintenance.service.ts` (`updateMaintenanceFields`) | `baoduong-xe.builder.ts` / `baoduong-xe.parser.ts` |
| "tiến độ vận tải" | `YardMove` | `notes` | `yard-move.service.ts` | `lenh-bai.builder.ts` / `lenh-bai.parser.ts` |

A working 1-to-many pattern already exists for "quản lý xe" moocs: `VehicleRecordMooc` (hard FK to `VehicleRecord`, cascade delete), with `vehicle-record.service.ts`'s `update()` deleting all existing mooc rows and recreating from the submitted array on every save (no per-row diffing), and a "+ Thêm mooc" repeatable-row UI in `vehicle-records/page.tsx`. This change applies the identical pattern to notes, three times over.

**A subtlety confirmed while exploring**: `CreateVehicleRecordDto`/`vehicle-record.service.ts` already accept and write `ghiChuBaoDuong` (along with `donViSuaChua`, `ngayLam`, `kmHienTai`) even though the "quản lý xe" web form (`vehicle-records/page.tsx`) never renders or sends these fields — confirmed by grep, zero references. `ghiChuBaoDuong` is only ever meaningfully written through `vehicle-maintenance.service.ts`'s `updateMaintenanceFields`. This dead pass-through in the "quản lý xe" DTO is removed as part of dropping the `ghiChuBaoDuong` column, rather than converted to a note list there — the note list for "bảo dưỡng xe" belongs only to the `vehicle-maintenance` module.

All three scalar fields are also existing Excel export/import columns (single "GHI CHÚ" cell, same column position in each of the three templates), read/written via `cellText()` (`String(v).trim()`) in each parser and a plain string cell write in each builder.

## Goals / Non-Goals

**Goals:**
- Replace all three single-note scalar fields with a repeatable list, each list backed by its own dedicated table with a hard FK + cascade delete to its parent (`VehicleRecordNote`, `VehicleMaintenanceNote` — both FK to `VehicleRecord`, `YardMoveNote` FK to `YardMove`).
- "Quản lý xe" and "bảo dưỡng xe" note lists stay independent even though both FK to `VehicleRecord` — editing one never touches the other.
- Each note row is `{ id, <parent>Id, content: String, createdAt: DateTime @default(now()) }` — free text plus an automatic, non-editable timestamp.
- Web create/edit forms on all three pages get a "+ Thêm ghi chú" repeatable-row UI, visually/behaviorally identical to "+ Thêm mooc".
- Excel round-trip is preserved at the same column position: export joins all note contents into one cell with `\n` separators; import splits that cell's text on newlines back into one note row per non-empty line.
- Existing non-empty scalar values are preserved as the first note row for their record via a one-time migration backfill, then the scalar columns are dropped.

**Non-Goals:**
- Not adding per-note editing metadata beyond `createdAt` (no author, no manual date entry, no per-note update — only whole-list replace, same as `moocs`).
- Not changing `VehicleRecordMooc`, `VehicleMaintenanceKmRound`, or any other existing child-table pattern.
- Not reconciling the broader "bảo dưỡng xe" capability's undocumented/inconsistent OpenSpec history (several un-archived changes proposed different capability names for it) — this change captures only the note-list behavior as a self-contained new capability (`vehicle-maintenance-notes`), not a full retroactive spec for the area.
- Not touching `rename-lenh-bai-to-tien-do-van-tai`'s in-flight label/title changes to `lenh-bai.builder.ts` — this change's edits to that file are additive to the GHI CHÚ column's value logic only, not the worksheet title/branding text that other change owns.
- Not adding a manual reorder/drag-and-drop for notes — list order follows submission order (see Decision 4).

## Decisions

**1. Three dedicated tables with hard FK + cascade delete, not a single polymorphic table.**
Confirmed with the user: despite `AuditLog`'s existing `entityType`/`entityId` polymorphic precedent in this codebase, a fixed set of 3 parents doesn't need that flexibility, and hard FKs give free cascade-delete (a `VehicleRecord` or `YardMove` delete automatically removes its notes, no manual cleanup code) plus real referential integrity — same trade-off already made for `VehicleRecordMooc` over a generic alternative.

```prisma
model VehicleRecordNote {
  id              String        @id @default(cuid())
  vehicleRecordId String        @map("vehicle_record_id")
  vehicleRecord   VehicleRecord @relation("VehicleRecordNotes", fields: [vehicleRecordId], references: [id], onDelete: Cascade)
  content         String
  createdAt       DateTime      @default(now()) @map("created_at")

  @@index([vehicleRecordId])
  @@map("vehicle_record_notes")
}

model VehicleMaintenanceNote {
  id              String        @id @default(cuid())
  vehicleRecordId String        @map("vehicle_record_id")
  vehicleRecord   VehicleRecord @relation("VehicleMaintenanceNotes", fields: [vehicleRecordId], references: [id], onDelete: Cascade)
  content         String
  createdAt       DateTime      @default(now()) @map("created_at")

  @@index([vehicleRecordId])
  @@map("vehicle_maintenance_notes")
}

model YardMoveNote {
  id         String   @id @default(cuid())
  yardMoveId String   @map("yard_move_id")
  yardMove   YardMove @relation(fields: [yardMoveId], references: [id], onDelete: Cascade)
  content    String
  createdAt  DateTime @default(now()) @map("created_at")

  @@index([yardMoveId])
  @@map("yard_move_notes")
}
```
`VehicleRecord` needs two distinct named relations (`VehicleRecordNotes` and `VehicleMaintenanceNotes`) since it has two separate one-to-many note relations to disambiguate in Prisma's schema.

**2. Delete-then-recreate on every update — no per-row diffing, no per-note update endpoint.**
Exactly `vehicle-record.service.ts`'s existing `moocs` handling: `if (dto.notes !== undefined) { await tx.<noteModel>.deleteMany({ where: { <parent>Id: id } }); }`, then recreate from the submitted array inside the same transaction as the parent update. This is deliberately simple — reusing a proven pattern rather than introducing new diff/audit logic (unlike `trip-plan`'s import changed-record diff, which is not needed here since these are direct CRUD forms, not an import path with an existing diff requirement).

**3. `donViSuaChua`/`ngayLam`/`kmHienTai` stay untouched; only `ghiChuBaoDuong` is removed from `CreateVehicleRecordDto`/`vehicle-record.service.ts`.**
These three sibling fields are also dead pass-throughs in the "quản lý xe" DTO (never sent by that page), but they are out of scope — they remain plain scalars, not note lists, and this change doesn't touch them. Only `ghiChuBaoDuong` is affected because it's the field being converted to a note list, and its column is being dropped.

**4. No explicit `order` column — list order is submission order, tie-broken by `createdAt asc, id asc` on read.**
Same as `VehicleRecordMooc` today (no explicit order field, no `orderBy` on the `moocs` include in `findAll`). Since all rows in a given delete-then-recreate batch share the same transaction and Prisma issues sequential `INSERT`s, `createdAt` values are monotonically non-decreasing in submission order in practice; explicit `orderBy: { createdAt: "asc" }` (with `id: "asc"` as a tie-break for same-millisecond inserts) is added to each note relation's `include`/`findMany` calls for defensiveness, matching the ordering rigor already used for `kmRounds` (which does have `orderBy: { roundNumber: "asc" }` since it has a real ordinal) — notes get the same *treatment* even without a dedicated ordinal field.

**5. Excel export: join note contents into the existing single "GHI CHÚ" cell with `\n`.**
No new columns, no shift in any other column's position across all three templates — the change is isolated to how that one cell's value is computed: `rec.ghiChu` (string) becomes `rec.<noteRelation>.map(n => n.content).join("\n")` (or empty string if the list is empty). ExcelJS cells natively support embedded newlines with `wrapText` already enabled in the header style; existing data cells don't currently set `wrapText`, but a multi-line note cell renders correctly in Excel regardless (newline is preserved in the cell value, Excel just needs "wrap text" toggled by the user to see it without scrolling the row — not a functional blocker, purely a display nicety left as-is).

**6. Excel import: split the "GHI CH�ú" cell's text on `\n` (and `\r\n`) into one note per non-empty trimmed line, replacing the entire list for that record.**
```ts
function parseNoteLines(cellValue: string): string[] {
  return cellValue
    .split(/\r\n|\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}
```
A blank cell parses to `[]`, which — following the delete-then-recreate semantics already established for `moocs`/import — clears the record's note list. This mirrors existing import behavior elsewhere in this codebase where an empty/undefined field on a matched row is treated as "no value", not "leave existing value alone" for list-shaped fields (contrast with scalar fields' `!== undefined` conditional-spread, which does preserve on blank — lists don't have that ambiguity since the parser always produces an array, empty or not, for a matched "GHI CHÚ" column). This is a deliberate difference from trip-plan's cost-field import semantics (blank preserves) precisely because notes are list-shaped: "the file's note column, split into lines" is an unambiguous full replacement instruction once a value (even empty) is read from that column, whereas a truly *absent* column (header not found at all) still leaves the list untouched, matching how `quanly-xe.parser.ts`'s `GHI_CHU = SO_MOOC > 0 ? SO_MOOC + 4 : -1` already returns `-1` (and thus `undefined`, not touching the field) when the column can't be located at all.

**7. Migration: additive (3 new tables) → backfill (copy non-empty scalar values as the first note row) → destructive (drop 3 scalar columns), in one migration file, in that order.**
```sql
-- 1. Create the 3 new tables (additive)
CREATE TABLE "vehicle_record_notes" (...);
CREATE TABLE "vehicle_maintenance_notes" (...);
CREATE TABLE "yard_move_notes" (...);

-- 2. Backfill: one row per non-empty existing value
INSERT INTO "vehicle_record_notes" (id, vehicle_record_id, content, created_at)
  SELECT gen_random_uuid()::text, id, ghi_chu, now() FROM "vehicle_records" WHERE ghi_chu IS NOT NULL AND trim(ghi_chu) <> '';
INSERT INTO "vehicle_maintenance_notes" (id, vehicle_record_id, content, created_at)
  SELECT gen_random_uuid()::text, id, ghi_chu_bao_duong, now() FROM "vehicle_records" WHERE ghi_chu_bao_duong IS NOT NULL AND trim(ghi_chu_bao_duong) <> '';
INSERT INTO "yard_move_notes" (id, yard_move_id, content, created_at)
  SELECT gen_random_uuid()::text, id, notes, now() FROM "yard_moves" WHERE notes IS NOT NULL AND trim(notes) <> '';

-- 3. Drop the old scalar columns (destructive, but only after backfill above)
ALTER TABLE "vehicle_records" DROP COLUMN "ghi_chu";
ALTER TABLE "vehicle_records" DROP COLUMN "ghi_chu_bao_duong";
ALTER TABLE "yard_moves" DROP COLUMN "notes";
```
`gen_random_uuid()::text` approximates Prisma's `cuid()` well enough for a one-time backfill insert (the id format doesn't need to match `cuid()`'s exact shape — Prisma only generates that format on `create()` calls, not on schema-level ID constraints); if the target Postgres doesn't have `pgcrypto`'s `gen_random_uuid()` available, `uuid_generate_v4()` or an application-level backfill script is an acceptable substitute at implementation time.

**8. All three affected import flows (`importVehicles`, `importVehicleMaintenance`, `importYardMoves`) need the note-list replacement to be atomic and a manual notes diff entry, for the same underlying reason.**
None of `importVehicles`'s per-record write (separate non-transactional `this.prisma.vehicleRecord.create`/`.update` and `this.upsertMooc` calls), `importVehicleMaintenance`'s update branch (bare `this.prisma.vehicleRecord.update({ where, data })`, with `kmRounds` upsert/delete also running non-transactionally alongside it), or `importYardMoves` (bare `this.prisma.yardMove.update`/`.create`) wrapped its write in a transaction before this change — all three call `diffFields(existing/before, data)` on the same flat object used for the write, which works today because `ghiChu`/`ghiChuBaoDuong`/`notes` is a plain key in both the fetched "before" row and the write payload. Once those become relations instead of scalars, the write payload no longer carries that key, so `diffFields` silently stops diffing them — dropping notes from `changedRecords`/audit output for all three flows.

Fix, applied identically in each: fetch the existing note list alongside the "before"/"existing" row lookup; compute `oldNotesJoined` (existing notes joined with `\n`, oldest first) vs `newNotesJoined` (the row's parsed note lines joined with `\n`); if they differ, manually append `{ field: "ghiChu" | "ghiChuBaoDuong" | "notes" (matching each flow's removed scalar's name, for continuity with prior audit history), oldValue: oldNotesJoined, newValue: newNotesJoined }` to the relevant changes array before logging. The note-list replacement itself (delete existing rows, create the new set) runs as its own atomic unit via Prisma's array-form `$transaction([...])` — this guarantees a note replacement can't partially fail (deleted but not recreated), which is the actual correctness property that matters here.

**Scope note (deviation from an earlier draft of this decision):** an earlier version of this decision called for wrapping each flow's *entire* per-row write — including `importVehicleMaintenance`'s pre-existing `kmRounds` upsert/delete logic and `importVehicles`'s pre-existing mooc upsert/sync logic — in one callback-style `$transaction(async (tx) => {...})`. During implementation this was scoped down: only the note-list delete+recreate is transactional; the scalar `VehicleRecord`/`YardMove` update and the mooc/km-rounds logic remain exactly as non-transactional relative to each other as they already were before this change. Rationale: the reported bug is specifically about notes silently disappearing from the diff/audit output, which the scoped fix fully resolves; widening the transaction boundary to cover mooc/km-rounds logic that was never transactional before would be an unrelated atomicity improvement, out of scope for this change and carrying its own risk of touching working code unnecessarily. `importYardMoves` has no equivalent sibling logic (no moocs/km-rounds), so its `$transaction([...])` already covers the full per-row write (`yardMove.update` + note replacement) as one unit.

## Risks / Trade-offs

- **[Risk]** Dropping `ghi_chu`/`ghi_chu_bao_duong`/`notes` is destructive — any external script, saved API payload, or BI query referencing these columns directly breaks. → **Mitigation**: explicitly called out **BREAKING** in the proposal; the backfill step ensures no data is lost, only its storage shape changes.
- **[Risk]** A user who previously entered a note containing literal `\n`-like text (e.g. copy-pasted from somewhere with unusual line endings) could see their single note split into multiple rows on the *first* re-import after this ships, even though they never intended multiple entries. → **Mitigation**: this only affects the *import* path (re-importing a file), not the initial migration backfill (which always creates exactly one note row per non-empty scalar value, verbatim, no splitting) — so existing data is unaffected; only future imports of hand-edited files with embedded newlines are affected, which is the intended behavior change.
- **[Trade-off]** No per-note timestamp editing or reordering UI — accepted per the user's explicit choice ("chỉ nội dung text" + auto `createdAt`, no manual date input).
- **[Risk]** `VehicleRecord` now has two same-shaped-but-distinct note relations (`VehicleRecordNotes`, `VehicleMaintenanceNotes`); a future maintainer could accidentally wire the wrong relation into the wrong page's service. → **Mitigation**: distinct Prisma relation names (not just distinct model names) make this a compile-time-visible choice, not a silent runtime mix-up; both are documented side-by-side in this design's Decision 1.
- **[Trade-off]** Excel column count and position are unchanged, but a "GHI CHÚ" cell can now be visually taller (Excel auto-wraps or truncates multi-line cells depending on client settings) — accepted per the "gộp nhiều dòng vào 1 ô" decision; no new column was wanted.

## Migration Plan

One Prisma migration containing all three phases (additive tables → data backfill → destructive column drops) in a single file, applied via `prisma migrate deploy` if `prisma migrate dev`'s shadow-DB replay is blocked by the same pre-existing broken historical migration encountered in `add-tripplan-revenue-cost-fields` (`20260624065625_add_km_hien_tai_ghi_chu_bao_duong`) — same workaround: hand-author the migration SQL, apply with `migrate deploy` (no shadow DB), regenerate the Prisma client. Rollback would require re-adding the dropped columns and copying the first note's content back — not automated by Prisma's rollback tooling, so this migration should be validated against a copy of production data (or at minimum the dev DB's current row counts) before deploying, per standard practice for any destructive column drop.
