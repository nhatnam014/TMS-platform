## Context

The Next.js BFF proxy (`apps/web/src/app/api/[...path]/route.ts`) and the NestJS import service (`apps/api/src/modules/import/import.service.ts`) both have unguarded code paths that produce HTTP 500 errors in common, recoverable situations:

1. **BFF proxy**: `proxyRequest()` calls `fetch()` with no try-catch. If NestJS is unreachable (ECONNREFUSED, timeout — e.g., backend hasn't finished starting), Node.js throws, and Next.js emits a 500 with no message.
2. **Import service**: `workbook.xlsx.load()` and `parseQuanLyXe()` / `parseKeHoachXe()` are called outside any try-catch. A corrupt or non-xlsx file throws synchronously, bypassing the per-row error collection and returning 500.

Both are defensive coding gaps, not logic flaws. No schema or API contract changes are required.

## Goals / Non-Goals

**Goals:**

- BFF proxy returns 502 (backend unreachable) instead of crashing with 500
- Import endpoints return 400 (bad file) with a readable message instead of 500
- Both changes are minimal and surgical — no refactoring of surrounding code

**Non-Goals:**

- Adding retry logic or circuit-breaking to the proxy
- Validating Excel column structure before attempting to parse
- Changing the import response shape or adding new fields

## Decisions

### Decision 1: 502 vs 503 for proxy network errors

**Chosen**: Return `502 Bad Gateway`.

**Rationale**: 502 is the correct semantic for "the gateway received no valid response from the upstream." 503 means the gateway itself is unavailable. When NestJS is unreachable, the upstream (NestJS) is the problem, not Next.js.

**Alternative considered**: 503 Service Unavailable — rejected because it signals the BFF itself is down, which misleads the client.

### Decision 2: 400 vs 422 for unparseable Excel file

**Chosen**: Return `400 Bad Request` via NestJS `BadRequestException`.

**Rationale**: The file was sent but cannot be interpreted. 400 is the standard for malformed input. 422 (Unprocessable Entity) is also valid but 400 is already used by the controller's "no file uploaded" guard, keeping the error surface consistent.

**Alternative considered**: 422 — not chosen for consistency with existing controller error style.

### Decision 3: Catch scope in import service

**Chosen**: Wrap only `workbook.xlsx.load()` and the parser call in a single top-level try-catch that re-throws as `BadRequestException`. The per-row try-catch stays as-is.

**Rationale**: The per-row loop already handles Prisma errors gracefully. The new guard only needs to catch the file-level parsing phase. Merging both into one catch would hide row-level errors.

## Risks / Trade-offs

- **[Risk] Hiding real 500 bugs in the proxy** → Mitigation: The proxy catch block logs the original error to `console.error` before returning 502, ensuring errors are visible in server logs.
- **[Risk] `BadRequestException` message leaks internal details** → Mitigation: The message is hardcoded as "File không hợp lệ hoặc không đúng định dạng .xlsx" — no stack trace or internal paths are exposed.
- **[Trade-off] Minimal scope** → Deliberate choice. This change does not add retry logic or more sophisticated error classification, accepting that all network errors look the same to the client (502).

## Migration Plan

No database migrations or environment variable changes required. Both changes are drop-in code edits deployable with a normal `pnpm build` + restart.
