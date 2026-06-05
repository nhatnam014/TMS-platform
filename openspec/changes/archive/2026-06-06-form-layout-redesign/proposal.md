## Why

The Trip Plan create modal and Vehicle Record create/edit modal both use a single-column vertical layout that requires excessive scrolling, making data entry slow and error-prone. Grouping logically related fields into side-by-side sections reduces scroll depth and makes the form structure immediately legible.

## What Changes

- **Trip Plan create modal** (`CreateTripModal`) is restructured into a 3-column top section (Chuyến đi · Container · Địa điểm) + a 2×4 grid cost section + a single-row supplemental row. Modal width increases from 700px to ~980px (capped at 95vw).
- **Vehicle Record create/edit modal** (`RecordFormFields` + `Modal`) is restructured into a 2-column top section (Tài xế · Thông tin xe) with the Mooc and Ghi chú sections full-width below. Modal width increases from 600px to ~820px (capped at 95vw).
- No changes to API, data models, state logic, or form submission behavior.
- No changes to any other pages or components.

## Capabilities

### New Capabilities

<!-- none — this is a pure layout refactor, no new user-visible capabilities -->

### Modified Capabilities

- `trip-plan-crud`: The create form layout changes — fields are now grouped into visually distinct horizontal sections. The requirement for "what fields exist" is unchanged; only the spatial arrangement is new. Delta spec documents the new section grouping and modal width.
- `vehicle-record-crud`: Same — create/edit form layout changes to 2-column top + full-width mooc rows. Delta spec documents the new section grouping and modal width.

## Impact

- **`apps/web/src/app/(authenticated)/trip-plans/page.tsx`** — `Modal` component width prop, `CreateTripModal` JSX layout, `CostSlotRow` layout
- **`apps/web/src/app/(authenticated)/vehicle-records/page.tsx`** — `Modal` component width, `RecordFormFields` JSX layout
- No API changes, no DB changes, no shared-package changes
