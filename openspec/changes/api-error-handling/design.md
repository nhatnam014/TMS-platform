## Context

NestJS uses its built-in exception layer to map `HttpException` subclasses to HTTP status codes. Unhandled exceptions fall through to a default handler that returns `{ statusCode: 500, message: "Internal server error" }`. The API already uses `ValidationPipe` globally and throws `ConflictException`/`NotFoundException` in service code for known Prisma P2002 conflicts, but two categories of Prisma errors escape to 500:

1. `PrismaClientKnownRequestError` codes that no service currently handles: P2003 (foreign-key constraint violated when a referenced record does not exist), P2025 (record targeted for update/delete not found by Prisma itself rather than by an explicit pre-check).
2. `PrismaClientUnknownRequestError`: Postgres-native errors that Prisma wraps without a stable code — e.g., `22003` (numeric field overflow for `Decimal(10,7)` lat/lng columns).

The specific production error was: user entered a longitude value that caused Postgres `22003`, which surfaced as a 500 because nothing caught `PrismaClientUnknownRequestError`.

## Goals / Non-Goals

**Goals:**

- Ensure no Prisma error ever produces a 500 with "Internal server error" as the user-visible message
- Return structured JSON `{ statusCode, message }` for all Prisma error scenarios
- Add DTO-level range validation for latitude/longitude so `ValidationPipe` blocks bad values before Prisma
- Add frontend numeric input constraints for lat/lng for immediate feedback

**Non-Goals:**

- Rewrite service-level P2002 catches (they have better messages; global filter is a catch-all only)
- Add validation to every numeric field in every DTO (only lat/lng has a DB-enforced range that differs from TypeScript's `number` range)
- Internationalisation of error messages beyond Vietnamese

## Decisions

### D1: Catch both PrismaClientKnownRequestError and PrismaClientUnknownRequestError in one filter

Both are exported from `@tms/db` (re-exported from `@prisma/client`). NestJS `@Catch()` accepts multiple classes. A single filter handles all Prisma error categories cleanly.

Error code → HTTP status mapping:

- P2002 (unique constraint) → 409 with "Dữ liệu đã tồn tại" (fallback if service didn't catch)
- P2003 (FK constraint violated) → 422 with "Dữ liệu tham chiếu không hợp lệ hoặc không còn tồn tại"
- P2025 (record not found for update) → 404 with "Bản ghi không tồn tại"
- P2000 (value too long) → 400 with "Giá trị vượt quá độ dài cho phép"
- PrismaClientUnknownRequestError → 422 with "Dữ liệu không hợp lệ (lỗi cơ sở dữ liệu)"
- All other known codes → 500 with "Lỗi cơ sở dữ liệu" (still 500 but structured, not "Internal server error")

### D2: Register globally in main.ts via app.useGlobalFilters()

Alternative: `APP_FILTER` provider in AppModule. `useGlobalFilters` is simpler and consistent with how `ValidationPipe` is already registered (`useGlobalPipes`). There is no dependency injection need in this filter.

### D3: DTO validation uses @Min/@Max from class-validator

`latitude` range: −90 to 90. `longitude` range: −180 to 180. These correspond to WGS84 geographic coordinates and are stricter than the DB column's technical maximum of ±999.9999999.

The `enableImplicitConversion: true` in the existing `ValidationPipe` config means string query params are auto-cast, so `@Min`/`@Max` will evaluate against the converted number.

### D4: Frontend lat/lng uses input type="number" with min/max/step

The existing `FIELD` helper in `locations/page.tsx` renders `<input type="text">`. For lat/lng, replace with inline `<input type="number" min="-90" max="90" step="0.000001">` (resp. -180/180) to give instant browser-level feedback. Step `0.000001` (6 decimal places) is sufficient precision for ~0.1m accuracy and stays well within the `Decimal(10,7)` column.

## Risks / Trade-offs

- Existing service-level P2002 catches throw `ConflictException` before the filter would fire, so the filter's P2002 branch is only a safety net for services that don't handle it (currently none, but protects future services).
- Returning 422 for P2003 (instead of 400) is debatable. 422 (Unprocessable Entity) is more precise — the request was syntactically valid but semantically invalid. Either works; 422 is chosen to distinguish FK errors from validation errors (400).
- `PrismaClientUnknownRequestError` does not expose a stable error code, so the message is necessarily generic ("Dữ liệu không hợp lệ"). The error is still logged server-side for debugging.
