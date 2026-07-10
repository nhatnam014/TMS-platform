## Context

Today all Excel import/export UI lives on one ADMIN-only page, `apps/web/src/app/(authenticated)/import-export/page.tsx` (~960 lines). It defines, inline in that single file: a generic `UploadSection`, a generic `DownloadButton`, an `ImportResultDisplay` (nested inside `UploadSection`, showing warnings/errors/created/changed record counts), two diff popups (`ChangedRecordsPopup`, `CreatedRecordsPopup`), a maintenance-specific `LoaiXeExportPopup` + `MaintenanceExportSection`, and the page's own top-level layout wiring 4 upload sections + 4 export sections to their respective API endpoints. None of these components are used anywhere else in the codebase (verified: zero references outside this file).

Each of the 4 destination pages (`vehicle-records`, `trip-plans`, `vehicle-maintenance`, `yard-moves`) is a single large client-component file with its own locally-defined `Modal` component and a header-level "+ Tạo..." button that toggles a boolean state to open it — except `vehicle-maintenance`, which currently has no header action button at all (its only interactive elements are inline "···" row menus).

Backend access control today: `apps/api/src/modules/export/export.controller.ts` and `apps/api/src/modules/import/import.controller.ts` both apply `@UseGuards(JwtAuthGuard, RolesGuard)` at the controller level, and `RolesGuard` (`apps/api/src/modules/audit/roles.guard.ts`) unconditionally throws `ForbiddenException` for any non-ADMIN caller — it is not parameterized by a `@Roles()` decorator, it simply hardcodes the ADMIN check. `RolesGuard` is also used by `user.controller.ts` and `audit.controller.ts`, which are untouched by this change.

## Goals / Non-Goals

**Goals:**
- Move the 4 modules' upload/download triggers onto their own pages, opened from a header button + local modal, matching each page's existing modal convention.
- Preserve 100% of existing import/export business logic: endpoints, request/response shapes, parsers, Excel builders, result/diff display behavior.
- Eliminate duplication by extracting the shared pieces into one reusable component set instead of copy-pasting into 4 files.
- Open import/export access to all authenticated roles (previously ADMIN-only), consistent with the fact that the 4 destination pages themselves are not role-gated.
- Add an export-only "Đã kéo / Tồn" filter to the yard-moves export flow.

**Non-Goals:**
- No change to Excel column layouts, branded headers, parser column-matching, or any `@tms/shared` import/export types.
- No change to the main records list/filter bar on any of the 4 pages — the new "Đã kéo / Tồn" toggle lives only inside the yard-moves export modal.
- No schema migration — `daKeo` stays a free-text `String?` column.
- No change to `RolesGuard` usage on `user.controller.ts` / `audit.controller.ts`.
- No redesign of the upload/download visual style — components are relocated, not restyled.

## Decisions

### 1. Extract shared components instead of duplicating per page

Create `apps/web/src/components/import-export/`:
- `upload-section.tsx` — `UploadSection` (props: `title`, `endpoint`, `description`), unchanged logic.
- `download-button.tsx` — `DownloadButton` (props: `label`, `endpoint`, `filename`, `extraInputs?`, `buildUrl?`), unchanged logic.
- `import-result-display.tsx` — `ImportResultDisplay` + `ChangedRecordsPopup` + `CreatedRecordsPopup`, unchanged logic except the z-index fix below.
- `loai-xe-export-popup.tsx` — `LoaiXeExportPopup` (the vehicle-maintenance "chọn loại xe" multi-select), unchanged logic.

Each destination page imports only the pieces it needs (e.g. `yard-moves/page.tsx` imports `UploadSection` + `DownloadButton` + `ImportResultDisplay`; `vehicle-maintenance/page.tsx` additionally imports `LoaiXeExportPopup`). `MaintenanceExportSection` is not extracted as-is — its JSX shell (title/description/button that opens `LoaiXeExportPopup`) is inlined directly into the new `vehicle-maintenance` import/export modal, since it was already a thin wrapper specific to that one page.

Alternative considered: copy each section's JSX directly into its destination page (no shared components directory). Rejected — `ImportResultDisplay` + its two popups alone are ~260 lines; duplicating across 4 files would make future fixes (e.g. wording, popup behavior) error-prone to keep in sync.

### 2. Per-page trigger: header button → local modal, not an inline page section

Each page gets one new header button, "Nhập / Xuất Excel", placed next to the page's existing primary action button (or, for `vehicle-maintenance`, as the first header button). It toggles a new boolean state (e.g. `showImportExport`) that conditionally renders a modal. The modal body contains the module's `UploadSection` followed by its `DownloadButton` section(s), laid out as two labeled sub-sections (Nhập / Xuất) mirroring the old page's two `<h2>` groupings, but scoped to one module instead of four.

**Revised during implementation**: each page's own local `Modal` component turned out not to be uniformly reusable. `trip-plans` and `yard-moves` both define a plain `Modal({ title, onClose, children, wide })` with no form semantics — directly reusable. `vehicle-records`'s `Modal` wraps `children` in a `<form onSubmit>` with a single Save/Cancel footer, built for one-action Create/Edit flows — not a fit for two independent async actions (upload, download) with their own buttons and error states. `vehicle-maintenance` has no generic `Modal` at all; its only overlay (`EditModal`) inlines a form-specific card. Rather than special-case two pages, all 4 pages use one new shared `ImportExportModal({ title, onClose, children })` from `apps/web/src/components/import-export/import-export-modal.tsx` — a plain centered overlay matching the same visual language (`rgba(0,0,0,0.45)` backdrop, white rounded card, `zIndex: 50`, header with title + × close) already used by the plain-`Modal` pages, with no form/submit footer. This keeps the 4 pages visually and behaviorally consistent with each other, which the form-oriented `Modal` reuse would not have.

Alternative considered: an always-visible inline panel on the page (like the old page's always-visible sections). Rejected per explicit user decision — modal keeps the primary table/list uncluttered and matches how Create/Edit already work on 3 of the 4 pages.

### 3. Import result/diff popups are automatically scoped to the new modal — no separate placement decision needed

`ImportResultDisplay` (including `ChangedRecordsPopup` / `CreatedRecordsPopup`) is already a child of `UploadSection`'s own JSX, not a sibling page section. Moving `UploadSection` wholesale into each page's import/export modal carries the result/diff display along automatically, scoped per page per action. No redesign of this relationship is needed.

One follow-on fix is needed for correctness: today both the page-level `Modal` components (`vehicle-records`, `trip-plans`, `vehicle-maintenance`, `yard-moves` — all `zIndex: 50`) and `ChangedRecordsPopup`/`CreatedRecordsPopup` (also `zIndex: 50`) share the same z-index. When the diff popup is opened from inside the new import/export modal, both overlays are `position: fixed` with equal z-index, so correct stacking (diff popup on top) currently depends on DOM paint order rather than an explicit value. Fix: bump `ChangedRecordsPopup` / `CreatedRecordsPopup` to `zIndex: 60` in the extracted `import-result-display.tsx`, so the diff popup is guaranteed to render above the import/export modal regardless of paint order.

The import/export modal itself MUST NOT auto-close when an upload completes (matching today's behavior, where results simply render in place with nothing to auto-dismiss) — closing is always a manual user action, so the result/diff stays visible until the user is done reviewing it.

### 4. Remove `RolesGuard` from export/import controllers rather than relaxing it

Per explicit decision, import/export access moves from ADMIN-only to all authenticated roles. Since `RolesGuard` on these two controllers has no parameterization (it's a blanket ADMIN check, not driven by a `@Roles()` metadata list), the simplest correct change is to drop `@UseGuards(JwtAuthGuard, RolesGuard)` → `@UseGuards(JwtAuthGuard)` at the controller level in both `export.controller.ts` and `import.controller.ts`. `JwtAuthGuard` alone still requires a valid session.

Alternative considered: introduce a parameterized `@Roles()` decorator system to allow finer-grained per-endpoint role lists. Rejected as over-engineering — nothing in this change calls for per-endpoint role differences within export/import, and `user.controller.ts`/`audit.controller.ts` (which do need ADMIN-only) are untouched and keep using `RolesGuard` as-is.

### 5. "Đã kéo / Tồn" filter semantics and layering

`daKeo` (`packages/db/prisma/schema.prisma`, `YardMove.daKeo String? @map("da_keo")`) is free text with no canonical value set — it is whatever staff typed in the create/edit form or a prior Excel import. Per explicit decision: **any non-empty value = "Đã kéo"; null or empty string = "Tồn"**. No new column, no value normalization of existing data.

Layering:
- Controller: `export.controller.ts`'s `GET /export/yard-moves` gains `@Query("daKeoStatus") daKeoStatus?: "hauled" | "pending"`.
- Service: `export.service.ts`'s `exportYardMoves(from?, to?, daKeoStatus?)` extends its `where: Prisma.YardMoveWhereInput` — `hauled` → `{ daKeo: { not: null } }` combined with excluding empty string (Prisma has no direct "not empty string" combinator with `not: null`, so use `AND: [{ daKeo: { not: null } }, { NOT: { daKeo: "" } }]`); `pending` → `{ OR: [{ daKeo: null }, { daKeo: "" }] }`. Omitted `daKeoStatus` → no additional filter (current behavior, unchanged).
- Builder (`lenh-bai.builder.ts`): no change — the `daKeo` column is already a verbatim passthrough; filtering happens before rows reach the builder.
- Frontend: a 3-state toggle (Tất cả / Đã kéo / Tồn) rendered as `extraInputs` inside the yard-moves `DownloadButton` usage, alongside the existing from/to date inputs — mirrors how date filters are already passed via `buildUrl()`.

This filter is *export-only*. `YardMoveService.findAll` (the list-page query) and `YardMoveFilters` (`packages/shared/src/index.ts`) are not touched, per explicit decision to keep scope to the export flow.

### 6. Filtered exports that match zero rows still download a valid file, with a row-count header driving the toast message

Discovered post-implementation: every export builder (`kehoach-xe`, `lenh-bai`, `quanly-xe`, `baoduong-xe`) already handles an empty `records` array gracefully — `records.forEach(...)` on `[]` just produces a valid `.xlsx` with the branded header and column-header row but zero data rows, no exception anywhere in the service/builder chain. The gap is entirely on the frontend: `DownloadButton` only checks `res.ok` (HTTP status) before triggering the browser download, so a filter that matches nothing still shows the generic "Tải xuống thành công" toast — silently misleading, since the user has no way to tell the file is empty without opening it.

This matters more for yard-moves than trip-plans because yard-moves export now has two independent filter axes (date range, `daKeoStatus`) that can combine into an empty result even when *neither* filter is empty on its own — e.g. records exist in the selected date range (just none "chưa kéo") and records exist that are "chưa kéo" (just none in that date range). Determining which filter is "at fault" for the empty intersection would require running each filter axis as a separate query for comparison, for a message that isn't meaningfully more actionable than just restating what the user selected — so the fix does not attempt that distinction.

Scope: only `trip-plans` and `yard-moves` exports get this treatment (both have genuine user-selectable filters that can yield zero results). `vehicles` export has no filters at all. `vehicle-maintenance` export is filtered by "loại xe" values sourced from a live dropdown of currently-existing values, so an empty result there would only occur in a narrow race condition (records deleted between the popup's fetch and the export click) — out of scope, not worth the added complexity for this change.

Mechanism:
- `export.service.ts`: `exportTripPlans` and `exportYardMoves` change their return type from a bare `Buffer` to `{ buffer: Buffer; count: number }`, where `count` is `records.length` (or `result.data.length` for trip-plans, which already goes through `TripPlanService.findAll`) captured right after the query, before the builder runs. `exportVehicles` and `exportVehicleMaintenance` are unchanged (still return a bare `Buffer`), since they're out of scope per the above.
- `export.controller.ts`: both affected handlers add `res.set("X-Export-Row-Count", String(count))` alongside the existing `Content-Disposition`/`Content-Type` headers, before `res.end(buffer)`.
- Proxy transparency confirmed: `apps/web/src/app/api/[...path]/route.ts`'s BFF proxy forwards all upstream response headers except a small hop-by-hop blocklist (`transfer-encoding`, `connection`, `keep-alive`) — `X-Export-Row-Count` passes through untouched, and since the browser's `fetch()` call to `/api/export/...` is same-origin (through the Next.js app itself), there's no `Access-Control-Expose-Headers` concern to worry about.
- `download-button.tsx`: reads `res.headers.get("X-Export-Row-Count")` after a successful fetch, still always triggers the file download (an empty-but-valid template file is still useful to some users), but branches the toast: count `0` → a warning-style toast describing the active filters as the user set them (new optional prop, e.g. `emptyResultMessage?: string`, computed by the caller page from its own filter state and passed in); anything else → the existing generic success toast, unchanged.
- Each of trip-plans' and yard-moves' `DownloadButton` usages computes and passes this message from their own local filter state (`exportFromDate`/`exportToDate`/`exportDaKeoStatus`), so `DownloadButton` itself stays filter-agnostic — it only needs a precomputed string, not knowledge of what filters exist.

Alternative considered: have the backend return JSON (`{ count: 0 }`) instead of the `.xlsx` bytes when the count is zero, letting the frontend branch on `Content-Type` and skip generating/downloading a throwaway file entirely. Rejected — more invasive per-endpoint contract change, and blocking the download removes a file some users may still want (e.g. to see the column template). A live "0 kết quả" count *before* the user even clicks download (via a separate preview-count endpoint, checked as filters change) was also considered and rejected as higher-effort than justified for this change — nothing rules it out as a future enhancement.

## Risks / Trade-offs

- **[Risk] Removing `RolesGuard` widens who can trigger bulk data writes (import) and bulk data reads (export) for vehicles/trip-plans/maintenance/yard-moves** → Mitigation: this is an explicit, acknowledged decision (not an incidental side effect); flagged as **BREAKING** in the proposal. Endpoints remain behind `JwtAuthGuard` (authentication still required), and all writes continue to go through existing audit-log recording (unaffected by this change).
- **[Risk] `vehicle-maintenance/page.tsx` gains its first-ever header action button** → Mitigation: low risk, purely additive; follow the same button styling already used on the other 3 pages' "+ Tạo..." buttons for visual consistency.
- **[Risk] `daKeoStatus` filter semantics (non-empty vs. empty) may not match every historical free-text entry's intent** (e.g. a note like "chưa" typed into `daKeo` would count as "hauled" under this filter since it's non-empty) → Mitigation: explicitly scoped as a known limitation per the confirmed decision; no data cleanup is in scope for this change.
- **[Risk] Deleting `/import-export` breaks any external bookmark/link to that URL** → Mitigation: acceptable per explicit customer request to remove the page entirely; no redirect is required since the route simply should not exist.

## Migration Plan

1. Extract shared components (non-breaking, additive) — `apps/web/src/components/import-export/*`.
2. Add import/export modal + header button to each of the 4 pages, wired to the newly extracted components — additive, old `/import-export` page still works in parallel during this step.
3. Add `daKeoStatus` filter end-to-end (controller → service; builder unchanged) and the export modal toggle for yard-moves.
4. Remove `RolesGuard` from `export.controller.ts` and `import.controller.ts`.
5. Delete `apps/web/src/app/(authenticated)/import-export/page.tsx` and its nav-sidebar entry.

Steps 1-3 can ship independently of step 5; step 4 should land alongside or after step 2 (per-page buttons should not go live pointing at endpoints that still 403 non-ADMIN callers). No database migration, so no rollback beyond reverting commits — nothing is destructive at the data layer.

## Open Questions

None outstanding — all ambiguous points (role scope, UI placement, filter semantics, filter scope) were resolved with the user during exploration prior to this design.
