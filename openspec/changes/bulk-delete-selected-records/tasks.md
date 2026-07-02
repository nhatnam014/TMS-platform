## 1. Shared UI components (packages/ui)

- [x] 1.1 Add a `useRowSelection(ids: string[])` hook managing a `Set<string>` of selected ids with `toggle(id)`, `toggleAll()`, `clear()`, and `isSelected(id)`
- [x] 1.2 Add a `SelectionCheckbox` cell component for use in table headers (select-all) and rows
- [x] 1.3 Add a `BulkActionBar` component showing "Delete selected (N)" that only renders when `selectedCount > 0`
- [x] 1.4 Add a `ConfirmDialog` component (`title`, `message`, `onConfirm`, `onCancel`, `danger`) for the bulk-delete confirmation
- [x] 1.5 Export all new components/hooks from `packages/ui/src/index.ts`

## 2. Backend: shared bulk-delete DTO pattern

- [x] 2.1 Define a `BulkDeleteDto { ids: string[] }` with `class-validator` (`@IsArray`, `@ArrayNotEmpty`, `@IsString({ each: true })`) following the existing per-module `dto/` convention, added to each of the 8 resource modules' `dto/` folders

## 3. Backend: trip-plan bulk-delete

- [x] 3.1 Add `bulkDelete(ids: string[])` to `trip-plan.service.ts`: loop ids inside one `$transaction`, hard-delete each, call `AuditService.log` with `action: "DELETE"` per deleted record
- [x] 3.2 Add `@Post("bulk-delete")` route to `trip-plan.controller.ts` (same `JwtAuthGuard` as existing routes), returning `{ deleted, skipped }`

## 4. Backend: vehicle-record bulk-delete

- [x] 4.1 Add `bulkDelete(ids: string[])` to `vehicle-record.service.ts`, mirroring its existing single-delete `$transaction` + `AuditService.log` pattern
- [x] 4.2 Add `@Post("bulk-delete")` route to `vehicle-record.controller.ts`, returning `{ deleted, skipped }`

## 5. Backend: service-types bulk-delete

- [x] 5.1 Add `bulkDelete(ids: string[])` to `service-types.service.ts`: for each id, run the existing trip-plan-reference count check used by `remove()`; skip (with reason) if referenced, otherwise delete
- [x] 5.2 Add `@Post("bulk-delete")` route to `service-types.controller.ts`, returning `{ deleted, skipped }`

## 6. Backend: container-sizes bulk-delete

- [x] 6.1 Add `bulkDelete(ids: string[])` to `container-sizes.service.ts`, mirroring its existing `remove()` reference-count guard
- [x] 6.2 Add `@Post("bulk-delete")` route to `container-sizes.controller.ts`, returning `{ deleted, skipped }`

## 7. Backend: cost-templates bulk-delete

- [x] 7.1 Add `bulkDelete(ids: string[])` to `cost-templates.service.ts`, mirroring its existing `remove()` behavior
- [x] 7.2 Add `@Post("bulk-delete")` route to `cost-templates.controller.ts`, returning `{ deleted, skipped }`

## 8. Backend: yard-move bulk-delete (new hard-delete path)

- [x] 8.1 Add `bulkDelete(ids: string[])` to `yard-move.service.ts` performing a true `prisma.yardMove.delete(...)` per id inside one `$transaction`, with `AuditService.log` per deleted record — leave the existing `update(id, { isActive: false })` deactivate method untouched
- [x] 8.2 Add `@Post("bulk-delete")` route to `yard-move.controller.ts` (same guard as its existing `@Patch(":id")`), returning `{ deleted, skipped }`

## 9. Backend: customer bulk-delete (new hard-delete path + FK guard)

- [x] 9.1 Add a `countTripPlanReferences(id)` helper (or inline count) to `customer.service.ts` checking `TripPlan.customerId`
- [x] 9.2 Add `bulkDelete(ids: string[])` performing `prisma.customer.delete(...)` per unreferenced id inside one `$transaction`, skipping referenced ids with a reason, calling `AuditService.log` per deleted record — leave the existing deactivate flow untouched
- [x] 9.3 Add `@Post("bulk-delete")` route to `customer.controller.ts`, returning `{ deleted, skipped }`

## 10. Backend: carrier bulk-delete (new hard-delete path + FK guard)

- [x] 10.1 Add a `countTripPlanReferences(id)` helper (or inline count) to `carrier.service.ts` checking `TripPlan.carrierId`
- [x] 10.2 Add `bulkDelete(ids: string[])` performing `prisma.carrier.delete(...)` per unreferenced id inside one `$transaction`, skipping referenced ids with a reason, calling `AuditService.log` per deleted record — leave the existing deactivate flow untouched
- [x] 10.3 Add `@Post("bulk-delete")` route to `carrier.controller.ts`, returning `{ deleted, skipped }`

## 11. Backend: location bulk-delete (new hard-delete path)

- [x] 11.1 Add `bulkDelete(ids: string[])` to `location.service.ts` performing `prisma.location.delete(...)` per id inside one `$transaction`, with `AuditService.log` per deleted record — leave the existing deactivate flow untouched
- [x] 11.2 Add `@Post("bulk-delete")` route to `location.controller.ts`, returning `{ deleted, skipped }`

## 12. Frontend: trip-plans page

- [x] 12.1 Add a checkbox column wired to `useRowSelection` on the trip plans table
- [x] 12.2 Render `BulkActionBar` + `ConfirmDialog`, calling `POST /api/trip-plans/bulk-delete` on confirm and showing the deleted/skipped summary
- [x] 12.3 Clear selection on pagination/filter change and after bulk-delete completes; refetch the list

## 13. Frontend: vehicle-records page

- [x] 13.1 Add a checkbox column wired to `useRowSelection` on the vehicle records table
- [x] 13.2 Render `BulkActionBar` + `ConfirmDialog`, calling `POST /api/vehicle-records/bulk-delete` on confirm and showing the deleted/skipped summary
- [x] 13.3 Clear selection on pagination/filter change and after bulk-delete completes; refetch the list

## 14. Frontend: service-types page

- [x] 14.1 Add a checkbox column wired to `useRowSelection` on the service types table
- [x] 14.2 Render `BulkActionBar` + `ConfirmDialog`, calling `POST /api/service-types/bulk-delete` on confirm and showing the deleted/skipped summary (surfacing "referenced by trip plans" skip reasons)
- [x] 14.3 Clear selection on filter change and after bulk-delete completes; refetch the list

## 15. Frontend: container-sizes page

- [x] 15.1 Add a checkbox column wired to `useRowSelection` on the container sizes table
- [x] 15.2 Render `BulkActionBar` + `ConfirmDialog`, calling `POST /api/container-sizes/bulk-delete` on confirm and showing the deleted/skipped summary
- [x] 15.3 Clear selection on filter change and after bulk-delete completes; refetch the list

## 16. Frontend: cost-templates page

- [x] 16.1 Add a checkbox column wired to `useRowSelection` on the cost templates table
- [x] 16.2 Render `BulkActionBar` + `ConfirmDialog`, calling `POST /api/cost-templates/bulk-delete` on confirm and showing the deleted/skipped summary
- [x] 16.3 Clear selection on filter change and after bulk-delete completes; refetch the list

## 17. Frontend: yard-moves page

- [x] 17.1 Add a checkbox column wired to `useRowSelection` on the yard moves table
- [x] 17.2 Render `BulkActionBar` + `ConfirmDialog` (message makes clear this is a permanent delete, distinct from the existing per-row deactivate action), calling `POST /api/yard-moves/bulk-delete` on confirm
- [x] 17.3 Clear selection on filter change and after bulk-delete completes; refetch the list

## 18. Frontend: customers page

- [x] 18.1 Add a checkbox column wired to `useRowSelection` on the customers table
- [x] 18.2 Render `BulkActionBar` + `ConfirmDialog` (message makes clear this is a permanent delete, distinct from the existing per-row deactivate action), calling `POST /api/customers/bulk-delete` on confirm and showing the deleted/skipped summary (surfacing "referenced by trip plans" skip reasons)
- [x] 18.3 Clear selection on filter change and after bulk-delete completes; refetch the list

## 19. Frontend: carriers page

- [x] 19.1 Add a checkbox column wired to `useRowSelection` on the carriers table
- [x] 19.2 Render `BulkActionBar` + `ConfirmDialog` (message makes clear this is a permanent delete, distinct from the existing per-row deactivate action), calling `POST /api/carriers/bulk-delete` on confirm and showing the deleted/skipped summary (surfacing "referenced by trip plans" skip reasons)
- [x] 19.3 Clear selection on filter change and after bulk-delete completes; refetch the list

## 20. Frontend: locations page

- [x] 20.1 Add a checkbox column wired to `useRowSelection` on the locations table
- [x] 20.2 Render `BulkActionBar` + `ConfirmDialog` (message makes clear this is a permanent delete, distinct from the existing per-row deactivate action), calling `POST /api/locations/bulk-delete` on confirm
- [x] 20.3 Clear selection on filter change and after bulk-delete completes; refetch the list

## 21. Verification

- [x] 21.1 Run `pnpm type-check` and fix any errors
- [x] 21.2 Run `pnpm lint` and fix any errors
- [x] 21.3 Run `pnpm test` and fix any failures
- [ ] 21.4 Manually verify each of the 8 pages: select rows, confirm dialog appears with correct count, delete removes rows, partial-success summary shows for customer/carrier/service-types/container-sizes when a referenced record is included
- [ ] 21.5 Manually verify existing single-record delete/deactivate flows on all 8 pages are unaffected
