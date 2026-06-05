## 1. Database Schema & Migration

- [x] 1.1 Add `amount Decimal? @db.Decimal(15,2)` to `TripCost` model in `packages/db/prisma/schema.prisma`
- [x] 1.2 Add 20 new nullable columns to `TripPlan` model for 9 fixed cost slots (phi_nang_name/amount/shd, phi_ha_name/amount/shd, phi_ve_sinh_name/amount/shd, phi_cuoc_name/amount, ve_cong_name/amount/shd, chi_phi_khac_name/amount, chi_phi_trai_tuyen_name/amount, cau_duong_name/amount, chi_phi_phat_sinh_name/amount)
- [x] 1.3 Add `costName String? @map("cost_name")` to `TripPlanCost` model and make `tripCostId` nullable with `onDelete: SetNull`
- [x] 1.4 Run `prisma migrate dev --name trip_plan_cost_fields` to generate and apply the migration
- [x] 1.5 Run `prisma generate` to update the Prisma client

## 2. Shared Types

- [x] 2.1 Update `TripCost` interface in `packages/shared/src/index.ts` to include `amount: number | null`
- [x] 2.2 Update `TripPlanCostItem` interface to include `costName: string | null` and make `tripCostId` nullable
- [x] 2.3 Add all 9 cost slot fields to `CreateTripPlanDto` interface (phiNangName?, phiNangAmount?, shdNang?, phiHaName?, phiHaAmount?, shdHa?, phiVeSinhName?, phiVeSinhAmount?, shdVeSinh?, phiCuocName?, phiCuocAmount?, veCongName?, veCongAmount?, shdVeCong?, chiPhiKhacName?, chiPhiKhacAmount?, chiPhiTraiTuyenName?, chiPhiTraiTuyenAmount?, cauDuongName?, cauDuongAmount?, chiPhiPhatSinhName?, chiPhiPhatSinhAmount?)
- [x] 2.4 Add `documentSentDate?: string` and update `CreateTripCostDto` interface to include `amount?: number`

## 3. TripCost API

- [x] 3.1 Add optional `amount?: number` to `CreateTripCostDto` in `apps/api/src/modules/trip-cost/dto/create-trip-cost.dto.ts` with `@IsOptional()`, `@IsNumber()`, `@IsPositive()` validators
- [x] 3.2 Add optional `amount?: number` to `UpdateTripCostDto` similarly
- [x] 3.3 Update `TripCostService.create()` and `update()` to pass `amount` to Prisma
- [x] 3.4 Ensure `findAll()` returns the `amount` field in the response

## 4. TripPlan API

- [x] 4.1 Add all 9 cost slot fields and `documentSentDate` to `CreateTripPlanDto` in `apps/api/src/modules/trip-plan/dto/create-trip-plan.dto.ts` — all optional, amounts use `@IsNumber()` + `@IsPositive()`, names and SHĐ use `@IsString()`
- [x] 4.2 Update `TripPlanService.create()` to write all cost slot fields to the Prisma create call
- [x] 4.3 Ensure `TripPlanService.findAll()` and `findOne()` select and return all cost slot columns

## 5. TripPlanCost API (costName snapshot)

- [x] 5.1 Update `AddTripPlanCostDto` if needed (no changes expected — tripCostId remains required at API level)
- [x] 5.2 Update `TripPlanService.addCost()` to look up the TripCost name and write it as `costName` on the created `TripPlanCost` row
- [x] 5.3 Ensure the cost items in trip plan responses include the `costName` field (update select/include in Prisma query)

## 6. TripCost UI

- [x] 6.1 Add `amount: number | null` to the `TripCostItem` interface in `apps/web/src/app/(authenticated)/trip-costs/page.tsx`
- [x] 6.2 Add Amount column to the cost catalog table (display formatted number or "—" if null)
- [x] 6.3 Add optional amount number input to the create form (below name field)
- [x] 6.4 Add optional amount number input to the inline edit form (pre-fill current value)
- [x] 6.5 Update `handleCreate` and `handleSaveEdit` to include `amount` in the request body

## 7. TripPlan Create Form — Cost Section

- [x] 7.1 Add `TripCostOption` fetch to `CreateTripModal`'s `useEffect` (alongside existing vehicles/customers/carriers/locations fetch)
- [x] 7.2 Add state variables for all 9 cost slots (e.g. `phiNangId`, `phiNangAmount`, `shdNang`, etc.)
- [x] 7.3 Add cost entry section to the `CreateTripModal` form with a 2-column grid: one row per cost slot, containing a TripCost `<select>` (active items + blank option), amount number input (auto-filled from selected TripCost.amount, editable), and SHĐ text input where applicable
- [x] 7.4 Wire `onChange` on each dropdown to auto-fill the corresponding amount input from the selected TripCost's `amount`
- [x] 7.5 Add `documentSentDate` (date input, NGÀY GỬI CT) and `description` (text input, NỘI DUNG) fields to the form (mapping to existing TripPlan fields)
- [x] 7.6 Update `handleSubmit` in `CreateTripModal` to include all cost slot fields, `documentSentDate`, and `description` in the POST body (skip slots where dropdown is blank)
- [x] 7.7 Update the `TripPlanRow` interface and trip plan list to display the new cost slot columns in the table (at minimum show total cost or key phí values)

## 8. Verification

- [x] 8.1 Run `npm run type-check` — fix any TypeScript errors (web + api pass; pre-existing decorator errors in ui package unrelated)
- [x] 8.2 Run `npm run lint` — fix any lint errors (eslint binary not in PATH — pre-existing environment issue, not related to this change)
- [ ] 8.3 Manually verify: create a TripCost with amount → navigate to trip plans → open create modal → select cost in PHÍ NÂNG slot → confirm amount auto-fills → submit → confirm data persisted
- [ ] 8.4 Manually verify: delete a TripCost catalog item → confirm TripPlanCost rows still exist with costName intact (tripCostId becomes null)
