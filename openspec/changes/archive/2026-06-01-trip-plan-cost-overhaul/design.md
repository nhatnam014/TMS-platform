## Context

The TMS platform tracks logistics trips via `TripPlan`. Costs were modelled as a 1:N child table (`TripCost`) keyed by a `CostType` enum. This creates two problems: (1) cost types cannot be managed at runtime — adding or removing a type requires a code deploy; (2) the enum-based model cannot align with the customer's Excel template, where cost columns are driven by named line items. Additionally, the TripPlan entity lacks `containerSize` (SIZE CONT), `description` (NỘI DUNG), and the two customer-mandated denormalized fields `tripCostName`/`tripCostAmount`.

The database currently has no `TripCost` rows, so no data migration is required.

## Goals / Non-Goals

**Goals:**

- Introduce a runtime-manageable `TripCost` catalog (CRUD) as the source of cost type options
- Restructure costs as an M:N between TripPlan and TripCost via `TripPlanCost` junction
- Hard-delete `TripCost` permanently cascades its `TripPlanCost` rows; TripPlan rows survive
- Denormalize `tripCostName` + `tripCostAmount` onto TripPlan on every cost insertion (customer requirement)
- Add `containerSize` and `description` to TripPlan
- Align list view, create form, import parser, and export builder to the 31-column Excel template

**Non-Goals:**

- Soft-delete / archiving of TripCost items (isActive flag is the only visibility control)
- Audit trail for individual TripPlanCost changes (the existing audit log covers TripPlan-level changes)
- Backwards-compatible API versioning (no external consumers, breaking changes are acceptable)

## Decisions

### D1: TripCost as a standalone catalog entity, not an enum

**Decision:** Replace `CostType` enum with a `TripCost` table (id, name, isActive).

**Rationale:** The customer needs to add, rename, or retire cost types without a deploy. A database-managed catalog gives ops-level control. An enum is a compile-time constant — unsuitable for runtime management.

**Alternatives considered:**

- Keep enum, expose a config file — rejected: still requires deploy; no UI self-service.
- Use a generic key-value config table — rejected: over-engineered for a named cost list.

### D2: Cascade hard-delete for TripPlanCost

**Decision:** `TripPlanCost.tripCostId` is a required FK with `onDelete: Cascade`. Deleting a `TripCost` permanently removes all its junction rows.

**Rationale:** Customer requirement: no orphaned cost line items. The TripPlan itself (and its denormalized `tripCostName`/`tripCostAmount`) are unaffected because they carry no FK to `TripCost`.

**Alternatives considered:**

- `onDelete: SetNull` with snapshot costName on junction — rejected: customer explicitly does not want preserved history on the junction records.
- Soft-delete only — rejected: customer requires permanent removal.

### D3: Denormalized tripCostName + tripCostAmount on TripPlan

**Decision:** When a cost is added via `POST /api/trip-plans/:id/costs`, the service atomically writes `tripCostName` (the selected TripCost's name) and `tripCostAmount` (the entered amount) directly onto the TripPlan row in the same Prisma transaction.

**Rationale:** Customer operational requirement. These flat fields survive TripCost deletion (no FK) and give staff a single-row view of the most relevant cost without joining.

**Implications:**

- Only the **most recently added** cost's name and amount are reflected in these fields — they are overwritten on each cost insertion.
- When all costs for a trip are deleted (via TripCost cascade), these flat fields retain stale values. This is accepted per customer requirement.
- These fields are NOT cleared when a TripCost catalog item is deleted (cascade only removes TripPlanCost rows).

**Alternatives considered:**

- Computed total across all costs — rejected: customer wants a named cost, not a sum.
- Store on junction only — rejected: customer explicitly requested these on the TripPlan table.

### D4: SHĐ (invoice number) lives on TripPlanCost, not TripCost

**Decision:** `TripPlanCost.invoiceNumber` (String?) is per-association, not per-catalog-item.

**Rationale:** An invoice number is trip-specific, not cost-type-specific. Each time PHÍ NÂNG is charged it will have a different invoice number.

### D5: TripCost catalog has no preset amount

**Decision:** `TripCost` stores only `name` and `isActive`. Amount is entered per-association on `TripPlanCost`.

**Rationale:** Per-trip costs vary (e.g., PHÍ NÂNG differs by port and date). A preset amount on the catalog would be misleading and require constant override.

### D6: Import parser rewrites to match actual Excel columns

**Decision:** Rewrite `kehoach-xe.parser.ts` to map the actual 31-column header structure (col 5 = LOẠI HÌNH, col 7 = SIZE CONT, col 8 = CONT ĐI, col 13 = Điểm Lấy, etc.) instead of the previous mismatched column names.

**Rationale:** The current parser was written for a different format; it fails to match any column beyond KHÁCH HÀNG and defaults serviceType to a hardcoded "SEA_EXPORT". The parser is a full rewrite, not an incremental patch.

### D7: Export builder rewrites to match actual Excel columns

**Decision:** Rewrite `kehoach-xe.builder.ts` to output the 31-column layout matching the template, including per-type cost columns (PHÍ NÂNG, SHĐ NÂNG, PHÍ HẠ, SHĐ HẠ, ...) sourced from `TripPlanCost` rows keyed by cost name.

## Risks / Trade-offs

- **Denormalization inconsistency** → `tripCostName`/`tripCostAmount` may become stale if the last cost is cascade-deleted. _Mitigation: accepted per customer requirement; document in API response._
- **No cost amount on TripPlanCost after cascade delete** → Historical cost data is permanently lost when a TripCost catalog item is deleted. _Mitigation: UI should warn before deleting a TripCost that has associated trip plans._
- **Import creates TripPlanCost rows** → Import now writes to two tables atomically per row (TripPlan + TripPlanCost). If parsing fails mid-batch, Prisma transactions ensure no partial rows. _Mitigation: wrap each row import in a transaction._
- **Breaking change to shared CostType type** → Any code importing `CostType` or `COST_TYPE_LABELS` from `@tms/shared` will fail to compile. _Mitigation: grep codebase and update all references in the same PR._

## Migration Plan

1. Run `prisma migrate dev` with new schema — drops `TripCost` table, creates `trip_costs` (catalog) and `trip_plan_costs` (junction), adds 4 columns to `trip_plans`, drops `CostType` enum.
2. No data backfill required (confirmed: zero existing TripCost rows).
3. Seed `TripCost` catalog with the standard cost names matching the old enum values as a Prisma seed script (optional convenience — not required for correctness).
4. Deploy API and web together (breaking API contract change).

## Open Questions

- None — all decisions confirmed with stakeholder during design session.
