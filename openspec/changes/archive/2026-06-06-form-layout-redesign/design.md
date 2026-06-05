## Context

Both forms currently render all fields in a single vertical column inside a fixed-width modal, requiring significant scrolling to reach the cost section (Trip Plan) or mooc rows (Vehicle Record). All state, submission logic, and API calls remain correct — only the visual layout needs restructuring. Both forms are inline React components (no shared form library) using plain inline styles, so the refactor is CSS-level only.

**Current modal widths:**

- Trip Plan `CreateTripModal`: `wide` prop → 700px, `maxWidth: 95vw`
- Vehicle Record `Modal`: fixed 600px, `maxHeight: 92vh`, `overflowY: auto`

## Goals / Non-Goals

**Goals:**

- Restructure Trip Plan create form into 3-column top + 2×4 cost grid + 1-row supplement section.
- Restructure Vehicle Record create/edit form into 2-column top + full-width mooc + full-width notes section.
- Reduce vertical scroll to near-zero for typical data entry (≤3 moocs, standard trip).
- Keep modal within `max-width: 95vw` — no horizontal overflow ever.

**Non-Goals:**

- No changes to state management, API calls, validation, or submission logic.
- No responsive/mobile breakpoints (this is a desktop-first internal TMS tool).
- No changes to the Trip Plan edit flow, delete, or status transitions.
- No changes to other pages or the shared `NavSidebar`.

## Decisions

### D1: CSS Grid for section columns, not Flexbox

**Decision**: Use `display: grid` with `grid-template-columns` for both the top section split and the cost 2×4 grid.

**Rationale**: Grid allows precise column ratios and automatic row alignment across sections. The cost grid's 2-column layout with label + 3 inputs per cell maps cleanly to a nested grid. Flexbox would require manual width math and break on varying field counts.

**Alternative considered**: Flexbox with `flex: 1` — rejected because the cost section's label/input sub-layout doesn't compose well.

---

### D2: Trip Plan top — 3 columns with border dividers

**Decision**: Three sections (Chuyến đi · Container · Địa điểm) side by side using `grid-template-columns: 1.4fr 1fr 1fr`. Sections are separated by `border-right: 1px solid #e2e8f0` (not gap), so the visual boundary is clear without white space between columns.

**Rationale**: "Chuyến đi" has 5 fields (taller), Container and Địa điểm have 3 each. A `1.4fr 1fr 1fr` ratio gives Chuyến đi slightly more width for longer select labels. `align-items: start` prevents sections from stretching to equal height.

---

### D3: Cost section — 2×4 grid with inline label

**Decision**: The 8 cost slots are arranged in a 2-column grid (`grid-template-columns: 1fr 1fr`). Each cell contains a small label (uppercase, 11px) followed by a flex row of `[select][amount][shd?]` inputs. The two halves are separated by a center border.

**Rationale**: 8 rows → 4 visual rows cuts vertical cost section height in half. Each cell is self-contained and matches the existing `CostSlotRow` component's structure, so the refactor is a layout wrapper change, not a logic change.

**Column pairing** (left → right):

- PHÍ NÂNG · PHÍ HẠ
- PHÍ VỆ SINH · PHÍ CƯỢC
- VÉ CỔNG · CHI PHÍ KHÁC / PHÍ ĐỨT TEM
- TRÁI TUYẾN / CHỈ ĐỊNH / BP CAM · CẦU ĐƯỜNG

---

### D4: Vehicle Record top — 2 columns, left narrower

**Decision**: Two sections (Tài xế · Thông tin xe) using `grid-template-columns: 1fr 1.6fr`. "Tài xế" has only 2 fields; "Thông tin xe" has 5 (biển số + loại xe + 3 dates). The wider right column accommodates the date inputs comfortably.

---

### D5: Modal widths set to pixel values with 95vw cap

**Decision**:

- Trip Plan `CreateTripModal`: `width: "min(95vw, 980px)"`
- Vehicle Record `Modal` when used for create/edit: `width: "min(95vw, 820px)"`

**Rationale**: `min()` is natively supported and keeps the modal within the viewport on smaller screens without JavaScript. The existing `maxWidth: "95vw"` approach in Trip Plan is replaced with this single expression for consistency.

**Alternative considered**: Passing a `width` prop to the shared `Modal` component — adopted. The vehicle record `Modal` already accepts `width` implicitly through its fixed 600px; changing to a prop or accepting an override via style is the minimal change.

---

### D6: Section headers styled as labeled dividers

**Decision**: Each section has a small uppercase label at the top (`font-size: 11px`, `font-weight: 700`, `color: #6366f1`, `letter-spacing: 0.06em`) with a bottom border, consistent with the existing `SectionHeader` component in the vehicle record page.

**Rationale**: Visual hierarchy cues the operator to each section's purpose at a glance. Same pattern already exists in `RecordFormFields` — reuse it in the trip plan form for consistency.

## Risks / Trade-offs

- **Label truncation at narrow viewports** → Mitigated by `95vw` cap; at very small screens (< 820px) the modal scrolls horizontally within the overlay, but this is acceptable for a desktop TMS tool.
- **Cost label overflow** → Long labels like "CHI PHÍ TRÁI TUYẾN / CHỈ ĐỊNH / BP CAM" may wrap. Mitigated by truncating with `text-overflow: ellipsis` on the label span, or using a shorter display label (e.g. "TRÁI TUYẾN").
- **CostSlotRow refactor scope** → The existing `CostSlotRow` renders its own label + inputs as a vertical stack. The 2×4 grid requires each cell to use a horizontal flex row for inputs. This means the `CostSlotRow` component's internal layout changes, or it receives a `horizontal` prop. Simpler: inline the cost layout directly in `CreateTripModal` since `CostSlotRow` is only used there.
