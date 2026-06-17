## Context

Pagination was added to 8 reference data pages in the previous change (`reference-data-pagination`). All pages now use `PaginatedResponse<T>` from `@tms/shared`. The next step is to add server-side search and filtering so users can find records without scrolling through pages.

Current state:

- `customers`, `carriers`, `locations` already have a `search` param but each only matches 2 fields (name + code)
- `service-types`, `container-sizes` have no search at all
- `yard-moves` has only `locationId` + `status` filters; no text search, no date range
- `cost-templates` frontend table calls `toLocaleString("vi-VN")` on `Decimal`-serialized values that arrive as strings from Prisma JSON — the call is a no-op, so numbers display unformatted
- `audit-logs` backend already accepts `dateFrom`/`dateTo` but the frontend has no date picker UI

## Goals / Non-Goals

**Goals:**

- Extend search OR clauses in customer, carrier, location services to cover more fields
- Add full search + date-range + status filter to yard-moves service and UI
- Add search + isActive filter to service-types and container-sizes services and UI
- Add date-range filter UI to audit-logs frontend
- Fix `defaultAmount` display in cost-templates table

**Non-Goals:**

- Full-text search or trigram indexing
- Saved filters or filter presets
- Combined date + search for customers/carriers/locations (only yard-moves and audit-logs get date range)

## Decisions

### D1: Extend `YardMoveFilters` in shared package

`YardMoveFilters` currently has `locationId?` and `status?`. Adding `search?`, `dateFrom?`, `dateTo?` here keeps the API contract in one place and avoids a custom DTO just for the controller.

Alternative: Add raw query params in the controller and pass them directly — rejected because the shared type is already used across backend and would leave the type stale.

### D2: Yard-move search uses OR across `containerNumber`, `fromZone`, `toZone`, `location.name`

Zone values (`STAGING_DROP`, `LOADING_DOCK`, `STAGING_READY`) are stored as plain strings, so `contains` with `insensitive` mode works. `location.name` requires a nested `location: { name: { contains, mode } }` clause. All four go into an `OR` array.

### D3: Date range filters on `createdAt` for yard-moves (same pattern as audit-logs)

`dateFrom` → `createdAt.gte`, `dateTo` → `createdAt.lte`. This is the same pattern already in `audit.service.ts` and is consistent with how the frontend passes ISO date strings.

### D4: service-types and container-sizes add `search` + `isActive` params to `findAll`

Both models have `isActive: Boolean` and text fields (`code`/`description` for service-types; `code`/`name` for container-sizes). Adding optional `search` and `isActive` params with `where` built dynamically is the minimal change.

Frontend gets a text input + a 3-option status dropdown ("Tất cả" / "Đang hoạt động" / "Ngừng hoạt động").

### D5: Cost-templates fix — `Number(r.defaultAmount)` before `toLocaleString`

Prisma serializes `Decimal` fields to JSON strings (`"1000.00"`). The frontend interface types it as `number | null`, but at runtime it is a string. `String.prototype.toLocaleString` inherited from `Object` just calls `toString()`, returning the raw string. Wrapping with `Number(...)` converts it to a JS number before formatting.

No API change needed.

### D6: Audit-logs date filter — frontend only

Backend `audit.service.ts` already reads `filters.dateFrom` and `filters.dateTo` from `AuditLogFilters`. The frontend just needs two `<input type="date">` fields and to append `&dateFrom=...&dateTo=...` to the fetch URL. Page resets to 1 when dates change.

## Risks / Trade-offs

- `insensitive` mode on `contains` for zone string search may return unexpected matches if zone codes partially match a container number — acceptable since zone values are short well-known strings.
- Adding `search` to service-types/container-sizes controllers means the query params are now `search`, `isActive`, `page`, `limit`. The `isActive` param arrives as a string `"true"/"false"` and must be parsed before use in the Prisma query.
- `Number(r.defaultAmount)` will return `NaN` if the API ever returns a non-numeric value — existing null guard (`r.defaultAmount != null`) prevents `null`, but malformed data could slip through. Acceptable: the data comes from a `Decimal` column with no free-form input path.
