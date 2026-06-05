## Context

TripPlan currently has two cost-related structures:

1. `TripPlanCost` junction table (`tripPlanId`, `tripCostId`, `amount`, `invoiceNumber`) — generic, used for the "add cost" modal one-at-a-time.
2. Denormalized `tripCostName`/`tripCostAmount` on `TripPlan` — stores the last-added cost only.

The business needs 9 fixed named cost slots per trip (PHÍ NÂNG, PHÍ HẠ, PHÍ VỆ SINH, PHÍ CƯỢC, VÉ CỔNG, CHI PHÍ KHÁC/PHÍ ĐỨT TEM, CHI PHÍ TRÁI TUYẾN/CHỈ ĐỊNH/BP CAM, CẦU ĐƯỜNG, CHI PHÍ PHÁT SINH KHÁC), stored with name+amount snapshots so data survives TripCost catalog deletions.

## Goals / Non-Goals

**Goals:**

- Add `amount` default price to `TripCost` catalog.
- Add 20 denormalized columns to `TripPlan` for the 9 fixed cost slots (name + amount per slot, SHĐ for relevant slots).
- Add `costName String?` snapshot to `TripPlanCost`; make `tripCostId` nullable with `SetNull` on delete.
- New cost entry section in the trip plan create form with all 9 slots.
- TripCost dropdown auto-fills name + amount; user can override amount.

**Non-Goals:**

- Removing the existing `TripPlanCost` junction table or the `tripCostName`/`tripCostAmount` legacy fields.
- Dashboard/reporting UI — these columns enable it but the dashboard itself is out of scope.
- Validation that a TripCost catalog item exists for every fixed slot (all slots are optional).

## Decisions

### Decision 1: Wide table (denormalized columns) over EAV or JSON

**Choice**: Add explicit typed columns to `TripPlan` for each named cost slot.

**Rationale**: The 9 slots are fixed and business-defined. Explicit columns allow direct SQL aggregation for dashboards (`SUM(phi_nang_amount)`), strong typing in Prisma, and zero ambiguity in API contracts. EAV (key-value rows) or a JSON column would require dynamic aggregation and lose type safety.

**Alternatives considered**:

- JSON column `costSnapshot JSONB` — flexible but unindexable, hard to aggregate.
- EAV via a new `TripPlanFixedCost` table — clean schema but identical expressiveness to the current `TripPlanCost`, adds complexity.

### Decision 2: Keep TripPlanCost for free-form/additional costs (Option C)

**Choice**: `TripPlanCost` remains for arbitrary costs beyond the 9 fixed slots. Add `costName String?` snapshot field. Make `tripCostId` nullable with `onDelete: SetNull`.

**Rationale**: Preserves backward compatibility with existing cost data and the existing "add cost" modal flow. `costName` snapshot ensures cost names survive catalog deletions. `SetNull` on delete is safer than `Cascade` — orphaned rows retain their financial data.

**Alternatives considered**:

- Remove `TripPlanCost` entirely — would lose the free-form cost flow and existing data.
- Keep `onDelete: Cascade` — simpler but destroys cost records when catalog item is deleted, contradicting the data-resilience requirement.

### Decision 3: TripCost.amount is optional (nullable)

**Choice**: `amount Decimal? @db.Decimal(15,2)` — nullable, no default.

**Rationale**: Existing catalog items have no default price and forcing a value would require a migration with dummy data. Auto-fill in the form is a UX enhancement, not a business constraint; users can always enter amount manually.

### Decision 4: Inline cost entry in CreateTripModal

**Choice**: Extend the existing `CreateTripModal` with a cost section, rather than a separate step or separate modal.

**Rationale**: The trip plan create and cost entry share the same save action — one API call. A separate modal would require creating the plan first then adding costs, complicating error handling. The form is already wide (`wide` prop) and can accommodate the extra fields in a compact grid.

### Decision 5: Form sends fixed cost slots directly in CreateTripPlanDto

**Choice**: `CreateTripPlanDto` gains flat optional fields for each slot (`phiNangName?`, `phiNangAmount?`, `shdNang?`, etc.). The service maps these to the new `TripPlan` columns.

**Rationale**: Direct field mapping keeps the API contract explicit and self-documenting. Alternative (a `costs` array of `{slot, name, amount, shd}` objects) is more flexible but loses the strict slot names at the type level and requires the service to map array items to columns by slot key.

## Risks / Trade-offs

- **Schema bloat**: 20+ new nullable columns on `trip_plans`. Risk: table width growth, minor read overhead. Mitigation: all are nullable; PostgreSQL stores NULLs efficiently.
- **Slot naming divergence**: If the business renames a cost slot, existing denormalized data uses the old name. Risk: dashboard label mismatch. Mitigation: `name` columns store the snapshot at entry time (intentional); labels in the UI are hardcoded separately.
- **Dual cost storage**: Fixed slots in TripPlan columns AND free-form costs in TripPlanCost. Risk: confusion about where to query. Mitigation: document clearly in code that fixed slots live on TripPlan, TripPlanCost is for additional arbitrary costs.

## Migration Plan

1. Generate Prisma migration: `prisma migrate dev --name trip_plan_cost_fields`.
2. Migration adds `amount` to `trip_costs`, 20 new nullable columns to `trip_plans`, `cost_name` to `trip_plan_costs`, and makes `trip_cost_id` nullable with SetNull.
3. No data backfill required — all new columns are nullable.
4. Rollback: drop the added columns (destructive — acceptable since columns are new and have no production data yet).

## Open Questions

- None — all decisions confirmed with stakeholder during exploration.
