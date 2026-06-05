## Context

The project uses a "TMS template - VIET CODE.xlsx" file with two sheets that staff maintain manually:

- **"quản lý xe"** — master list of Vehicles, Drivers, and Trailers with compliance expiry dates
- **"kế hoạch xe"** — daily trip plan log with container routing, carrier, costs per row

The Prisma schema was designed with this exact Excel layout in mind: column-for-column mapping exists for both sheets. The NestJS API and Next.js BFF are already operational; this change adds an `ImportModule`, `ExportModule`, and a minimal frontend page.

**Existing BFF proxy bug:** `apps/web/src/app/api/[...path]/route.ts` reads both the request body and response body as UTF-8 strings (`request.text()`, `apiRes.text()`). Binary multipart uploads and binary Excel responses are silently corrupted. This must be fixed as a prerequisite.

## Goals / Non-Goals

**Goals:**
- Binary-safe BFF proxy (prerequisite for upload and download)
- Import Vehicle/Driver/Trailer from "quản lý xe" sheet — upsert semantics, never hard-fail
- Import TripPlan/TripCost from "kế hoạch xe" sheet — upsert semantics, auto-create reference entities
- Export TripPlans as flat Excel (Phase 1: correct headers + column widths, no merged cells)
- Export Vehicle/Driver/Trailer compliance sheet as flat Excel (Phase 1)
- Admin-only frontend page with file upload and download buttons

**Non-Goals:**
- Exact template formatting with merged cells (Phase 2)
- Formula preservation or conditional formatting
- Import progress streaming / WebSockets
- Undo / rollback of imports
- Non-admin roles accessing import/export

## Decisions

### D1: ExcelJS for both parsing and generation

ExcelJS (4.x) handles both xlsx read and write, is CommonJS-compatible with the NestJS/Node setup, and provides column-width API needed for Phase 1 export. Using one library instead of two (e.g., xlsx + exceljs) reduces surface area.

*Alternative considered:* SheetJS (xlsx) for read + ExcelJS for write. Rejected: two dependencies for the same task; ExcelJS read performance is sufficient for the file sizes involved.

### D2: Multer MemoryStorage (no disk writes)

Use `@UseInterceptors(FileInterceptor('file'))` with default `MemoryStorage`. The xlsx files are small (<1 MB). In-memory parsing is fast and avoids temp file cleanup.

*Alternative considered:* DiskStorage with a temp directory. Rejected: adds cleanup logic and file-system coupling with no benefit for small files.

### D3: Direct Prisma upserts in ImportService, not existing service delegation

`CustomerService.create`, `CarrierService.create`, etc. throw `ConflictException` on duplicates and emit per-row audit logs. Routing import through them would cause failure on any re-import and flood the audit log.

Instead, `ImportService` uses `prisma.customer.upsert(...)`, `prisma.carrier.upsert(...)`, `prisma.location.upsert(...)`, `prisma.vehicle.upsert(...)` directly with `update: {}` (no-op on conflict) for reference entities. A single summary `AuditService.log` call covers the entire import.

*Alternative considered:* Call existing services with try/catch. Rejected: brittle, masks other errors, still logs per row.

### D4: ExportService injects TripPlanService for query reuse

`TripPlanService.findAll()` already has date-range filtering and all deep includes (vehicle, customer, carrier, containers, locations, costs). ExportModule imports TripPlanModule and injects TripPlanService to avoid duplicating the query. A large limit (`{ page: 1, limit: 10000 }`) is used for export.

### D5: "Quản lý xe" multi-row parsing strategy

The sheet uses a "continuation row" pattern: a row with an empty STT column but a non-empty SỐ MOOC column belongs to the same vehicle as the preceding STT row. Import logic tracks a `currentVehicleId` cursor and appends trailers to it while STT is empty.

**Row classification:**
```
STT present + driver name + vehicle plate → new Driver + Vehicle + optional Trailer
STT present + no driver/vehicle + mooc    → orphan Trailer only (no vehicle FK)
STT empty   + mooc present                → continuation Trailer for currentVehicle
STT present + vehicle plate + no driver   → Vehicle only (e.g., "Xe Chờ Tài")
```

### D6: Date handling — tolerate both Excel serial numbers and DD/MM/YYYY strings

The sheet mixes formats in the same column. Parser util:
```
if (typeof val === 'number' && val > 40000) → Excel serial → new Date((val - 25569) * 86400000)
if (typeof val === 'string') → try parse as DD/MM/YYYY
else → null (with warning if field was expected)
```
Non-parseable strings like "K CẦN MUA" → null, no error.

### D7: ContainerSize normalizer

Excel strings → Prisma enum:
```
"20GP" | "20'GP" | "20" → GP20
"40HC" | "40HQ" | "40'HC" → HC40
"40GP" | "40'" → GP40
"45HC" | "45HQ" | "45" → HC45
blank  → infer from 20'/40'/45' flag columns (look for "X" or "x")
unknown → add to errors, skip row
```

### D8: ImportResult response shape

```typescript
interface ImportResult {
  imported: number;
  warnings: string[];  // auto-created entity messages
  errors: string[];    // skipped rows with reason
}
```
Warnings are informational (admin should review new entities). Errors describe skipped rows. Neither causes HTTP 4xx — always returns 200 with the result object.

### D9: BFF proxy fix — arrayBuffer for body + full header passthrough

```typescript
// body: arrayBuffer instead of text (binary-safe for both JSON and multipart)
const body = ["GET", "HEAD"].includes(request.method) ? undefined : await request.arrayBuffer();

// response: arrayBuffer instead of text
const responseBuffer = await apiRes.arrayBuffer();

// headers: pass all non-hop-by-hop headers from upstream
const responseHeaders = new Headers();
apiRes.headers.forEach((value, key) => {
  const skip = ["transfer-encoding", "connection", "keep-alive"];
  if (!skip.includes(key.toLowerCase())) responseHeaders.set(key, value);
});
return new NextResponse(responseBuffer, { status: apiRes.status, headers: responseHeaders });
```

This preserves `Content-Disposition: attachment; filename=...` so the browser triggers a named file download.

## Risks / Trade-offs

- **Large import files** → ExcelJS reads whole file into memory. Acceptable for current volumes (<500 rows). Risk: operator uploads wrong file with 50k rows. Mitigation: add 5 MB file size limit via multer `limits: { fileSize: 5 * 1024 * 1024 }`.
- **Re-import creates duplicate TripPlans** → `TripPlan` has no natural unique key (tripDate + vehicle could repeat across imports). Decision: do NOT upsert TripPlans — always insert. Operators should be aware. Add row-level duplicate detection as a future improvement.
- **Location name matching** → Excel uses informal names ("DEPOT 5A", "HBCX TCTT") that must match `Location.name` case-insensitively. Auto-create on miss. Operators review the warnings list.
- **`arrayBuffer()` body in BFF** — existing JSON API calls also go through the proxy. `arrayBuffer()` is binary-safe for JSON (ASCII subset of UTF-8), so this is a non-breaking change.
