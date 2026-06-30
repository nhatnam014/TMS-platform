## Context

This is a pure display-string rename touching ~6 files across the existing yard-moves feature (frontend pages, Excel export builder, export controller, import audit-log message). No data model, API contract, or interaction flow changes. No new dependency, no migration, no cross-service coordination — included here only because the schema requires `design.md` before `tasks.md` can unblock.

## Goals / Non-Goals

**Goals:**
- Replace every user-visible occurrence of "Lệnh bãi" / "lệnh bãi" / "LỆNH BÃI" with "Tiến độ vận tải" / "tiến độ vận tải" / "TIẾN ĐỘ VẬN TẢI" (case-matched to context: page titles/headers use sentence case, the Excel branded title block uses uppercase, matching the existing pattern for that block).
- Rename the downloaded/uploaded Excel filename from `lenh-bai.xlsx` to `tien-do-van-tai.xlsx`, keeping it in sync between the frontend `DownloadButton` (which sets `a.download`, the value actually used by the browser to name the saved file) and the backend `Content-Disposition` header (kept in sync for direct API consumers, even though the frontend fetch+blob flow doesn't read it).
- Keep the rename strictly additive/cosmetic: same component structure, same control flow, same data shapes — only string literals change.

**Non-Goals:**
- No change to routes (`/yard-moves`, `/api/export/yard-moves`, `/api/import/yard-moves`), file/module names (`lenh-bai.builder.ts`, `lenh-bai.parser.ts`, `YardMove` entity), Excel column headers, or the import parser's column-matching logic.
- No change to Swagger/`@ApiOperation` doc strings (internal/developer-facing, not part of the requested user-facing rename scope per explicit user decision during exploration).
- No archival of the stale `yard-move-interactions` spec or the unarchived `yard-move-redesign` change — that gap predates this change and is out of scope.

## Decisions

- **New Excel filename slug — `tien-do-van-tai.xlsx`**: follows this codebase's existing convention of unaccented, hyphenated Vietnamese for exported filenames (`ke-hoach-xe.xlsx`, `quan-ly-xe.xlsx`, `bao-duong-xe.xlsx`), rather than keeping the old `lenh-bai.xlsx` slug or using an English name. Alternative considered: leave the filename unchanged and only rename in-app labels — rejected per explicit user decision to keep the downloaded file name consistent with the new display name.
- **Sheet tab name also renamed**: `wb.addWorksheet("lệnh bãi")` → `wb.addWorksheet("tiến độ vận tải")`. Safe because `parseLenhBai` always reads `workbook.worksheets[0]` by position, never by name — confirmed by reading `lenh-bai.parser.ts`.
- **Audit-log summary string included**: `import.service.ts`'s Excel-import update summary ("Excel import cập nhật lệnh bãi (...)") is rendered verbatim on the Audit Logs page (`log.summary`) for ADMIN users, so it counts as user-facing display text and is in scope per explicit user confirmation, even though it sits in backend code.
- **No spec deltas**: see proposal's Capabilities section — no existing capability spec is a usable baseline (the relevant one is stale pre-redesign content pending an unrelated archive), and this change alters no testable system behavior, only string literals.

## Risks / Trade-offs

- [Renaming the download filename is technically a breaking change for anyone who has automation depending on the literal `lenh-bai.xlsx` name] → Low risk: this is an internal admin tool, the file is fetched on-demand via a UI button, not a stable integration contract; flagged explicitly as **BREAKING** in the proposal.
- [Missing an occurrence of the old string would leave inconsistent labeling] → Mitigated by the exhaustive `grep -rni "lệnh bãi\|lenh bai"` sweep performed during exploration, which is the complete list driving `tasks.md`.
