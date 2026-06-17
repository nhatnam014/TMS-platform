## Why

User-entered data can cause the API to return HTTP 500 in two situations: (1) `PrismaClientKnownRequestError` codes that are not caught at the service level (e.g. P2003 foreign-key violation when a referenced entity no longer exists), and (2) `PrismaClientUnknownRequestError` for database-native errors like Postgres `22003` (numeric field overflow) which Prisma does not translate into a known code. The symptom is a generic "Internal server error" toast or no feedback at all. The fix requires a global exception filter as a safety net plus tightened DTO and frontend validation for the specific latitude/longitude overflow case that triggered this investigation.

## What Changes

- **New global Prisma exception filter**: A NestJS `ExceptionFilter` that catches both `PrismaClientKnownRequestError` and `PrismaClientUnknownRequestError` and returns structured 4xx/5xx JSON with user-facing messages instead of leaking raw 500s.
- **Location DTO validation**: Add `@Min`/`@Max` range constraints to `latitude` and `longitude` in `CreateLocationDto` and `UpdateLocationDto` so the `ValidationPipe` returns a 400 before the value ever reaches Prisma.
- **Location frontend form**: Change the `latitude`/`longitude` inputs from free-text to `type="number"` with `min`, `max`, and `step` attributes so the browser blocks out-of-range values before submission.
- **Global filter registration**: Register the new filter in `main.ts` via `app.useGlobalFilters(...)`.

## Capabilities

### New Capabilities

- `prisma-error-handling`: Global NestJS exception filter that converts Prisma errors into appropriate HTTP responses with Vietnamese user-facing messages.

### Modified Capabilities

- `location-crud`: `CreateLocationDto` and `UpdateLocationDto` gain explicit range validation on `latitude` and `longitude`; the frontend form uses numeric inputs with min/max constraints.

## Impact

- `apps/api/src/common/filters/prisma-exception.filter.ts` — new file
- `apps/api/src/main.ts` — `app.useGlobalFilters(...)`
- `apps/api/src/modules/location/dto/create-location.dto.ts` — `@Min`/`@Max` on lat/lng
- `apps/api/src/modules/location/dto/update-location.dto.ts` — same
- `apps/web/src/app/(authenticated)/locations/page.tsx` — numeric inputs with range for lat/lng
