## Context

The TMS frontend (Next.js) receives all dates from the API as ISO 8601 strings (e.g., `"2024-01-15T00:00:00.000Z"` for full datetimes, `"2024-01-15"` for date-only fields stored as `@db.Date` in Prisma). Currently, each page file independently defines a `formatDate` function or uses inline `new Date(x).toLocaleDateString("vi-VN")` calls. This logic is scattered across at least 6 files with no shared source of truth.

The customer requirement is that all DateTime values in the UI display as `dd/mm/yyyy`. The `vi-VN` locale already produces this format — the issue is deduplication and consistency, not correctness.

## Goals / Non-Goals

**Goals:**

- Single source of truth for date display formatting in the frontend
- `dd/mm/yyyy` format everywhere dates are shown to users
- Safe handling of `null`, `undefined`, and invalid date strings

**Non-Goals:**

- Changing the Backend API format (stays ISO 8601)
- Adding a date library dependency (dayjs, date-fns, etc.)
- Timezone conversion or localization beyond `vi-VN`
- Formatting of time-only or numeric values

## Decisions

### Decision 1: Frontend-only, no API format change

**Chosen**: Keep Backend returning ISO 8601, format only at display layer.

**Rationale**: ISO 8601 is unambiguous and timezone-safe. HTML `<input type="date">` expects `yyyy-mm-dd` internally. Changing the API to return `dd/mm/yyyy` strings would break date inputs, break sort/filter operations, and couple the API to a UI concern. The display format can change without touching the API.

**Alternatives considered**: Returning formatted strings from API — rejected because it conflates data serialization with UI presentation.

### Decision 2: Native Intl / toLocaleDateString, no third-party library

**Chosen**: Use `new Date(d).toLocaleDateString("vi-VN")` and `toLocaleString("vi-VN")`.

**Rationale**: No new dependency needed. The native API already produces the correct `dd/mm/yyyy` output for vi-VN locale. All modern browsers and Node.js support this.

**Alternatives considered**: `dayjs` or `date-fns` — rejected because they add bundle weight and are unnecessary for a single locale format.

### Decision 3: Three exported functions with clear semantics

```
formatDate(d)      → "15/01/2024"           for date-only display
formatDateTime(d)  → "15/01/2024, 14:30"    for timestamp display
toDateInput(d)     → "2024-01-15"           for <input type="date"> value
```

**Rationale**: Separating date-only from datetime prevents accidentally stripping time info where it matters (e.g., audit logs). `toDateInput` is not a display function — it's a form value helper — so it lives here too to avoid re-implementation in each form.

## Risks / Trade-offs

- **Server-side rendering hydration**: `toLocaleDateString` output can differ between server (Node.js) and client if locale data differs. Mitigation: All pages using dates are `"use client"` components, so SSR mismatch is not a concern here.
- **Null propagation**: The utility must handle `null | undefined | ""` inputs gracefully (return `"—"` or `""` depending on context). Mitigation: defined per-function contract in specs.
- **Invalid dates**: `new Date("garbage")` produces `Invalid Date`. Mitigation: check `isNaN(date.getTime())` before formatting.

## Migration Plan

1. Create `apps/web/src/lib/date-utils.ts`
2. For each affected page file, remove local `formatDate` definition and add import
3. Replace inline `new Date(x).toLocaleDateString("vi-VN")` calls with `formatDate(x)`
4. Replace inline `new Date(x).toLocaleString("vi-VN")` calls with `formatDateTime(x)`
5. No deployment coordination needed — pure frontend refactor, no API or DB changes
6. Rollback: revert any individual file independently

## Open Questions

None — approach is fully determined.
