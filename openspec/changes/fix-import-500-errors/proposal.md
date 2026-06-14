## Why

The `/api/import/vehicles` endpoint returns HTTP 500 in two scenarios: (1) the Next.js BFF proxy has no error handling around its `fetch` call, so any network failure to the NestJS backend (e.g., backend not yet ready on startup) causes an unhandled exception; (2) `workbook.xlsx.load()` and `parseQuanLyXe()` in the import service run outside any try-catch, so invalid or corrupt Excel files also produce a 500 instead of a useful error response.

## What Changes

- **Next.js BFF proxy** (`apps/web/src/app/api/[...path]/route.ts`): Wrap `proxyRequest` in try-catch so that network errors (ECONNREFUSED, timeout) return 502/503 instead of an unhandled Next.js crash.
- **Import service** (`apps/api/src/modules/import/import.service.ts`): Wrap `workbook.xlsx.load()` and the parser call in try-catch inside both `importVehicles` and `importTripPlans`, returning a 400/422 with a readable message instead of an unhandled 500.

## Capabilities

### New Capabilities

- `bff-proxy-error-handling`: BFF proxy returns structured error responses (502/503) when the upstream API is unreachable, instead of crashing with 500.
- `import-error-handling`: Import endpoints return 400 with a descriptive message when the uploaded file cannot be parsed, instead of returning 500.

### Modified Capabilities

- `bff-api-proxy`: Error handling behavior of the proxy is extended (new requirement: network errors must return 502/503).
- `vehicle-excel-import`: Import endpoint must now return 400 on invalid file instead of 500.
- `trip-plan-excel-import`: Same — import endpoint must return 400 on invalid file instead of 500.

## Impact

- `apps/web/src/app/api/[...path]/route.ts` — add try-catch
- `apps/api/src/modules/import/import.service.ts` — add try-catch around xlsx.load + parser call
- No new dependencies, no schema changes, no breaking API contract changes
