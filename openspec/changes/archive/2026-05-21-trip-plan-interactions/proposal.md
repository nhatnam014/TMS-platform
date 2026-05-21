## Why

The trip plans page is currently read-only — dispatchers can view trips but cannot create, update status, or record costs through the UI. This change delivers the complete trip plan operational flow from end to end, including role-based access so only admins see audit logs.

## What Changes

- Add `GET /auth/me` endpoint returning the authenticated user's profile and role
- Add reference data endpoints: `GET /customers`, `GET /carriers`, `GET /locations`
- Fix pagination coercion bug in `AuditService.findAll` (string → number for Prisma `take`/`skip`)
- Convert trip plans page to a fully interactive client component with:
  - Create trip modal (with dropdowns populated from reference data)
  - Inline status action buttons per row (context-aware: next valid state only)
  - Add cost modal for COMPLETED trips
- Add `/audit-logs` page (admin-only, hidden in nav for non-admins)
- Add React auth context to web app so role is available throughout the UI
- Update nav sidebar to show "Nhật ký" link only for ADMIN role

## Capabilities

### New Capabilities

- `auth-me`: Authenticated user profile endpoint; role exposed to frontend via React context
- `reference-data`: Read-only list endpoints for customers, carriers, and locations used as form dropdowns
- `trip-plan-crud`: Full create/status-update/cost-add interactions on the trip plans page
- `audit-log-viewer`: Admin-only paginated audit log page with role-based nav visibility

### Modified Capabilities

<!-- No existing spec files exist yet — no modifications needed -->

## Impact

**Backend (apps/api):**
- `auth` module: new `GET /auth/me` endpoint
- New modules or simple additions: `customers`, `carriers`, `locations` controllers + services
- `audit` module: fix pagination number coercion

**Frontend (apps/web):**
- New: `src/lib/auth-context.tsx` — React context for user role
- Modified: `src/components/nav-sidebar.tsx` — conditional audit log link
- Modified: `src/app/(authenticated)/trip-plans/page.tsx` — converted to client component
- New: `src/app/(authenticated)/audit-logs/page.tsx`
- Modified: `src/app/(authenticated)/layout.tsx` — wrap with AuthProvider

**Shared (@tms/shared):**
- No changes required; all needed types already exist
