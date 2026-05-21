## Context

The trip-plan-interactions change established the frontend pattern: all interactive pages are `"use client"` components using `useEffect`/`fetch` for data, inline modal components for forms, and inline action buttons for status transitions. Containers and yard moves follow this same pattern exactly.

All backend APIs are fully implemented:
- `GET /containers?status=&locationId=` — returns containers with `currentLocation` included
- `GET /yard-moves?locationId=&status=` — returns yard moves with `container`, `location`, `costs` included
- `POST /yard-moves` — creates a yard move
- `PATCH /yard-moves/:id/status` — advances status
- `POST /yard-moves/:id/costs` — adds a cost entry

## Goals / Non-Goals

**Goals:**
- Containers page: read-only table with status badge color-coding and optional filter by status
- Yard Moves page: interactive table with create modal, inline status advance buttons, add cost modal
- Nav sidebar updated with links to both pages

**Non-Goals:**
- No container CRUD (create/edit/delete containers)
- No yard move edit (only create + status transitions + costs)
- No pagination UI (load up to 100 records, matching existing app pattern)
- No server-side rendering (client-only, consistent with all other pages)

## Decisions

**1. Single `"use client"` component per page**
All interactive pages in this app are pure client components. No server/client split. Rationale: simpler mental model, easier to add interactivity, consistent with the established pattern.

**2. Containers page has status filter dropdown**
`GET /containers` supports `?status=` filter. Exposing it via a `<select>` dropdown gives operators a quick way to see only containers in a given state without needing backend pagination changes.

**3. Yard Moves create modal fetches containers + locations on open**
Same pattern as trip plan create modal fetching vehicles/customers/carriers/locations. Containers list (`GET /containers`) doubles as the data source for the yard move's `containerId` field.

**4. Status transition buttons — NEXT_STATUS map**
Follows trip-plans pattern:
```
PENDING     → "Bắt đầu"   → IN_PROGRESS
IN_PROGRESS → "Hoàn thành" → COMPLETED
IN_PROGRESS → "Hủy"        → CANCELLED
PENDING     → "Hủy"        → CANCELLED
```
Terminal states (COMPLETED, CANCELLED) show no action buttons.

**5. "+ Chi phí" only on IN_PROGRESS and COMPLETED moves**
Cost recording makes sense once a move is underway or done — mirrors trip plans cost addition on COMPLETED status.

## Risks / Trade-offs

- **Containers list could be large**: Container fleet can grow. Mitigation: `limit=100` in the query, and status filter reduces noise.
- **Stale container status after yard move**: The containers page is loaded once and not reactive. Mitigation: user refreshes the page; this is acceptable for the current operational context.

## Open Questions

None — all APIs and patterns are established.
