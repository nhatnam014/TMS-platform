## 1. Update Parser

- [x] 1.1 Update `ParsedVehicleRow` interface in `quanly-xe.parser.ts` → rename to `ParsedVehicleRecordRow` with fields matching `VehicleRecord`: `tenTaiXe`, `sdt`, `loaiXe`, `bienSo`, `hanDangKiem`, `hanBaoHiem`, `hanCaVet`, and mooc fields `soMooc`, `moocHanDangKiem`, `moocHanBaoHiem`, `moocHanCaVet`; row types `"record" | "mooc_continuation" | "skip"`
- [x] 1.2 Add `HAN_CA_VET` column lookup in `parseQuanLyXe()` using candidates: `"hạn cà vẹt"`, `"han ca vet"`, `"cà vẹt xe"`
- [x] 1.3 Add `HAN_CA_VET_MOOC` column lookup using candidates: `"hạn cà vẹt mooc"`, `"han ca vet mooc"`, `"cà vẹt mooc"`
- [x] 1.4 Update row classification logic: STT non-empty → `"record"`; STT empty + soMooc non-empty → `"mooc_continuation"`; all-empty row → `"skip"` (no push)
- [x] 1.5 Extract `hanCaVet` for vehicle and `moocHanCaVet` for mooc in each parsed row and include in returned objects

## 2. Rewrite Import Service

- [x] 2.1 In `import.service.ts`, replace the body of `importVehicles()` to use `prisma.vehicleRecord.create()` instead of `Vehicle`/`Driver`/`Trailer` upserts
- [x] 2.2 Track `currentRecordId: string | null` in the row loop; set it after each `"record"` row creation; use it to link `"mooc_continuation"` rows
- [x] 2.3 For `"record"` rows: call `prisma.vehicleRecord.create({ data: { tenTaiXe, sdt, loaiXe, bienSo, hanDangKiem, hanBaoHiem, hanCaVet, moocs: soMooc ? { create: [{ soMooc, hanDangKiem: moocHanDangKiem, hanBaoHiem: moocHanBaoHiem, hanCaVet: moocHanCaVet }] } : undefined } })` and increment `imported`
- [x] 2.4 For `"mooc_continuation"` rows: if `currentRecordId` is null, push to `errors` and skip; otherwise call `prisma.vehicleRecordMooc.create({ data: { vehicleRecordId: currentRecordId, soMooc, hanDangKiem, hanBaoHiem, hanCaVet } })`
- [x] 2.5 Wrap `auditService.log()` in a try/catch that logs to `console.error` but does not throw — audit failure must not surface as HTTP 500
- [x] 2.6 Remove all references to `Vehicle`, `Driver`, `Trailer`, and `VehicleTrailer` Prisma models from `importVehicles()`

## 3. Validation

- [x] 3.1 Run `pnpm --filter @tms/api build` and confirm zero TypeScript errors
- [ ] 3.2 Start the API in dev mode, upload the "TMS template - VIET CODE.xlsx" file via the import-export page, and confirm HTTP 200 with `imported > 0`
- [ ] 3.3 Open `/vehicle-records` page and confirm the imported rows appear with correct field values including `hanCaVet` where applicable
- [ ] 3.4 Upload the same file a second time and confirm a second set of records is created (no uniqueness error)
