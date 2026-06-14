## Context

The `quanly-xe.parser.ts` uses a `buildHeaderMap` function that maps each cell's text value to its column index. When two columns share the same display name (e.g., both the vehicle and mooc sections have a column called `HẠN ĐĂNG KIỂM`), the map stores only the last occurrence, overwriting the vehicle column index with the mooc one. The parser's named candidates for `HAN_DK_MOOC` then return -1 because the header has no "(mooc)" suffix, so mooc dates are always null, while vehicle dates silently read from the wrong column.

Additionally several column header candidates in the parser do not match the actual Excel headers used in production (`TÊN TX`, `THEO XE`, `HẠN BẢO HIỂM` without "xe" suffix, `HẠN BH` for mooc). `GHI CHÚ` is not parsed at all. The list service uses `orderBy: { createdAt: "desc" }`, reversing the visual order relative to the source file.

## Goals / Non-Goals

**Goals:**

- All columns from the production "quản lý xe" Excel file are correctly extracted and persisted after import.
- Records in the list page are displayed in the same top-to-bottom order as they appear in the Excel file.

**Non-Goals:**

- Upsert / deduplication by license plate — the spec intentionally allows duplicate records on re-import.
- Supporting arbitrary alternate Excel layouts beyond the confirmed production format.
- Changes to the UI table rendering (multi-mooc rowspan logic is already correct).

## Decisions

### Decision 1 — Position-relative mooc column detection

**Problem**: Mooc date columns share display names with vehicle date columns. Name-based lookup cannot distinguish them.

**Decision**: After finding `SỐ MOOC` at column index N, derive mooc date columns by offset:

- N+1 → `HAN_DK_MOOC` (Hạn Đăng Kiểm mooc)
- N+2 → `HAN_BH_MOOC` (Hạn BH mooc)
- N+3 → `HAN_CV_MOOC` (Hạn Cà Vẹt mooc)
- N+4 → `GHI_CHU`

**Rationale**: The column order within each section is fixed by the production template. Offset-based lookup is stable regardless of header display names and is not affected by the duplicate-header collision.

**Alternative considered**: Build the header map with "first-occurrence wins" instead of "last-occurrence wins". Rejected — this fixes vehicle columns but still leaves mooc column lookups returning -1 (no "mooc" suffix in actual headers).

### Decision 2 — Keep buildHeaderMap unchanged; derive mooc positions post-lookup

`buildHeaderMap` is also used by the `kehoach-xe` parser. Modifying its overwrite behaviour could break that parser. Instead, `parseQuanLyXe` reads `SO_MOOC` from the map (which is unambiguous — only one column is named "số mooc") and derives the four offset columns without touching the map itself.

### Decision 3 — orderBy asc for list endpoint

Change `findAll()` to `orderBy: { createdAt: "asc" }`. Imports iterate Excel rows top-to-bottom; using `asc` ensures the first Excel row appears first in the list.

**Risk**: Users who rely on "newest at top" behaviour will see the list order change. Accepted — the original behaviour was a bug, not a feature.

## Risks / Trade-offs

- **Offset fragility**: If a user inserts extra columns between `SỐ MOOC` and the date columns, offsets will be wrong. Mitigation: the parser already logs silent skips when column indices are -1; extend this to log a warning when GHI_CHU offset produces an unexpected value.
- **Header normalisation**: Vietnamese diacritics in cell values depend on Unicode NFC form. The existing `cellText` / `.toLowerCase()` approach is kept; no new normalisation is introduced.

## Migration Plan

- No database schema changes.
- No data migration — previously imported records with null dates remain as-is; re-importing will produce new (correct) records.
- Deploy: replace parser + service files; no restart coordination required beyond normal API deployment.
