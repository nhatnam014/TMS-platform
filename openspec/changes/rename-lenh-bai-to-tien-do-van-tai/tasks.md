## 1. Nav menu

- [x] 1.1 In `apps/web/src/components/nav-sidebar.tsx`, change the `/yard-moves` nav item label from `"Lệnh bãi"` to `"Tiến độ vận tải"`.

## 2. Yard-moves CRUD page

- [x] 2.1 In `apps/web/src/app/(authenticated)/yard-moves/page.tsx`, change the page `<h1>` text from `"Lệnh bãi"` to `"Tiến độ vận tải"`.
- [x] 2.2 In the same file, change the create-modal title from `"Tạo lệnh bãi mới"` to `"Tạo tiến độ vận tải mới"`, and the edit-modal title from `"Sửa lệnh bãi"` to `"Sửa tiến độ vận tải"`.
- [x] 2.3 Change the create-form submit button text from `"Tạo lệnh bãi"` to `"Tạo tiến độ vận tải"` (keep the `"Đang tạo..."` submitting state unchanged).
- [x] 2.4 Update the toast messages: create success `"Tạo lệnh bãi thành công"` → `"Tạo tiến độ vận tải thành công"`; update success `"Cập nhật lệnh bãi thành công"` → `"Cập nhật tiến độ vận tải thành công"`; delete success `"Đã xoá lệnh bãi"` → `"Đã xoá tiến độ vận tải"`; delete error fallback `"Lỗi xoá lệnh bãi"` → `"Lỗi xoá tiến độ vận tải"`.
- [x] 2.5 Update the delete confirmation prompt `"Bạn có chắc muốn xoá lệnh bãi này?"` → `"Bạn có chắc muốn xoá tiến độ vận tải này?"`.

## 3. Import/export page

- [x] 3.1 In `apps/web/src/app/(authenticated)/import-export/page.tsx`, change the upload section `title="Nhập lệnh bãi"` → `"Nhập tiến độ vận tải"` and its description `"Tải lên sheet 'lệnh bãi'. Hàng có ID → cập nhật; hàng không có ID → tạo mới."` → `"Tải lên sheet 'tiến độ vận tải'. Hàng có ID → cập nhật; hàng không có ID → tạo mới."`.
- [x] 3.2 Change the export section heading `"Xuất lệnh bãi"` → `"Xuất tiến độ vận tải"` and its description `"Xuất danh sách lệnh bãi ra file Excel."` → `"Xuất danh sách tiến độ vận tải ra file Excel."`.
- [x] 3.3 Change the download button `label="Tải xuống lenh-bai.xlsx"` → `"Tải xuống tien-do-van-tai.xlsx"` and `filename="lenh-bai.xlsx"` → `"tien-do-van-tai.xlsx"` (this is the name the browser saves the file as, via `a.download`).

## 4. Excel export builder

- [x] 4.1 In `apps/api/src/modules/export/builders/lenh-bai.builder.ts`, change `wb.addWorksheet("lệnh bãi")` → `wb.addWorksheet("tiến độ vận tải")`.
- [x] 4.2 Change `addBrandedHeader(ws, wb, "LỆNH BÃI")` → `addBrandedHeader(ws, wb, "TIẾN ĐỘ VẬN TẢI")`.
- [x] 4.3 Confirm `HEADERS` (STT, NGÀY, GPS, FULL NAME, TRUCK, MOOC, BOOKING, CONTAINER, GHI CHÚ, ĐÃ KÉO, ID) are left untouched — these are read by `apps/api/src/modules/import/parsers/lenh-bai.parser.ts` by column-header text, not by sheet name or title.

## 5. Export controller filename

- [x] 5.1 In `apps/api/src/modules/export/export.controller.ts`, change the yard-moves export endpoint's `Content-Disposition` header from `'attachment; filename="lenh-bai.xlsx"'` to `'attachment; filename="tien-do-van-tai.xlsx"'`.

## 6. Audit log summary

- [x] 6.1 In `apps/api/src/modules/import/import.service.ts` (around the yard-moves Excel-import update path, ~line 802), change the audit summary template from `` `Excel import cập nhật lệnh bãi (${identifier}): ...` `` to `` `Excel import cập nhật tiến độ vận tải (${identifier}): ...` ``.

## 7. Verification

- [x] 7.1 Re-run `grep -rni "lệnh bãi\|lenh bai" --include="*.ts" --include="*.tsx" .` (excluding `node_modules`) and confirm the only remaining matches are the intentionally out-of-scope ones: the `/yard-moves` route comment/identifiers, `lenh-bai.builder.ts`/`lenh-bai.parser.ts` file names, and the `@ApiOperation` Swagger summary strings in `yard-move.controller.ts`, `export.controller.ts`, and `import.controller.ts`.
- [x] 7.2 Started the real dev API (`:4000`) and web app (`:3000`) against the existing dev DB, logged in as `admin` via the actual `/api/auth/login` flow, and fetched `/yard-moves` and `/import-export` as that authenticated session: `/yard-moves` HTML contains "Tiến độ vận tải" ×2 (nav + page title) and zero occurrences of "Lệnh bãi"/"lệnh bãi"; `/import-export` HTML contains "Tiến độ vận tải"/"tiến độ vận tải" ×5 (nav + both section headings/descriptions) and zero old-string occurrences. (No headless-browser tool was available in this environment, so this was verified via authenticated HTTP fetch of the real rendered page output rather than a screenshot — content is equivalent for confirming text rendering.)
- [x] 7.3 Downloaded the real yard-moves Excel export through the authenticated session (`GET /api/export/yard-moves`): response header `content-disposition: attachment; filename="tien-do-van-tai.xlsx"`; unzipped the file and confirmed `xl/workbook.xml` sheet name is `tiến độ vận tải` and `xl/sharedStrings.xml` contains the branded title `TIẾN ĐỘ VẬN TẢI`.
- [x] 7.4 Re-uploaded that exact downloaded file to `POST /api/import/yard-moves?confirm=false`: response `{"toCreate":0,"toUpdate":37,"warnings":[],"errors":[]}` — matches the 37 existing yard_moves rows with zero warnings/errors, confirming the column-header-based parser round-trips correctly against the renamed sheet/title.
- [ ] 7.5 As ADMIN, trigger an Excel-import update and confirm the Audit Logs page shows the new "tiến độ vận tải" wording in the summary. (Not executed live — would require mutating real dev data with no existing diff to trigger; the code path was verified by direct read of the edited line in `import.service.ts`. Manual follow-up recommended if/when a real data change occurs.)
- [x] 7.6 No existing test references `yard-move`/`lenh-bai` (confirmed by search). `pnpm type-check` shows zero errors in any of the 6 edited files (the only failures are pre-existing decorator-metadata errors in unrelated `customer`/`vehicle-record` modules, untouched by this change). `pnpm lint` could not run in this sandbox — `eslint` binary is not installed for `@tms/api`, and `@tms/web`'s `next lint` prompts for first-time interactive ESLint setup (no `.eslintrc` committed) — both are pre-existing environment gaps unrelated to this change, not introduced by it.
