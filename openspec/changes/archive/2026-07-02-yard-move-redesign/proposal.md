## Why

The current `YardMove` entity models an internal factory zone-shuttle workflow (`fromZone`/`toZone`/`status`/`costs`) that no longer matches how the business actually tracks "lệnh bãi" (yard orders). The real-world tracking sheet (an Excel log) records a flat list of trips: date, GPS code, driver full name, truck plate, mooc (trailer) plate, booking number, container number, a free-text note, and a "đã kéo" (hauled) marker. The entity, CRUD flow, and UI need to be rebuilt to match this sheet, and the existing Excel import/export pattern (already used for trip plans and vehicles) needs to be extended to this entity.

## What Changes

- **BREAKING**: Remove `fromZone`, `toZone`, `locationId`, `status` (`YardMoveStatus`), and the `YardMoveCost` relation (`YardCostType`) from `YardMove`. Remove the `PATCH /yard-moves/:id/status` and `POST /yard-moves/:id/costs` endpoints.
- Add free-text fields to `YardMove`: `gps`, `fullName`, `truck`, `mooc`, `booking`, `daKeo` (all optional strings), and relax `containerNumber` to a plain optional string (no ISO-6346 format validation).
- Change `date` handling: keep as a date column for sorting/filtering, but the create/edit form accepts it as free-typed text (matching the source sheet's `DD/MM` style entries) rather than a native date picker.
- Add `isActive` soft-delete (already present) as the only "deletion" mechanism — no status workflow remains.
- Rebuild the yard moves list page (`/yard-moves`) to render columns: STT (computed display index), NGÀY, GPS, FULL NAME, TRUCK, MOOC, BOOKING, CONTAINER, GHI CHÚ, DÃ KÉO, Thao tác — with 10 records per page pagination (reusing the existing `PAGE_SIZE_YARD = 10` pattern).
- Rebuild the create/edit modal forms: every field becomes a plain text input (no selects, no date picker, no zone/location/status pickers).
- Add a new Excel import/export flow for yard moves, following the existing builder/parser pattern used for trip plans (`kehoach-xe`) and vehicles (`quanly-xe`): a new export builder, a new import parser, wired into the existing `/api/export` and `/api/import` modules, and a new upload/export section on the `/import-export` page.

## Capabilities

### New Capabilities
- `yard-move-excel-export`: GET endpoint that generates a branded `.xlsx` export of yard moves with columns STT, NGÀY, GPS, FULL NAME, TRUCK, MOOC, BOOKING, CONTAINER, GHI CHÚ, DÃ KÉO (+ hidden ID column), following the existing export builder pattern.
- `yard-move-excel-import`: POST endpoint that parses an uploaded `.xlsx` file matching the export column layout, supports preview (`?confirm=false`) and execution (`?confirm=true`) modes, creates/updates `YardMove` records, and logs audit entries, following the existing import parser pattern.

### Modified Capabilities
- `yard-move`: Prisma model fields change (remove zone/status/cost fields and relation, add gps/fullName/truck/mooc/booking/daKeo, relax containerNumber validation); `POST /yard-moves` and `GET /yard-moves` request/response shapes change; `PATCH /yard-moves/:id/status` and `POST /yard-moves/:id/costs` endpoints are removed; `PATCH /yard-moves/:id` becomes the only update path (including soft-delete via `isActive: false`).
- `yard-move-interactions`: List page columns, create/edit form fields, and pagination behavior change to match the new flat-record model; status-transition buttons and the cost modal are removed entirely.

## Impact

- **Database**: New Prisma migration dropping `fromZone`, `toZone`, `locationId`, `status` columns and the `YardMoveCost` table, plus the `YardMoveStatus`/`YardCostType` enums if unused elsewhere; adding `gps`, `fullName`, `truck`, `mooc`, `booking`, `daKeo` columns to `yard_moves`. No data migration needed (table has no production data yet).
- **Backend**: `apps/api/src/modules/yard-move/*` (entity DTOs, controller, service); new `apps/api/src/modules/export/builders/lenh-bai.builder.ts`; new `apps/api/src/modules/import/parsers/lenh-bai.parser.ts`; updates to `export.controller.ts`/`export.service.ts` and `import.controller.ts`/`import.service.ts`.
- **Frontend**: `apps/web/src/app/(authenticated)/yard-moves/page.tsx` (list, create modal, edit modal — cost modal removed); `apps/web/src/app/(authenticated)/import-export/page.tsx` (new upload/export section).
- **Shared package**: `@tms/shared` DTO/type exports for `YardMove` change shape; `YardMoveStatus`/`YardCostType` enums removed if no longer referenced elsewhere.
