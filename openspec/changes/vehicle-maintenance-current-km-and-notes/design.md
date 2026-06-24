## Context

`VehicleRecord` already carries maintenance-adjacent fields (`donViSuaChua`, `ngayLam`, `ghiChu`) and a `kmRounds` relation to `VehicleMaintenanceKmRound` (one row per `roundNumber`, each holding a free-text `kmCon` value such as "250.000 km"). The `/vehicle-maintenance` page renders these as sticky pinned columns followed by a dynamic block of `KM CÒN LẦN n` columns. `ghiChu` is already bound to the quản lý xe (vehicle-records) page's general notes field, so it cannot be reused for a maintenance-specific note without corrupting unrelated data.

This change adds two new scalar fields to the same table: a single current-odometer reading (`kmHienTai`) and a single maintenance note (`ghiChuBaoDuong`), both per-vehicle (not per km-round).

## Goals / Non-Goals

**Goals:**
- Add `kmHienTai` (current km) displayed between the pinned columns and the `KM CÒN LẦN n` block
- Add `ghiChuBaoDuong` (maintenance note) displayed after the last `KM CÒN LẦN n` column, stored under a name distinct from `ghiChu`
- Both fields round-trip through the bảo dưỡng xe Excel export/import and the edit modal

**Non-Goals:**
- Per-km-round notes (one note per `roundNumber`) — explicitly rejected in favor of a single vehicle-level note
- Changes to the quản lý xe page, its `ghiChu` field, or its Excel template
- Changes to km-round add/delete behavior

## Decisions

- **Storage shape**: `kmHienTai: String?` and `ghiChuBaoDuong: String?` directly on `VehicleRecord`, following the existing pattern of `donViSuaChua`/`ngayLam` (simple nullable scalar columns added via migration), rather than a new related table. Both are single values per vehicle, so no relation is needed.
  - *Alternative considered*: storing `kmHienTai` as a numeric type. Rejected — existing `kmCon` values on km rounds are free text ("250.000 km", sometimes with units or annotations); `kmHienTai` follows the same convention for consistency and Excel round-trip simplicity.
- **Field naming**: `ghiChuBaoDuong` (not `ghiChu2` or reusing `ghiChu`) to make the distinction from the quản lý xe notes field self-evident in code and migrations.
- **Column position — KM HIỆN TẠI**: rendered as a normal (non-sticky) column immediately after the pinned "Đơn vị sửa chữa" column and before "KM CÒN LẦN 1", matching the explicit ordering requirement. It is not added to the sticky/pinned set.
- **Column position — GHI CHÚ**: rendered after the last dynamic `KM CÒN LẦN n` column (i.e., it shifts position page-to-page as `colCount` changes, always immediately preceding the action-menu column). In Excel, it sits between the last `KM CÒN LẦN n` column and the `ID` column, mirroring the table's right-to-left structure (dynamic columns, then trailing metadata).
- **Edit modal placement**: `kmHienTai` joins the existing "Đơn vị sửa chữa" section (same green box, alongside `donViSuaChua`/`ngayLam`) since it's conceptually a snapshot fact about the vehicle, not a km-round entry. `ghiChuBaoDuong` gets its own new section (textarea) at the bottom of the modal, since it's free-form and benefits from more vertical space.
- **API shape**: both fields are added to the existing `PATCH /api/vehicle-maintenance/:id` endpoint via `UpdateMaintenanceFieldsDto` — no new endpoints, consistent with how `donViSuaChua`/`ngayLam` are already handled.
- **Excel header text**: export header "KM HIỆN TẠI" and "GHI CHÚ" (matching the all-caps style of existing headers); import parser matches case-insensitively on "km hiện tại" / "ghi chú" (and ASCII-folded variants), consistent with existing header-matching helpers.

## Risks / Trade-offs

- [Risk] Import parser's "ghi chú" header match could collide with a literal "Ghi chú" column meant for the quản lý xe sheet if a malformed file mixes templates → Mitigation: the bảo dưỡng xe parser only runs against files uploaded through the bảo dưỡng xe import endpoint, which already assumes the bảo dưỡng xe column set; no cross-template ambiguity in practice.
- [Risk] Adding a column before the dynamic `KM CÒN LẦN n` block shifts fixed pixel offsets used for sticky positioning in `vehicle-maintenance/page.tsx` → Mitigation: `KM HIỆN TẠI` is deliberately non-sticky, so only the static `left` offset constants for columns after it (none currently, since it's the last pinned-adjacent column) need no change; only column count/width math (`colCount`, table width) needs updating, which is already centralized.
- [Risk] Existing exported/imported files lack the two new columns → Mitigation: both parser and DTO treat the fields as optional/nullable; missing columns simply yield `null`, matching the existing pattern for `donViSuaChua`.

## Migration Plan

1. Add a Prisma migration adding nullable `km_hien_tai` and `ghi_chu_bao_duong` columns to `vehicle_records` (no backfill needed; all existing rows get `NULL`).
2. Deploy API changes (DTO, service, builder, parser) — backward compatible, since fields are optional everywhere.
3. Deploy web changes (new columns, modal inputs).
4. No data backfill or rollback complexity — both columns can be dropped cleanly if reverted, since no other feature depends on them.

## Open Questions

(none — placement, naming, and storage shape were resolved during exploration)
