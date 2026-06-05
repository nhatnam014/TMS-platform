## Why

Operations staff currently maintain trip plans and vehicle/driver data in Excel files (`TMS template - VIET CODE.xlsx`) and have no way to bulk-load them into the TMS platform or produce the same Excel format from the system. Adding import and export endpoints closes this gap and unblocks daily operations workflows.

## What Changes

- **BFF proxy binary fix** — `apps/web/src/app/api/[...path]/route.ts` currently uses `request.text()` / `apiRes.text()`, which corrupts binary payloads. Fix to use `arrayBuffer()` for both body and response, and pass through all response headers (not just `Content-Type`).

- **`POST /api/v1/import/vehicles`** — accepts an `.xlsx` file (the "quản lý xe" sheet), upserts Vehicle, Driver, and Trailer records. Returns `{ imported, warnings, errors }`. Never hard-fails; auto-creates missing records.

- **`POST /api/v1/import/trip-plans`** — accepts an `.xlsx` file (the "kế hoạch xe" sheet), upserts TripPlan + TripCost rows. Resolves or auto-creates Customer, Carrier, Location, Container, and Vehicle references. Returns `{ imported, warnings, errors }`.

- **`GET /api/v1/export/trip-plans?from=&to=`** — returns a flat `.xlsx` file with Vietnamese headers matching the original template column order.

- **`GET /api/v1/export/vehicles`** — returns a flat `.xlsx` file with Vietnamese headers matching the "quản lý xe" column order.

- **Frontend import/export page** — `apps/web/src/app/(authenticated)/import-export/page.tsx` with file-upload sections for each import endpoint and download buttons for each export endpoint. Admin-only (same guard pattern as `/users` and `/audit-logs`).

- **Nav sidebar entry** — ADMIN-only entry `{ href: "/import-export", label: "Nhập / Xuất Excel" }`.

- **New shared types** — `ImportResult` interface added to `packages/shared/src/index.ts`.

## Capabilities

### New Capabilities

- `vehicle-excel-import`: Bulk-import Vehicle, Driver, and Trailer records from the "quản lý xe" Excel sheet
- `trip-plan-excel-import`: Bulk-import TripPlan and TripCost records from the "kế hoạch xe" Excel sheet
- `trip-plan-excel-export`: Export TripPlan data as a flat Excel file in the original template column order
- `vehicle-excel-export`: Export Vehicle/Driver/Trailer compliance data as a flat Excel file

### Modified Capabilities

- `bff-api-proxy`: Proxy must handle binary request bodies (file uploads) and binary response bodies (Excel downloads), and pass through all response headers

## Impact

- `apps/api/package.json` — add `exceljs` runtime dep, `@types/multer` devDep
- `apps/api/src/app.module.ts` — register `ImportModule`, `ExportModule`
- `apps/api/src/modules/import/` — new module (controller, service, parsers, utils)
- `apps/api/src/modules/export/` — new module (controller, service, builders)
- `apps/web/src/app/api/[...path]/route.ts` — binary fix
- `apps/web/src/app/(authenticated)/import-export/page.tsx` — new page
- `apps/web/src/components/nav-sidebar.tsx` — new ADMIN nav entry
- `packages/shared/src/index.ts` — `ImportResult` type
