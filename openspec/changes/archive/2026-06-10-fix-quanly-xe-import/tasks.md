## 1. Fix Parser — Header Candidates

- [x] 1.1 Add `"tên tx"`, `"ten tx"` to `HO_TEN` candidates in `quanly-xe.parser.ts`
- [x] 1.2 Add `"theo xe"` as first candidate for `SO_XE` in `quanly-xe.parser.ts`
- [x] 1.3 Add `"hạn bảo hiểm"`, `"han bao hiem"` (without xe-suffix) to `HAN_BH` candidates

## 2. Fix Parser — Position-Relative Mooc Columns

- [x] 2.1 After finding `SO_MOOC` index N, derive mooc date columns by offset: `HAN_DK_MOOC = N+1`, `HAN_BH_MOOC = N+2`, `HAN_CV_MOOC = N+3`, `GHI_CHU = N+4`
- [x] 2.2 Remove the old name-based `col()` calls for `HAN_DK_MOOC`, `HAN_BH_MOOC`, `HAN_CV_MOOC`
- [x] 2.3 Add `ghiChu?: string` field to `ParsedVehicleRecordRow` interface
- [x] 2.4 Extract `ghiChu` from column N+4 for STT rows (not continuation rows)

## 3. Fix Import Service — ghiChu Persistence

- [x] 3.1 In `import.service.ts`, pass `ghiChu: row.ghiChu ?? null` to `vehicleRecord.create()` data

## 4. Fix List Ordering

- [x] 4.1 In `vehicle-record.service.ts`, change `orderBy: { createdAt: "desc" }` to `orderBy: { createdAt: "asc" }`
