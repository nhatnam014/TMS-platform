## 1. Toast Infrastructure

- [x] 1.1 Create `apps/web/src/lib/toast-context.tsx` — `Toast` interface, `ToastContext`, `ToastProvider` (with `useState<Toast[]>`, `addToast`, auto-dismiss for success via `setTimeout(3000)`, manual dismiss), and `useToast()` hook returning `{ success(msg), error(msg) }`
- [x] 1.2 Create `apps/web/src/components/toaster.tsx` — `<Toaster />` client component: fixed top-right overlay, maps `Toast[]` from context, renders each as a card (green for success, red for error) with message text and a dismiss `×` button
- [x] 1.3 Update `apps/web/src/app/layout.tsx` — import `ToastProvider` and `Toaster`, wrap `<body>` children: `<ToastProvider><Toaster />{children}</ToastProvider>`

## 2. Login Toast

- [x] 2.1 Update `apps/web/src/app/login/page.tsx` — call `useToast()`, fire `toast.success("Đăng nhập thành công")` on 2xx before `router.push`, fire `toast.error(...)` on non-2xx and on network catch (replace or supplement existing inline `setError` state)

## 3. Vehicles Page

- [x] 3.1 Update `apps/web/src/app/(authenticated)/vehicles/page.tsx` — add `useToast()`, fire success/error toasts in `handleCreate`, `handleEdit`, and `handleStatusTransition`

## 4. Drivers Page

- [x] 4.1 Update `apps/web/src/app/(authenticated)/drivers/page.tsx` — add `useToast()`, fire success/error toasts in `handleCreate`, `handleEdit`, `handleAssign`, and `handleUnassign`

## 5. Locations Page

- [x] 5.1 Update `apps/web/src/app/(authenticated)/locations/page.tsx` — add `useToast()`, fire success/error toasts in create and edit handlers

## 6. Carriers Page

- [x] 6.1 Update `apps/web/src/app/(authenticated)/carriers/page.tsx` — add `useToast()`, fire success/error toasts in create and edit handlers

## 7. Customers Page

- [x] 7.1 Update `apps/web/src/app/(authenticated)/customers/page.tsx` — add `useToast()`, fire success/error toasts in create and edit handlers

## 8. Users Page

- [x] 8.1 Update `apps/web/src/app/(authenticated)/users/page.tsx` — add `useToast()`, fire success/error toasts in create, edit, and reset-password handlers

## 9. Trip Costs Page

- [x] 9.1 Update `apps/web/src/app/(authenticated)/trip-costs/page.tsx` — add `useToast()`, fire success/error toasts in create, inline-edit, toggle-active, and delete handlers

## 10. Trip Plans Page

- [x] 10.1 Update `apps/web/src/app/(authenticated)/trip-plans/page.tsx` — add `useToast()`, fire success/error toasts in the trip create handler and the add-cost handler (both modal forms inside the page)

## 11. Vehicle Records Page

- [x] 11.1 Update `apps/web/src/app/(authenticated)/vehicle-records/page.tsx` — add `useToast()`, fire success/error toasts in create, edit, and delete handlers

## 12. Yard Moves Page

- [x] 12.1 Update `apps/web/src/app/(authenticated)/yard-moves/page.tsx` — add `useToast()`, fire success/error toasts in create, status-update, and add-cost handlers

## 13. Import/Export Page

- [x] 13.1 Update `apps/web/src/app/(authenticated)/import-export/page.tsx` — add `useToast()`, fire success/error toasts after import upload and export download operations
