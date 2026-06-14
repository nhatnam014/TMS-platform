## Why

All CRUD operations and authentication in the TMS web UI complete silently — users get no confirmation that their actions succeeded or failed. Error states are only visible inside modals (which close on success), leaving no feedback trail. Vietnamese-language toast notifications will provide clear, consistent outcome feedback across the entire application.

## What Changes

- Add a zero-dependency `ToastContext` and `useToast` hook accessible app-wide
- Add a `<Toaster />` overlay component that renders stacked, auto-dismissing toast messages in the top-right corner
- Wrap the root layout in `ToastProvider` so both the login page and authenticated pages share the same toast system
- Update `login/page.tsx` to fire a success toast before redirect and replace inline-only errors with toast errors
- Update all 11 authenticated CRUD pages to call `toast.success()` / `toast.error()` after every API mutation (create, update, delete, status transitions, assignments)
- All toast message strings are in Vietnamese

## Capabilities

### New Capabilities

- `toast-system`: Client-side toast notification infrastructure — context, hook, and overlay renderer with auto-dismiss, manual dismiss, success/error variants, and Vietnamese message strings

### Modified Capabilities

- none

## Impact

- **New files**: `apps/web/src/lib/toast-context.tsx`, `apps/web/src/components/toaster.tsx`
- **Modified layouts**: `apps/web/src/app/layout.tsx` (add ToastProvider), `apps/web/src/app/(authenticated)/layout.tsx` (add Toaster)
- **Modified pages** (13 files): `login/page.tsx` + all 11 authenticated CRUD pages + `import-export/page.tsx`
- **No new npm dependencies** — pure React context + CSS-in-JS (inline styles, matching existing codebase convention)
- **No API changes**, no backend impact
