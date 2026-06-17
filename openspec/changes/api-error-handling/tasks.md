## 1. API — Global Prisma Exception Filter

- [x] 1.1 Create `apps/api/src/common/filters/prisma-exception.filter.ts` — implement `@Catch(Prisma.PrismaClientKnownRequestError, Prisma.PrismaClientUnknownRequestError)` filter:
  - P2002 → 409, message "Dữ liệu đã tồn tại"
  - P2003 → 422, message "Dữ liệu tham chiếu không hợp lệ hoặc không còn tồn tại"
  - P2025 → 404, message "Bản ghi không tồn tại"
  - P2000 → 400, message "Giá trị vượt quá độ dài cho phép"
  - Other `PrismaClientKnownRequestError` → 500, message "Lỗi cơ sở dữ liệu"
  - `PrismaClientUnknownRequestError` → 422, message "Dữ liệu không hợp lệ (lỗi cơ sở dữ liệu)" + `console.error` log
  - All responses return `{ statusCode, message }` JSON
- [x] 1.2 In `apps/api/src/main.ts`, add `import { PrismaExceptionFilter } from "./common/filters/prisma-exception.filter"` and call `app.useGlobalFilters(new PrismaExceptionFilter())` before `app.listen`

## 2. API — Location DTO: add range validation

- [x] 2.1 In `apps/api/src/modules/location/dto/create-location.dto.ts`, add `import { ..., Min, Max } from "class-validator"` and decorate `latitude` with `@Min(-90) @Max(90)` and `longitude` with `@Min(-180) @Max(180)`
- [x] 2.2 In `apps/api/src/modules/location/dto/update-location.dto.ts`, same — add `Min, Max` import and add `@Min(-90) @Max(90)` to `latitude`, `@Min(-180) @Max(180)` to `longitude`

## 3. Frontend — Locations page: numeric inputs for lat/lng

- [x] 3.1 In `apps/web/src/app/(authenticated)/locations/page.tsx`, replace the `{FIELD("Vĩ độ (latitude)", createForm.latitude, ...)}` call in the create modal with an inline `<input type="number" min="-90" max="90" step="0.000001">` that reads `createForm.latitude` and calls `setCreateForm((f) => ({ ...f, latitude: e.target.value }))`. Keep the same label/spacing style as the `FIELD` helper.
- [x] 3.2 Same replacement for `{FIELD("Kinh độ (longitude)", createForm.longitude, ...)}` in the create modal — `type="number" min="-180" max="180" step="0.000001"`
- [x] 3.3 Same replacement for the `latitude` `FIELD` in the edit modal
- [x] 3.4 Same replacement for the `longitude` `FIELD` in the edit modal

## 4. Verify

- [x] 4.1 Run `npx tsc --noEmit -p apps/api/tsconfig.json` — no errors
- [ ] 4.2 Manual: create a yard-move with a non-existent `locationId` → expect 422 toast, not 500
- [ ] 4.3 Manual: create a location with `latitude: 200` via API directly → expect 400 validation error
- [ ] 4.4 Manual: create a location with `latitude: 200` via the form → browser blocks submission inline
- [ ] 4.5 Manual: create a location with valid `latitude: 10.770976` → succeeds
