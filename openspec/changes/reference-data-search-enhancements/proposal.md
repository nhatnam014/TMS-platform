## Why

Reference data pages (yard-moves, customers, carriers, locations, service-types, container-sizes, audit-logs) were given pagination in the previous change but still lack server-side search and date-range filtering. The cost-templates table also has a formatting bug where `Decimal` values from Prisma are serialized as strings, causing `toLocaleString("vi-VN")` to no-op.

## What Changes

- **yard-moves**: Add server-side search across `containerNumber`, `fromZone`, `toZone`, and `location.name`; add `dateFrom`/`dateTo` filter on `createdAt`; `status` filter already exists (expose in UI)
- **customers**: Expand existing search to also match `phone`, `email`, `taxCode` fields
- **carriers**: Expand existing search to also match `phone` field
- **locations**: Expand existing search to also match `address` field
- **service-types**: Add search by `code`/`description` and `isActive` status filter
- **container-sizes**: Add search by `code`/`name` and `isActive` status filter
- **cost-templates**: Fix amount display bug — cast `Decimal`-serialized string to `Number` before `toLocaleString`
- **audit-logs**: Add `dateFrom`/`dateTo` filter UI (backend already supports it)
- **shared**: Extend `YardMoveFilters` with `search?`, `dateFrom?`, `dateTo?`

## Capabilities

### New Capabilities

- `yard-move-search`: Search + date-range + status filter for yard-moves list
- `reference-data-search`: Search + status filter for service-types and container-sizes

### Modified Capabilities

- `yard-move`: `YardMoveFilters` gains `search`, `dateFrom`, `dateTo` fields
- `carrier-crud`: `findAll` OR clause gains `phone`
- `customer-crud`: `findAll` OR clause gains `phone`, `email`, `taxCode`
- `location-crud`: `findAll` OR clause gains `address`
- `audit-log-viewer`: Add date-range filter inputs to frontend
- `reference-data`: Fix cost-templates `defaultAmount` display formatting

## Impact

- `packages/shared/src/index.ts` — `YardMoveFilters` interface
- `apps/api/src/modules/yard-move/yard-move.service.ts` and `.controller.ts`
- `apps/api/src/modules/customer/customer.service.ts` and `.controller.ts`
- `apps/api/src/modules/carrier/carrier.service.ts` and `.controller.ts`
- `apps/api/src/modules/location/location.service.ts` and `.controller.ts`
- `apps/api/src/modules/service-types/service-types.service.ts` and `.controller.ts`
- `apps/api/src/modules/container-sizes/container-sizes.service.ts` and `.controller.ts`
- `apps/web/src/app/(authenticated)/yard-moves/page.tsx`
- `apps/web/src/app/(authenticated)/service-types/page.tsx`
- `apps/web/src/app/(authenticated)/container-sizes/page.tsx`
- `apps/web/src/app/(authenticated)/cost-templates/page.tsx`
- `apps/web/src/app/(authenticated)/audit-logs/page.tsx`
