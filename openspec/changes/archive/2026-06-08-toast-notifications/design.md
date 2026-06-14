## Context

The TMS web app is a Next.js 15 app with zero UI library dependencies — all styles are inline CSS-in-JS. There are 13 pages that perform mutations (login + 11 authenticated CRUD pages + import-export). Each page manages its own local error state. There is no shared notification infrastructure. Success states are completely silent (modal closes, list refreshes). Errors are shown inline inside modals only, meaning once the modal closes, the error trail is lost. All UI text is in Vietnamese.

The app uses React context for auth (`lib/auth-context.tsx`). The authenticated layout wraps `<AuthProvider>` + `<NavSidebar>` + `<main>`. The root layout is bare (`<html><body>`). No CSS modules, no Tailwind.

## Goals / Non-Goals

**Goals:**

- Zero new npm dependencies — pure React context + inline styles
- Single `ToastProvider` at root layout level covering login and all authenticated pages
- `useToast()` hook gives any client component access to `toast.success(msg)` and `toast.error(msg)`
- `<Toaster />` renders stacked toasts in top-right corner, fixed position
- Success toasts auto-dismiss after 3 seconds; error toasts stay until manually dismissed
- All message strings passed by the caller — the system is message-agnostic
- Existing inline modal errors are preserved (they serve a different UX role: form-context errors)

**Non-Goals:**

- Toast deduplication or queueing limits
- Toast position customization
- Replacing inline modal validation errors
- Any backend changes
- Internationalization infrastructure — messages are hardcoded Vietnamese strings at call sites

## Decisions

### Decision 1: ToastProvider at root layout, not authenticated layout

**Choice**: Place `<ToastProvider>` in `apps/web/src/app/layout.tsx` (root), not `(authenticated)/layout.tsx`.

**Rationale**: The login page is outside the authenticated layout group. Login needs toast too. Placing at root covers both. No downside since the provider renders nothing visible by itself.

**Alternative considered**: Local toast state in login page only. Rejected — creates two parallel systems.

### Decision 2: `<Toaster />` rendered inside authenticated layout

**Choice**: `<Toaster />` (the visible overlay) lives in `(authenticated)/layout.tsx`.

**Rationale**: The login page has simple enough feedback (one action, redirects immediately) that a minimal inline toast inside login page itself suffices. Alternatively, Toaster can also be placed in root layout if login toasts are desired — implementation puts Toaster in root layout for simplicity.

**Revised choice**: Put `<Toaster />` in the root layout alongside `<ToastProvider>` — simpler, works universally.

### Decision 3: Auto-dismiss only for success toasts

**Choice**: success → 3s auto-dismiss; error → manual dismiss only.

**Rationale**: Errors need user attention; auto-dismissing errors could cause users to miss them. Success confirmations are informational and should not require interaction.

### Decision 4: Toast state model

```
interface Toast {
  id: string        // crypto.randomUUID() or Date.now() fallback
  type: "success" | "error"
  message: string
  createdAt: number
}
```

`ToastContext` holds `Toast[]`. `addToast(type, message)` appends. Success toasts auto-remove via `setTimeout`. Manual dismiss removes by id.

### Decision 5: No changes to existing inline modal errors

**Choice**: Keep `setCreateError`/`setEditError` in modals as-is. Add toast on top.

**Rationale**: Inline errors give context (they appear next to the submit button inside the modal). Toast gives a persistent out-of-modal confirmation. They serve different roles. Pages that currently show errors only in modals will now also fire a toast so the error persists after modal closes.

## Risks / Trade-offs

- **Multiple toasts stacking**: If a user fires actions quickly, toasts stack. Mitigation: 3s auto-dismiss keeps the stack short; no hard cap needed for typical usage.
- **SSR/hydration**: `ToastProvider` is a client component (uses `useState`). Must be marked `"use client"`. Root layout is a server component — wrap only the provider, not the whole layout. Mitigation: wrap children in provider in a separate `providers.tsx` client component if needed, or mark provider file as client and import directly.
- **React 19 compatibility**: `useContext` + `useState` + `setTimeout` — no compatibility concerns.

## Migration Plan

1. Create `lib/toast-context.tsx` and `components/toaster.tsx`
2. Update `app/layout.tsx` to wrap `<body>` content in `<ToastProvider><Toaster />{children}</ToastProvider>`
3. Update `(authenticated)/layout.tsx` to remove any Toaster if added there (keep clean)
4. Update login page
5. Update each authenticated page in order: vehicles, drivers, locations, carriers, customers, users, trip-costs, trip-plans, vehicle-records, yard-moves, import-export

Rollback: revert the two new files and the layout/page changes. No data migrations, no API changes.

## Open Questions

- None. Scope is well-defined.
