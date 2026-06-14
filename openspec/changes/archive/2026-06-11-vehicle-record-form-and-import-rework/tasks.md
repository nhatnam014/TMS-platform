## 1. Backend — Import Service: Driver Upsert

- [x] 1.1 In `import.service.ts`, add a private `findOrCreateDriver(fullName, phone)` method that does exact match on `(fullName, phone)` and creates a new Driver (status ACTIVE, no vehicleId) if not found
- [x] 1.2 In `importVehicles()`, before creating each VehicleRecord (execute path), call `findOrCreateDriver` when `tenTaiXe` or `sdt` is non-empty

## 2. Backend — Import Service: Two-Phase Vehicle Conflict Flow

- [x] 2.1 Add a private `detectVehicleConflict(bienSo, row)` method that looks up Vehicle by licensePlate and returns a diff object (changed fields only) or null if no conflict
- [x] 2.2 Refactor `importVehicles()` to accept a `confirm: boolean` parameter (derived from `?confirm=true` query param in the controller)
- [x] 2.3 When `confirm = false` (preview mode): parse all rows, collect conflicts and `toCreate` count, return `{ toCreate, conflicts, errors }` without writing anything
- [x] 2.4 When `confirm = true` (execute mode): run driver findOrCreate, update conflicting vehicles (overwrite vehicleType + compliance dates), then create VehicleRecord/VehicleRecordMooc rows as before
- [x] 2.5 Update `import.controller.ts` to pass the `confirm` flag (from query param) to `importVehicles()`
- [x] 2.6 Update the `ImportResult` shared type (or add a `VehicleImportPreviewResult` type) to represent the preview response shape `{ toCreate, conflicts, errors }`

## 3. Frontend — Vehicle Records Form: Driver Dropdown

- [x] 3.1 In `vehicle-records/page.tsx`, add a `drivers` state and fetch `GET /api/drivers` when the create or edit modal opens
- [x] 3.2 Add a `selectedDriverId` state (not sent to API) to track the active dropdown selection
- [x] 3.3 Render a `<select>` dropdown in the Tài xế section listing all drivers as `"{fullName} — {phone}"` with a blank default option
- [x] 3.4 On driver selection change: update `form.tenTaiXe` and `form.sdt` from the selected driver's data and set `selectedDriverId`
- [x] 3.5 When `selectedDriverId` is set, render `tenTaiXe` and `sdt` inputs as `disabled`; when no driver is selected, render them as enabled
- [x] 3.6 In `openEdit()`, attempt to pre-select a driver by matching `record.tenTaiXe + record.sdt` against the fetched drivers list; set `selectedDriverId` if found

## 4. Frontend — Vehicle Records Form: Vehicle Dropdown

- [x] 4.1 Add a `vehicles` state and fetch `GET /api/vehicles` when the create or edit modal opens
- [x] 4.2 Add a `selectedVehicleId` state to track the active dropdown selection
- [x] 4.3 Render a `<select>` dropdown in the Thông tin xe section listing all vehicles as `"{licensePlate} — {vehicleType}"` with a blank default option
- [x] 4.4 On vehicle selection change: update `form.loaiXe`, `form.bienSo`, `form.hanDangKiem`, `form.hanBaoHiem`, `form.hanCaVet` from the selected vehicle's data (null dates → empty string); set `selectedVehicleId`
- [x] 4.5 When `selectedVehicleId` is set, render the five vehicle fields as `disabled`; when no vehicle is selected, render them as enabled
- [x] 4.6 In `openEdit()`, attempt to pre-select a vehicle by matching `record.bienSo` against `vehicle.licensePlate`; set `selectedVehicleId` if found
- [x] 4.7 Reset `selectedDriverId` and `selectedVehicleId` to null when the create modal is opened (`openCreate()`)

## 5. Frontend — Import Page: Two-Phase Conflict Flow

- [x] 5.1 In the import-export page (`apps/web/src/app/(authenticated)/import-export/page.tsx`), update the quản-lý-xe upload handler to first call `POST /api/import/vehicles` (no `?confirm=true`) and store the preview response
- [x] 5.2 If `conflicts.length > 0`, display a conflict confirmation dialog listing each conflicting vehicle and its field-level diff (current vs incoming values)
- [x] 5.3 The dialog SHALL have two buttons: "Huỷ" (abort, no further request) and "Xác nhận & Import" (proceed to execute)
- [x] 5.4 If `conflicts.length === 0` and `errors.length === 0`, automatically proceed to execute (call `POST /api/import/vehicles?confirm=true`) without showing the dialog
- [x] 5.5 On user confirmation ("Xác nhận & Import"): call `POST /api/import/vehicles?confirm=true` with the same file and display the final `{ imported, warnings, errors }` result
- [x] 5.6 On "Huỷ": close the dialog and reset the upload input; show no success/error toast

## 6. Type Definitions

- [x] 6.1 In `@tms/shared`, add or update the `ImportResult` / preview type to include `VehicleImportPreviewResult = { toCreate: number; conflicts: VehicleConflictEntry[]; errors: string[] }`
- [x] 6.2 Define `VehicleConflictEntry = { licensePlate: string; fields: Record<string, { current: unknown; incoming: unknown }> }` in shared types

## 7. Verification

- [x] 7.1 Run `npm run type-check` from the workspace root and fix any TypeScript errors
- [x] 7.2 Run `npm run lint` from the workspace root and fix any lint errors
- [ ] 7.3 Manually test create form: select driver → fields lock; re-select → overwrites; no driver selected → fields editable
- [ ] 7.4 Manually test create form: select vehicle → five fields lock; re-select → overwrites; no vehicle selected → editable
- [ ] 7.5 Manually test import with a file containing a new bienSo → preview shows 0 conflicts → auto-executes → records created
- [ ] 7.6 Manually test import with a file containing an existing bienSo with changed dates → preview shows conflict dialog → Confirm → vehicle updated + records created
- [ ] 7.7 Manually test import conflict dialog Cancel → no data written
