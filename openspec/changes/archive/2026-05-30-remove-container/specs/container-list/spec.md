## REMOVED Requirements

### Requirement: Display container inventory list

**Reason**: Container entity removed from the system. There are no container records to display.
**Migration**: Delete `apps/web/src/app/(authenticated)/containers/page.tsx` and remove the "Container" entry from `BASE_NAV_ITEMS` in `nav-sidebar.tsx`.

### Requirement: Filter containers by status

**Reason**: Container entity removed. No container status exists to filter on.
**Migration**: No frontend migration needed — the entire containers page is deleted.

### Requirement: Container status badge color coding

**Reason**: Container entity removed. Container status is no longer tracked.
**Migration**: No frontend migration needed — the entire containers page is deleted.
