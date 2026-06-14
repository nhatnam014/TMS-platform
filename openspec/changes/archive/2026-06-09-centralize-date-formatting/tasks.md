## 1. Create shared date utility

- [x] 1.1 Create `apps/web/src/lib/date-utils.ts` with `formatDate`, `formatDateTime`, and `toDateInput` functions, handling null/undefined/invalid inputs

## 2. Refactor vehicles/page.tsx

- [x] 2.1 Remove local `formatDate` function definition
- [x] 2.2 Import `formatDate` from `@/lib/date-utils` and verify all date display calls use it

## 3. Refactor vehicle-records/page.tsx

- [x] 3.1 Remove local `formatDate` function definition
- [x] 3.2 Import `formatDate` from `@/lib/date-utils` and verify all date display calls use it

## 4. Refactor users/page.tsx

- [x] 4.1 Remove local `formatDate` function definition
- [x] 4.2 Import `formatDate` from `@/lib/date-utils` and verify all date display calls use it

## 5. Refactor trip-plans/page.tsx

- [x] 5.1 Import `formatDate` from `@/lib/date-utils`
- [x] 5.2 Replace inline `new Date(trip.tripDate).toLocaleDateString("vi-VN")` calls with `formatDate`
- [x] 5.3 Replace inline `new Date(trip.documentSentDate).toLocaleDateString("vi-VN")` calls with `formatDate`

## 6. Refactor yard-moves/page.tsx

- [x] 6.1 Import `formatDate` from `@/lib/date-utils`
- [x] 6.2 Replace inline `new Date(m.date).toLocaleDateString("vi-VN")` call with `formatDate`

## 7. Refactor audit-logs/page.tsx

- [x] 7.1 Import `formatDateTime` from `@/lib/date-utils`
- [x] 7.2 Replace inline `new Date(log.createdAt).toLocaleString("vi-VN")` call with `formatDateTime`

## 8. Verify

- [x] 8.1 Run `pnpm --filter web type-check` and confirm no TypeScript errors
- [x] 8.2 Confirm no remaining `toLocaleDateString` or `toLocaleString` inline calls in page files
