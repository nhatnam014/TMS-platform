## Why

The "Lệnh bãi" (yard move) module was recently rebuilt to track flat trip records (date, GPS, driver, truck, mooc, booking, container, notes, hauled marker) instead of the old zone-shuttle workflow. The business now wants the user-facing name to read "Tiến độ vận tải" (transport progress) everywhere this module appears — the nav menu, the CRUD page, the import/export section, and the Excel file itself — to better match how staff refer to this tracking sheet day to day.

## What Changes

- Rename the nav sidebar label from "Lệnh bãi" to "Tiến độ vận tải".
- Rename all user-facing strings on the `/yard-moves` CRUD page: page title, create/edit modal titles, submit button text, success/error toast messages, and the delete confirmation prompt.
- Rename the import/export page (`/import-export`) section copy: the "Nhập lệnh bãi" upload section title/description and the "Xuất lệnh bãi" download section title/description.
- **BREAKING**: Rename the downloaded/uploaded Excel file name from `lenh-bai.xlsx` to `tien-do-van-tai.xlsx` (frontend download button label/filename and backend `Content-Disposition` header). Any external process or saved bookmark expecting the literal `lenh-bai.xlsx` filename will see the new name.
- Rename the in-file Excel branding: the worksheet tab name (`"lệnh bãi"` → `"tiến độ vận tải"`) and the branded title block printed inside the exported sheet (`"LỆNH BÃI"` → `"TIẾN ĐỘ VẬN TẢI"`).
- Rename the Vietnamese audit-log summary text produced on Excel-import updates (visible to ADMIN users on the Audit Logs page) from "... cập nhật lệnh bãi ..." to "... cập nhật tiến độ vận tải ...".

No database fields, API routes, request/response shapes, entity names, or internal file/module names (`yard-move`, `lenh-bai.builder.ts`, `lenh-bai.parser.ts`, `/api/export/yard-moves`, `/api/import/yard-moves`) change. The Excel column headers (STT, NGÀY, GPS, FULL NAME, TRUCK, MOOC, BOOKING, CONTAINER, GHI CHÚ, ĐÃ KÉO, ID) and the import parser's column-matching logic are unaffected — the parser already locates the header row by scanning for "stt" and never reads the sheet name, worksheet title, or branded header text, so this rename cannot break round-trip import of a previously-exported file.

## Capabilities

### New Capabilities

- `yard-move-display-name`: The display name "Tiến độ vận tải" used for the yard-moves module across the nav menu, the CRUD page, the import/export section, and the exported Excel file. Scoped narrowly to the display-name requirement only, not the full interaction flow (see note below).

### Modified Capabilities

(none — the existing `openspec/specs/yard-move-interactions/spec.md` baseline predates the `yard-move-redesign` change (completed but not yet archived) and still describes the old zone/status workflow, not the present flat-record UI. It is not a usable baseline for a MODIFIED-requirements delta: copying its stale requirement blocks forward would misrepresent current behavior, and that archival gap is unrelated to this rename. No `yard-move-excel-export`/`yard-move-excel-import` capability specs exist yet either, for the same reason. This change is captured as a new, narrowly-scoped capability instead.)

## Impact

- `apps/web/src/components/nav-sidebar.tsx` — nav label text
- `apps/web/src/app/(authenticated)/yard-moves/page.tsx` — page title, modal titles, button text, toasts, delete confirmation
- `apps/web/src/app/(authenticated)/import-export/page.tsx` — upload/download section titles, descriptions, download button label, download filename
- `apps/api/src/modules/export/builders/lenh-bai.builder.ts` — worksheet tab name, branded header title text
- `apps/api/src/modules/export/export.controller.ts` — `Content-Disposition` filename for the yard-moves export endpoint
- `apps/api/src/modules/import/import.service.ts` — Vietnamese audit-log summary string on yard-move Excel-import updates
- No database migration, no API contract change, no `@tms/shared` type change
