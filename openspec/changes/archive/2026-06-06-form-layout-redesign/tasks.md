## 1. Trip Plan Create Modal — Layout Refactor

- [x] 1.1 Update `Modal` component in `apps/web/src/app/(authenticated)/trip-plans/page.tsx`: change `wide` branch width from `700` to `"min(95vw, 980px)"` and set `maxWidth: "unset"` (the min() expression already caps width)
- [x] 1.2 Replace the existing `CreateTripModal` field layout (currently a single flex-wrap row of `<Field half>` items) with a 3-column CSS Grid top section using `grid-template-columns: 1.4fr 1fr 1fr`; place each section (Chuyến đi, Container, Địa điểm) in its own grid cell with a right border divider and a section header label
- [x] 1.3 Populate **Chuyến đi** column: Ngày chuyến _, Loại dịch vụ _, Xe _, Khách hàng _, Đơn vị vận chuyển — each as a full-width field within the column
- [x] 1.4 Populate **Container** column: Size Cont, CONT ĐI, CONT VỀ — each as a full-width field within the column
- [x] 1.5 Populate **Địa điểm** column: Điểm Lấy (R/H), Điểm Đóng/Rút, Điểm Hạ (R/H) — each as a full-width field within the column
- [x] 1.6 Replace the existing vertical cost section (8 stacked `<CostSlotRow>` items) with a 2-column CSS Grid (`grid-template-columns: 1fr 1fr`); pair slots left-right: PHÍ NÂNG · PHÍ HẠ, PHÍ VỆ SINH · PHÍ CƯỢC, VÉ CỔNG · CHI PHÍ KHÁC, TRÁI TUYẾN · CẦU ĐƯỜNG; each cell contains: label (uppercase 11px), then a flex row with [select][amount][shd?] using the same slot state variables
- [x] 1.7 Add a single full-width supplemental row below cost section with three inline fields: Ngày gửi CT, Nội dung, and Ghi chú side by side (`display: grid; grid-template-columns: auto 1fr 1fr; gap: 12px`)
- [x] 1.8 Verify all existing state variables (`tripDate`, `vehicleId`, `customerId`, `phiNang`, etc.) and the `handleSubmit` function are untouched — only JSX layout changes

## 2. Vehicle Record Modal — Layout Refactor

- [x] 2.1 Update `Modal` component in `apps/web/src/app/(authenticated)/vehicle-records/page.tsx`: change fixed `width: 600` to `width: "min(95vw, 820px)"` and remove `maxHeight: "92vh"` (replace with `maxHeight: "90vh"` and keep `overflowY: "auto"`)
- [x] 2.2 Refactor `RecordFormFields` top section: replace the two separate `<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>` blocks (Tài xế and Thông tin xe) with a single outer `display: grid; grid-template-columns: 1fr 1.6fr` layout where each column is a visually bordered section with a `SectionHeader`
- [x] 2.3 In the **Tài xế** column: render Tên tài xế and SĐT as full-width fields within the column (remove the outer 2-col grid, let the column itself provide the width)
- [x] 2.4 In the **Thông tin xe** column: render Loại xe, Biển số, Hạn đăng kiểm, Hạn bảo hiểm, Hạn cà vẹt as full-width fields within the column
- [x] 2.5 Verify Mooc section and Ghi chú section remain full-width below the 2-column top, with no layout changes to mooc add/remove logic
