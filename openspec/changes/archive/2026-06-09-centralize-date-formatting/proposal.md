## Why

Date formatting logic is duplicated across at least 6 frontend files, each defining its own `formatDate` function or using inline `new Date(x).toLocaleDateString("vi-VN")`. This makes it impossible to change the display format in one place, and the inconsistency creates risk of format drift across pages.

## What Changes

- Add a shared `src/lib/date-utils.ts` utility with `formatDate`, `formatDateTime`, and `toDateInput` functions
- Remove duplicate `formatDate` function definitions from `vehicles/page.tsx`, `vehicle-records/page.tsx`, and `users/page.tsx`
- Replace all inline `new Date(x).toLocaleDateString("vi-VN")` calls in `trip-plans/page.tsx`, `yard-moves/page.tsx`, and `audit-logs/page.tsx` with imports from the shared utility
- Backend API continues to return ISO 8601 strings — no API changes

## Capabilities

### New Capabilities

- `date-formatting`: Shared frontend utility for displaying dates in `dd/mm/yyyy` format consistently across all pages

### Modified Capabilities

<!-- No existing spec-level requirements are changing — this is a frontend refactor -->

## Impact

- **Files modified**: `apps/web/src/app/(authenticated)/vehicles/page.tsx`, `vehicle-records/page.tsx`, `users/page.tsx`, `trip-plans/page.tsx`, `yard-moves/page.tsx`, `audit-logs/page.tsx`
- **File created**: `apps/web/src/lib/date-utils.ts`
- **No API changes**: Backend keeps ISO 8601 format
- **No behavior changes**: Display output remains `dd/mm/yyyy` (vi-VN locale)
- **No new dependencies**: Uses native `Intl.DateTimeFormat` / `toLocaleDateString`
