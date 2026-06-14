## 1. BFF Proxy Error Handling

- [x] 1.1 In `apps/web/src/app/api/[...path]/route.ts`, wrap the entire body of `proxyRequest` (after the token check) in a try-catch that catches any thrown error, logs it with `console.error`, and returns `NextResponse.json({ message: "Service unavailable" }, { status: 502 })`

## 2. Import Service Error Handling

- [x] 2.1 In `apps/api/src/modules/import/import.service.ts`, wrap the `workbook.xlsx.load(buffer ...)` and `parseQuanLyXe(workbook)` calls in `importVehicles` in a try-catch that re-throws `new BadRequestException("File không hợp lệ hoặc không đúng định dạng .xlsx")`
- [x] 2.2 In `apps/api/src/modules/import/import.service.ts`, do the same for `importTripPlans`: wrap `workbook.xlsx.load` and `parseKeHoachXe(workbook, warnings)` in a try-catch with the same `BadRequestException` message

## 3. Verification

- [x] 3.1 Run `pnpm type-check` from the workspace root and confirm no TypeScript errors
- [ ] 3.2 Start `pnpm dev` and verify both servers come up; confirm that uploading a valid `.xlsx` file to `/import-export` still returns success
- [ ] 3.3 Confirm that uploading a non-xlsx file (e.g., a `.txt` or `.png`) to `POST /api/import/vehicles` now returns 400 instead of 500
