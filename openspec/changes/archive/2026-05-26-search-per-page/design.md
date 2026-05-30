## Context

The vehicles page already has a working client-side search pattern: a `search` state string, a `displayed` derived array computed via `.filter()`, and a controlled `<input>` wired to `onChange`. The remaining 6 entity pages (drivers, customers, carriers, locations, users, containers) lack any search input.

All entity data is loaded in full on mount (no pagination on these pages). Dataset sizes are small (typically < 500 rows), so client-side filtering is appropriate with no debouncing needed.

## Goals / Non-Goals

**Goals:**
- Add a search text input to each of the 6 pages that lacks one
- Filter the displayed list client-side as the user types
- Search only on the entity's critical identifying fields (see per-page decisions below)

**Non-Goals:**
- Server-side search or API changes
- Pagination or virtual scrolling
- Fuzzy matching or ranking
- Debouncing (dataset is too small to need it)
- Adding search to pages that already have it (vehicles, trip-plans)

## Decisions

**Pattern to follow** — reuse the existing vehicles page pattern verbatim:
1. `const [search, setSearch] = useState("")`
2. `const displayed = items.filter(...)` using `search.toLowerCase()` and `.includes(q)`
3. Render `<input ... value={search} onChange={e => setSearch(e.target.value)} />` above the table
4. Iterate over `displayed` (not the raw state array) when rendering table rows

**Search fields per page:**

| Page | Fields searched |
|------|----------------|
| Drivers | `fullName`, `phone` |
| Customers | `code`, `name` |
| Carriers | `code`, `name` |
| Locations | `code`, `name` |
| Users | `username` |
| Containers | `containerNumber` |

**Input placement** — directly above the table, to the left of any existing filter controls (matching vehicles page layout).

**Placeholder text** — describe what is searchable, in Vietnamese to match UI language (e.g., "Tìm theo tên, số điện thoại...").

## Risks / Trade-offs

- **Stale displayed list on fetch refresh** — not a risk; `displayed` is recomputed from `items` on every render, so refreshing `items` state automatically updates results.
- **Null fields** — `phone` on drivers can be null; guard with `v.phone?.toLowerCase().includes(q) ?? false`. Other nullable identifiers handled similarly.
