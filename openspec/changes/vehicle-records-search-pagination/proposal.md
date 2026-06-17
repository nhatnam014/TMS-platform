## Why

The vehicle records list currently fetches all records at once with no filtering or pagination, making it unusable as data grows. Users need to quickly find records by driver name, phone, plate, vehicle type, or mooc number, and filter by upcoming expiry dates to prioritize compliance actions.

## What Changes

- **BREAKING**: `GET /vehicle-records` now returns `PaginatedResponse<VehicleRecord>` instead of a flat array
- Add `page`, `limit`, `search`, `expiryType`, `expiryScope`, `expiryFrom`, `expiryTo` query params to `GET /vehicle-records`
- Add `VehicleRecordFilters` interface to `@tms/shared`
- Backend: `findAll()` becomes `findAll(filters, pagination)` — mirrors TripPlanService pattern
- Frontend: add search bar, expiry filter controls (scope + type selectors + date range), and pagination controls to the vehicle records page
- Frontend: display logic for mooc rows — when search term matches a mooc's soMooc only, show only the matching mooc rows for that vehicle; if the vehicle itself matched (other fields), show all moocs

## Capabilities

### New Capabilities

- `vehicle-record-pagination`: Backend pagination for vehicle records list with page/limit/skip/total
- `vehicle-record-search-filter`: Search by tenTaiXe, sdt, loaiXe, bienSo, soMooc (OR across all fields); expiry date-range filter with entity scope (xe/mooc/all) and type (dangkiem/cavet/all)

### Modified Capabilities

- `vehicle-record-crud`: GET /vehicle-records response shape changes from array to PaginatedResponse

## Impact

- `packages/shared/src/index.ts`: add `VehicleRecordFilters` interface
- `apps/api/src/modules/vehicle-record/vehicle-record.service.ts`: rewrite `findAll()`
- `apps/api/src/modules/vehicle-record/vehicle-record.controller.ts`: add `@Query` params to `findAll` route
- `apps/web/src/app/(authenticated)/vehicle-records/page.tsx`: add filter/search UI, update fetch to handle paginated response, add pagination controls, add frontend mooc display filtering
