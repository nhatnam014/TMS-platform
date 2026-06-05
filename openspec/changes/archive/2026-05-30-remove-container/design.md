## Context

The codebase has a `Container` Prisma model with a `containers` table and full CRUD API. YardMove has a required FK `containerId` and TripPlan has optional FKs `outboundContainerId`/`inboundContainerId`. All write paths (create trip, update trip status, complete yard move, Excel import) include container upsert or status-update side effects.

The business only needs to record a container number string — it does not track container inventory, status, or location. The full entity is dead weight.

## Goals / Non-Goals

**Goals:**

- Remove the Container table and all related Prisma models/enums
- Replace all FK references with plain validated strings (`containerNumber`, `outboundContainerNumber`, `inboundContainerNumber`)
- Apply regex `^[A-Z]{4}\d{7}$` validation at the API DTO layer and as a UX hint on web inputs
- Delete the `/containers` page, nav entry, and API module
- Remove all container-status side-effect logic

**Non-Goals:**

- Migrating existing container data (accept data loss — no container records have business value)
- Adding any new container tracking or status logic
- Changing the container number format or validation rule

## Decisions

### 1. Plain string fields, not a lookup table

**Decision:** Store container numbers as bare `String` columns in `YardMove` and `TripPlan`, not as references to a lookup table.

**Rationale:** The business does not need to query containers as entities, list them, or relate them across trips. A lookup table would re-introduce the same complexity being removed. Plain strings are simpler and match how operators actually think about containers.

**Alternatives considered:** Keep a lightweight `ContainerNumber` reference table (unique number only, no status). Rejected — adds a join for no query benefit.

### 2. Regex validation at API boundary only

**Decision:** Validate `^[A-Z]{4}\d{7}$` via `class-validator @Matches` on DTOs. No DB-level check constraint. Add HTML `pattern` attribute for UX.

**Rationale:** NestJS DTO validation is the authoritative boundary. DB check constraints in Prisma require raw SQL and add migration complexity with no additional safety at this scale.

### 3. Destructive migration (no data preservation)

**Decision:** Drop `containers` table outright. Existing FK column data (UUIDs) is lost; the new string columns start empty.

**Rationale:** Container records were auto-created by upsert on trip creation — they are derived data with no independent business value. No migration of existing FK values to string numbers is feasible (the UUID ≠ the container number).

**Rollback:** Restore from DB backup. There is no application-level rollback path.

### 4. Delete `normalizeContainerSize` utility

**Decision:** Delete `apps/api/src/modules/import/utils/container-size.ts` entirely (updated from original "keep" decision).

**Rationale:** The parser no longer reads container size columns (`LOẠI CONT 1/2`, flag columns `20'`/`40'`/`45'`). The export builder always writes `""` for size since size is no longer stored. The utility became unreferenced after removing those parser columns, and keeping dead code would introduce a false `ContainerSize` type dependency. Deleting it is the clean choice.

**Update:** Since `ContainerSize` enum is being deleted from `@tms/db` and `@tms/shared`, the utility's return type becomes `string | null` instead of `ContainerSize | null`.

### 5. Export builder: container number from string, size column left empty

**Decision:** In `kehoach-xe.builder.ts`, source container number from `tp.outboundContainerNumber` / `tp.inboundContainerNumber`. The "LOẠI CONT" columns output empty string.

**Rationale:** Container size is not stored anymore. Leaving the column empty is honest. Adding a separate `outboundContainerSize` string field to TripPlan would be scope creep.

## Risks / Trade-offs

- **Data loss** → Accepted; existing container UUID data has no downstream use. Mitigation: run migration only after confirming no container records need preservation.
- **Trip import re-imports may lose container size in export** → Size column becomes empty in export for all trips, including those imported with a size. Accepted trade-off.
- **Import parser still reads size columns from Excel** → `normalizeContainerSize` is still called but result is discarded. Minor dead code; acceptable to leave for now.
- **Type breakage in consumers importing `ContainerSize`/`ContainerStatus` from `@tms/shared`** → Only internal consumers; all will be fixed in this change.

## Migration Plan

1. Update Prisma schema (remove model/enums, change fields)
2. Run `pnpm db:generate` to update `@tms/db` client
3. Create and run Prisma migration (`pnpm db:migrate`) — this drops `containers` table and alters `yard_moves`/`trip_plans` columns
4. Delete `ContainerModule` directory
5. Edit all API service/controller/DTO files
6. Edit shared package
7. Delete web containers page; edit yard-moves and nav-sidebar
8. Build and type-check to confirm zero errors

Rollback: restore DB backup, revert code via git.
