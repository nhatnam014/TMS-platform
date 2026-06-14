## Context

The `POST /api/v1/import/vehicles` endpoint is handled by `ImportController` → `ImportService.importVehicles()`. The current implementation:

1. Calls `parseQuanLyXe(workbook)` to get typed row objects
2. For each row, upserts into `Vehicle`, `Driver`, and `Trailer` Prisma models
3. Uses unique constraints (`licensePlate`, `vehicleId`, `trailerNumber`) to detect existing records

The `VehicleRecord` + `VehicleRecordMooc` schema is already live and used by the CRUD UI at `/vehicle-records`. It stores data in a flat, denormalized shape using Vietnamese field names (`tenTaiXe`, `bienSo`, `loaiXe`, `hanCaVet`, etc.) that map directly to the Excel template columns.

## Goals / Non-Goals

**Goals:**

- Import rows from the "quản lý xe" Excel sheet into `VehicleRecord` + `VehicleRecordMooc`
- Add `hanCaVet` extraction for both vehicle and mooc columns
- Use simple INSERT semantics — no upsert, no deduplication
- Validate only column presence in the header; skip rows that are structurally invalid (empty + no mooc)

**Non-Goals:**

- Deduplication by `bienSo` or any other field
- Migrating or removing the old `Vehicle`/`Driver`/`Trailer` tables
- Changing the endpoint URL, HTTP method, or multipart field name
- Modifying the trip-plan import (`importTripPlans`) in any way
- Changes to the export endpoints

## Decisions

### Decision 1: INSERT-only, no upsert

**Choice:** Each valid row creates a new `VehicleRecord`. No lookup by `bienSo` or any other field before insert.

**Rationale:** `VehicleRecord.bienSo` has no `@unique` constraint in the schema. The business rule is explicit: skip uniqueness checks. Adding a `findFirst`-based upsert would introduce implicit dedup logic the user does not want, and adding a DB-level unique constraint requires a migration and would break existing duplicate data.

**Alternative considered:** `findFirst` by `bienSo` + conditional update — rejected per business rule.

### Decision 2: Reuse existing parser file, update in place

**Choice:** Update `quanly-xe.parser.ts` rather than creating a new file. Rename/replace the `ParsedVehicleRow` interface with a `ParsedVehicleRecordRow` interface that maps to `VehicleRecord` fields.

**Rationale:** There is only one parser for the "quản lý xe" sheet. Creating a parallel file would require routing logic in the service. The old interface is only consumed by `ImportService.importVehicles()`, which is also being fully rewritten.

**Alternative considered:** New `quanly-xe-v2.parser.ts` alongside the old — rejected as unnecessary indirection.

### Decision 3: Row grouping in the service, not the parser

**Choice:** The parser emits flat rows with types `"record"` and `"mooc_continuation"`. The service is responsible for associating continuation mooc rows with the most recently created `VehicleRecord` (by holding the last `vehicleRecordId`).

**Rationale:** Keeps the parser pure (no Prisma dependency). The grouping logic is a single `currentRecordId` variable in the service loop — trivial to implement and test.

### Decision 4: `hanCaVet` column lookup uses Vietnamese variants

**Choice:** Look up `hanCaVet` for vehicle with candidates: `"hạn cà vẹt"`, `"han ca vet"`, `"cà vẹt xe"`. For mooc: `"hạn cà vẹt mooc"`, `"han ca vet mooc"`, `"cà vẹt mooc"`.

**Rationale:** The existing parser uses the same multi-candidate `col()` helper to tolerate accent and spacing variants in real-world Excel files.

### Decision 5: auditService.log wrapped in try/catch

**Choice:** Wrap the `auditService.log()` call in a try/catch that logs to console but does not surface as HTTP 500.

**Rationale:** The current `importVehicles()` has `auditService.log()` outside any try/catch. If Prisma fails on the audit write, the entire request fails with 500 even though all data was imported successfully. Audit failure should be non-fatal for an import operation.

## Risks / Trade-offs

- **Duplicate records on re-import** → Accepted per business rule. Each import run creates fresh records. If dedup is ever needed, a `@unique` on `bienSo` plus a migration is the path.
- **Continuation mooc row without a preceding record row** → Handled: if `currentRecordId` is null when a `mooc_continuation` row is encountered, the mooc is silently skipped and an error message is added to the result.
- **`hanCaVet` column absent in older Excel files** → The `col()` helper returns `-1` if no matching column is found; `parseExcelDate` receives null and returns null. Import continues without error.
- **Large files (>5 MB)** → Existing Multer `fileSize` limit of 5 MB remains; enforced by `FileInterceptor`.

## Migration Plan

1. Deploy updated `import.service.ts` and `quanly-xe.parser.ts` together in a single release.
2. No database migration required — `VehicleRecord` and `VehicleRecordMooc` tables already exist.
3. The old `Vehicle`/`Driver`/`Trailer` tables are untouched; no rollback risk on the data layer.
4. Rollback: revert the two source files; no state change to undo.
