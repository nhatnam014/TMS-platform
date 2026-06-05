## Why

TripPlan cost tracking is currently limited to a single last-added cost (denormalized `tripCostName`/`tripCostAmount`) and a generic junction table (`TripPlanCost`) that loses cost names when catalog items are hard-deleted. The business requires a structured set of named cost slots (PHÍ NÂNG, PHÍ HẠ, etc.) directly on `TripPlan` with full name+amount snapshots for data resilience and dashboard reporting, plus a default amount on the `TripCost` catalog for auto-fill.

## What Changes

- **TripCost catalog gets an `amount` field** — optional default price; auto-fills the form when a catalog item is selected.
- **TripPlan gets 20 new denormalized columns** — 9 fixed cost slots, each storing name (snapshot) + amount, plus SHĐ (invoice number) where applicable.
- **TripPlanCost gets a `costName` snapshot field and `tripCostId` becomes nullable** — preserves cost name even when the catalog item is deleted; used for free-form/additional costs beyond the fixed slots.
- **Trip-costs UI updated** — create/edit form gains `amount` field.
- **Trip-plans create form updated** — new cost entry section with all 9 fixed slots, each with a TripCost dropdown (auto-fill name+amount), amount override input, and SHĐ input where applicable. Also exposes NGÀY GỬI CT, CHI PHÍ PHÁT SINH KHÁC (free-text name + amount), and NỘI DUNG fields inline.

## Capabilities

### New Capabilities

- `trip-plan-cost-form`: Structured cost entry form embedded in trip plan create/edit with fixed slots (PHÍ NÂNG, PHÍ HẠ, PHÍ VỆ SINH, PHÍ CƯỢC, VÉ CỔNG, CHI PHÍ KHÁC/PHÍ ĐỨT TEM, CHI PHÍ TRÁI TUYẾN/CHỈ ĐỊNH/BP CAM, CẦU ĐƯỜNG, CHI PHÍ PHÁT SINH KHÁC) all stored as name+amount snapshots on TripPlan.

### Modified Capabilities

- `trip-cost-catalog`: TripCost entity gains optional `amount` field (default catalog price); create and update endpoints accept `amount`; UI form includes amount input.
- `trip-plan-cost-entry`: TripPlanCost gains `costName String?` snapshot field; `tripCostId` becomes nullable (SetNull on cascade); existing add-cost endpoint writes costName at time of save.

## Impact

- **DB**: New migration — `trip_costs.amount`, 20 new columns on `trip_plans`, `trip_plan_costs.cost_name` and nullable `trip_cost_id`.
- **API**: `CreateTripCostDto`, `UpdateTripCostDto` (add `amount`); `CreateTripPlanDto` (add 9 cost slot fields + `documentSentDate` + `otherCostsName`/`otherCostsAmount`); `AddTripPlanCostDto` (writes `costName` snapshot).
- **Shared types**: `TripCost`, `TripPlanCostItem`, `CreateTripPlanDto`, `CreateTripCostDto` interfaces updated.
- **Frontend**: `/trip-costs` page create/edit form; trip-plans `CreateTripModal` gains cost section.
