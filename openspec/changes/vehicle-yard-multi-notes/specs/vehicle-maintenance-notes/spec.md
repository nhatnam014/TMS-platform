## ADDED Requirements

### Requirement: VehicleMaintenanceNote data model

The system SHALL have a `VehicleMaintenanceNote` model with a hard foreign key and cascade delete to `VehicleRecord`, independent of that record's `VehicleRecordNote` list (the "quản lý xe" notes):

- `id` — CUID, primary key
- `vehicleRecordId` — FK to `VehicleRecord`, cascades on delete
- `content` — String (note text)
- `createdAt` — timestamp, set automatically on creation, not user-editable

The scalar `VehicleRecord.ghiChuBaoDuong` field is removed; "bảo dưỡng xe" notes are stored exclusively as `VehicleMaintenanceNote` rows.

#### Scenario: Maintenance note cascade delete

- **WHEN** a `VehicleRecord` is deleted
- **THEN** all associated `VehicleMaintenanceNote` rows are also deleted

#### Scenario: Maintenance notes are independent of quản lý xe notes

- **WHEN** a `VehicleRecord` has both `VehicleRecordNote` rows (from "quản lý xe") and `VehicleMaintenanceNote` rows (from "bảo dưỡng xe")
- **THEN** editing one list through its respective page/endpoint does not modify or delete rows in the other list

---

### Requirement: GET/PATCH vehicle-maintenance endpoints return and accept a notes list

`GET /api/vehicle-maintenance/:vehicleRecordId` SHALL return the maintenance profile including a `notes` array (`VehicleMaintenanceNote[]`, ordered oldest first) in place of the removed `ghiChuBaoDuong` string field. `PATCH /api/vehicle-maintenance/:vehicleRecordId` (`UpdateMaintenanceFieldsDto`) SHALL accept an optional `notes` array (`{ content: string }[]`); when present (even empty), all of that record's existing `VehicleMaintenanceNote` rows are deleted and replaced with the submitted array in the same transaction as the `donViSuaChua`/`ngayLam`/`kmHienTai` field update.

#### Scenario: Get maintenance profile includes notes

- **WHEN** `GET /api/vehicle-maintenance/:vehicleRecordId` is called for a record with 2 `VehicleMaintenanceNote` rows
- **THEN** the response includes `notes: [{ content, createdAt }, { content, createdAt }]`, oldest first

#### Scenario: Patch replaces the notes list

- **WHEN** `PATCH /api/vehicle-maintenance/:vehicleRecordId` is called with `{ notes: [{ content: "Cần kiểm tra phanh" }] }`
- **THEN** all previously existing `VehicleMaintenanceNote` rows for that record are deleted and replaced with one row containing "Cần kiểm tra phanh"

#### Scenario: Patch without notes leaves the list unchanged

- **WHEN** `PATCH /api/vehicle-maintenance/:vehicleRecordId` is called with a body that omits `notes` entirely
- **THEN** the record's existing `VehicleMaintenanceNote` rows are left untouched

#### Scenario: Patch on non-existent vehicle record returns 404

- **WHEN** `PATCH /api/vehicle-maintenance/:vehicleRecordId` is called with an id that doesn't match any `VehicleRecord`
- **THEN** the system responds with HTTP 404

---

### Requirement: Web UI — bảo dưỡng xe create/edit form has a repeatable notes list

The "bảo dưỡng xe" edit form (`vehicle-maintenance/page.tsx`) SHALL replace its single "Ghi chú" textarea with a repeatable list UI — "+ Thêm ghi chú" button, one text input + remove button per row — visually and behaviorally identical to the "+ Thêm mooc"/"+ Thêm ghi chú" list UI on the "quản lý xe" page. There is no date/timestamp input on any note row.

#### Scenario: Add note row

- **WHEN** user clicks "+ Thêm ghi chú" on the bảo dưỡng xe edit form
- **THEN** a new blank note row appears with a single text input and a remove button

#### Scenario: Remove note row

- **WHEN** user clicks the [×] button on a note row
- **THEN** that note row is removed from the form

#### Scenario: Save with multiple notes

- **WHEN** user adds 2 note rows with distinct text content and submits the edit form
- **THEN** the PATCH body includes `notes: [{ content: "..." }, { content: "..." }]` in the order the rows appear in the form

#### Scenario: Edit form pre-fills existing notes

- **WHEN** the user opens the edit form for a record with 2 existing `VehicleMaintenanceNote` entries
- **THEN** the form shows 2 pre-filled note rows, oldest first

---

### Requirement: Web UI — bảo dưỡng xe list page displays multiple notes

The "bảo dưỡng xe" list table's "Ghi chú" column SHALL display all of a record's `VehicleMaintenanceNote` entries, ordered oldest first (e.g. one line per note within the cell/column), in place of the single `ghiChuBaoDuong` string.

#### Scenario: Render Ghi chú column with multiple notes

- **WHEN** a record has 2 `VehicleMaintenanceNote` entries
- **THEN** the Ghi chú column displays both note contents, oldest first

#### Scenario: Render Ghi chú column with no notes

- **WHEN** a record has zero `VehicleMaintenanceNote` entries
- **THEN** the Ghi chú column shows the existing empty-state placeholder (e.g. "—")

---

### Requirement: Exported "GHI CHÚ" column joins multiple maintenance notes into one cell

The "bảo dưỡng xe" export's "GHI CHÚ" column (last data column before the trailing "ID" column, per `baoduong-xe.builder.ts`'s `buildHeaders`) SHALL contain all of a `VehicleRecord`'s `VehicleMaintenanceNote` entries, oldest first, joined with a newline (`\n`) separator, in a single cell. No new columns are added and no existing column's position changes. A record with zero maintenance notes SHALL produce an empty "GHI CHÚ" cell.

#### Scenario: Single note exports as before

- **WHEN** a `VehicleRecord` has exactly one `VehicleMaintenanceNote` with content "Cần kiểm tra phanh"
- **THEN** the "GHI CHÚ" cell for that row contains exactly "Cần kiểm tra phanh"

#### Scenario: Multiple notes join with newlines

- **WHEN** a `VehicleRecord` has `VehicleMaintenanceNote` entries "Cần kiểm tra phanh" and "Đã thay dầu", created in that order
- **THEN** the "GHI CHÚ" cell contains "Cần kiểm tra phanh\nĐã thay dầu"

#### Scenario: Zero notes exports an empty cell

- **WHEN** a `VehicleRecord` has no `VehicleMaintenanceNote` entries
- **THEN** the "GHI CHÚ" cell for that row is empty

---

### Requirement: Excel import splits the "GHI CHÚ" cell into multiple maintenance notes

`baoduong-xe.parser.ts` SHALL extract `ghiChuLines` — the "GHI CHÚ" cell's raw text (resolved via `COL_GHI_CHU`, matched by header text `"ghi chú"`/`"ghi chu"`) split on newlines into a list of non-empty trimmed lines — in place of the removed scalar `ghiChuBaoDuong` field. `import.service.ts`'s `importVehicleMaintenance` SHALL, for both the create and update (matched-by-`id`) branches, create one `VehicleMaintenanceNote` per line; for the update branch, all of the record's existing `VehicleMaintenanceNote` rows are deleted and replaced with the submitted lines as a single atomic operation (Prisma array-form `$transaction`), independent of the `VehicleRecord` scalar-field update and the `kmRounds` upsert/delete logic in that branch — those two remain non-transactional relative to each other and to the note replacement, unchanged from this flow's pre-existing behavior before this change. The changed-record diff SHALL compare the record's maintenance notes as a single joined value (all `VehicleMaintenanceNote` contents joined with `\n`, oldest first) against the imported cell's raw text, reported under the field name `"ghiChuBaoDuong"` for continuity with the removed scalar's name in prior audit history.

#### Scenario: Multi-line Ghi chú cell splits into multiple notes

- **WHEN** a data row's "GHI CHÚ" cell contains "Cần kiểm tra phanh\nĐã thay dầu"
- **THEN** `ghiChuLines` is `["Cần kiểm tra phanh", "Đã thay dầu"]`

#### Scenario: Blank Ghi chú cell produces zero notes

- **WHEN** a data row's "GHI CHÚ" cell is empty or whitespace-only
- **THEN** `ghiChuLines` is `[]`

#### Scenario: New record import creates maintenance notes

- **WHEN** an admin imports a row with no matching `id` and `ghiChuLines: ["Cần kiểm tra phanh"]`
- **THEN** the created `VehicleRecord` has one `VehicleMaintenanceNote` row with content "Cần kiểm tra phanh"

#### Scenario: Re-importing an existing record replaces its maintenance note list

- **WHEN** an admin re-imports a file where an existing row's "GHI CHÚ" cell now contains different text than the record's current joined maintenance notes
- **THEN** all of that record's existing `VehicleMaintenanceNote` rows are deleted and replaced with one row per non-empty line in the imported cell, and a `"ghiChuBaoDuong"` entry appears in that row's `changedRecords` changes with the old and new joined values

#### Scenario: Re-importing unchanged maintenance notes produces no diff entry

- **WHEN** an admin re-imports a row whose "GHI CHÚ" cell content, split and rejoined, matches the record's existing maintenance notes exactly
- **THEN** no `"ghiChuBaoDuong"` entry appears in that record's `changedRecords` changes

#### Scenario: Note-list replacement is atomic

- **WHEN** an import replaces a matched `VehicleRecord`'s maintenance notes (delete existing rows, create the new set)
- **THEN** the delete and create either both succeed or both fail as a single transaction — a partial replacement (notes deleted but not recreated) cannot occur
