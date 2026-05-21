## Context

The TMS web app has three existing read-only server-component pages (dashboard, trip-plans, vehicles). The API is a NestJS app with JWT auth; the token is stored as an httpOnly cookie and proxied through a Next.js catch-all route (`app/api/[...path]`). Two user roles are relevant: `ADMIN` and `OPERATOR`. Currently the frontend has no awareness of the logged-in user's role because the JWT is httpOnly and there is no `/auth/me` endpoint.

The trip plan lifecycle is: `PLANNED → DISPATCHED → IN_TRANSIT → COMPLETED` (or `→ CANCELLED`). The API already supports all mutations (`PATCH /trip-plans/:id/status`, `POST /trip-plans/:id/costs`, `POST /trip-plans`, `DELETE /trip-plans/:id`) but none are surfaced in the UI.

Creating a trip requires foreign-key IDs for vehicle, customer, carrier, and up to three location fields. The vehicle list is already fetchable (`GET /vehicles`). Customers, carriers, and locations have no list endpoints yet.

## Goals / Non-Goals

**Goals:**
- Add `GET /auth/me` so the frontend can know the acting user's role
- Add `GET /customers`, `GET /carriers`, `GET /locations` as simple read-only lists
- Fix the `AuditService` string→number pagination coercion bug (same as the trip-plans bug already fixed)
- Make trip-plans page fully interactive: create, status transitions, add costs
- Add admin-only audit log page with role-gated nav visibility
- Keep architecture simple: no SSR/client split complexity — interactive pages are pure client components

**Non-Goals:**
- Pagination on the create-trip dropdowns (small data sets, full list is fine)
- Creating/editing customers, carriers, locations, or vehicles from the UI
- Yarn/npm/pnpm workspace changes or new external dependencies
- Real-time updates or websockets
- Vehicle CRUD or driver management

## Decisions

### Decision 1: GET /auth/me returns decoded JWT claims, not a DB lookup

**Choice:** Return `{ id, username, role }` directly from the JWT payload attached to the request by `JwtStrategy`, without hitting the database.

**Rationale:** Role and username are already in the JWT payload via `JwtStrategy.validate()`. A DB lookup adds latency on every page load for information we already have. The token expiry (`ACCESS_TOKEN_EXPIRY`) is the freshness guarantee — if a role is changed, the user re-logs in.

**Alternative considered:** DB lookup to get the latest role. Rejected: unnecessary complexity for an internal tool where role changes are rare admin actions.

---

### Decision 2: Reference data controllers as thin read-only additions to existing modules

**Choice:** Add `GET /customers`, `GET /carriers`, `GET /locations` directly to new or existing NestJS modules. No filtering, no pagination — return full list ordered by name/code.

**Rationale:** The seed data is small (2 customers, 5 carriers, 13 locations) and will grow slowly. Full-list endpoints are simple to implement and consume. No pagination logic needed.

**Alternative considered:** Reuse the existing pattern of query filters + pagination. Rejected: overkill for reference data that populates dropdowns.

---

### Decision 3: Role stored in React Context, fetched once on auth layout mount

**Choice:** Add an `AuthProvider` wrapping the authenticated layout. On mount it calls `GET /api/auth/me` and stores `{ username, role }` in context. The nav sidebar and pages read from this context.

**Rationale:** The JWT is httpOnly (cannot be read in JS), so the only way to expose the role is via an API call. Doing it once at the layout level means every child page has access without individual fetches.

**Alternative considered:** Store role in a non-httpOnly cookie at login time. Rejected: splits the auth token management into two places; creates a desync risk if the token is invalidated.

---

### Decision 4: Trip plans page as a pure client component

**Choice:** Convert `trip-plans/page.tsx` from a server component using `serverFetch` to a `"use client"` component that fetches via the proxy (`fetch("/api/trip-plans")`).

**Rationale:** The page needs status buttons, modals, and optimistic refresh — all requiring client-side state. The "server component passes data as props to client component" split adds complexity with no meaningful benefit for this internal tool (no SEO, no meaningful TTFB concern). One component is simpler to reason about.

**Alternative considered:** Server component + client child component pattern. Rejected per user's explicit direction: "no server-side and client flow split needed."

---

### Decision 5: After mutation, re-fetch the full list (no optimistic UI)

**Choice:** After each PATCH/POST/DELETE, call `router.refresh()` or re-run the fetch to get fresh server state.

**Rationale:** Trips may be modified by multiple operators. Stale optimistic state would mislead. For an internal ops tool, a brief loading flash is acceptable.

**Alternative considered:** Optimistic state update + background revalidation. Rejected: adds complexity; data freshness matters more than perceived speed here.

---

### Decision 6: Admin route protection — rely on API 403, hide nav link

**Choice:** The nav sidebar hides the "Nhật ký" link for non-admins. If a non-admin manually navigates to `/audit-logs`, they see a 403 error message (the API `RolesGuard` enforces it). No middleware-based redirect.

**Rationale:** This is an internal tool with known users. The API already enforces the hard boundary. Middleware-level route protection is additional complexity for minimal security gain in this context.

**Alternative considered:** `middleware.ts` to decode JWT and redirect non-admins. Rejected: the JWT secret would need to be available in the edge runtime, adding configuration overhead.

## Risks / Trade-offs

- **Role staleness in context**: If an admin demotes a user mid-session, the frontend context will still show the old role until re-login. → Acceptable for internal tool; session lifetime (`ACCESS_TOKEN_EXPIRY=7d`) is the mitigation boundary.

- **No loading state on auth context fetch**: A brief flash where the nav renders without knowing the role is possible. → Mitigate by rendering the nav with the audit link hidden by default until the `AuthProvider` resolves.

- **Full list for dropdowns**: If customers/carriers/locations grow to hundreds of entries, dropdown performance degrades. → Acceptable now; add search/autocomplete when data volume warrants it.

## Migration Plan

1. Deploy API changes (new endpoints, bug fix) — backward compatible, no schema changes
2. Deploy web changes — the auth context fetch is graceful (falls back to no role on error)
3. No database migrations required
4. No rollback complexity — all additive changes

## Open Questions

- None — scope is fully defined.
