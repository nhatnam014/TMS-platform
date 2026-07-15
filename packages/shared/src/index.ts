// ============================================================
// @tms/shared — Types, DTOs, Constants
// ============================================================

// ---------- User Management DTOs ----------
export type UserRole = "ADMIN" | "OPERATOR" | "VIEWER";

export interface CreateUserDto {
  username: string;
  password: string;
  role: UserRole;
}

export interface UpdateUserDto {
  role?: UserRole;
  isActive?: boolean;
}

// ---------- Bulk Delete ----------
export interface BulkDeleteDto {
  ids: string[];
}

export interface BulkDeleteResult {
  deleted: string[];
  skipped: { id: string; reason: string }[];
}

// ---------- Reference Data DTOs ----------
export interface CreateCustomerDto {
  code: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  taxCode?: string;
}

export interface UpdateCustomerDto {
  code?: string;
  name?: string;
  address?: string;
  phone?: string;
  email?: string;
  taxCode?: string;
  isActive?: boolean;
}

export interface CreateCarrierDto {
  code: string;
  name: string;
  phone?: string;
}

export interface UpdateCarrierDto {
  code?: string;
  name?: string;
  phone?: string;
  isActive?: boolean;
}

export interface CreateLocationDto {
  code: string;
  name: string;
  locationType: LocationType;
  address?: string;
  latitude?: number;
  longitude?: number;
}

export interface UpdateLocationDto {
  code?: string;
  name?: string;
  locationType?: LocationType;
  address?: string;
  latitude?: number;
  longitude?: number;
  isActive?: boolean;
}

// ---------- Master Table Row Types ----------
export interface ServiceTypeRow {
  id: string;
  code: string;
  description: string;
  isActive: boolean;
}

export interface ContainerSizeRow {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
}

export interface CostTemplateRow {
  id: string;
  name: string;
  defaultAmount: number | null;
  isActive: boolean;
}

// ---------- Master Table DTOs ----------
export interface CreateServiceTypeDto {
  code: string;
  description: string;
}

export interface UpdateServiceTypeDto {
  code?: string;
  description?: string;
  isActive?: boolean;
}

export interface CreateContainerSizeDto {
  code: string;
  name: string;
}

export interface UpdateContainerSizeDto {
  code?: string;
  name?: string;
  isActive?: boolean;
}

export interface CreateCostTemplateDto {
  name: string;
  defaultAmount?: number;
}

export interface UpdateCostTemplateDto {
  name?: string;
  defaultAmount?: number | null;
  isActive?: boolean;
}

// ---------- Trip Plan ----------
export interface TripPlanCostItem {
  id: string;
  costName: string | null;
  amount: number;
  invoiceNumber?: string | null;
}

export interface OtherCostItem {
  costName?: string;
  amount: number;
  invoiceNumber?: string;
}

export interface CreateTripPlanDto {
  tripDate: string;
  serviceTypeId: string;
  tripMode?: TripMode;
  vehiclePlate?: string;
  customerId: string;
  carrierId?: string;
  containerSizeId?: string;
  outboundContainerNumber?: string;
  inboundContainerNumber?: string;
  pickupLocationName?: string;
  loadUnloadLocationName?: string;
  dropoffLocationName?: string;
  documentSentDate?: string;
  description?: string;
  notes?: string;
  // Fixed cost slots (8)
  phiNangName?: string;
  phiNangAmount?: number;
  shdNang?: string;
  phiHaName?: string;
  phiHaAmount?: number;
  shdHa?: string;
  phiVeSinhName?: string;
  phiVeSinhAmount?: number;
  shdVeSinh?: string;
  phiCuocName?: string;
  phiCuocAmount?: number;
  veCongName?: string;
  veCongAmount?: number;
  shdVeCong?: string;
  chiPhiKhacName?: string;
  chiPhiKhacAmount?: number;
  chiPhiTraiTuyenName?: string;
  chiPhiTraiTuyenAmount?: number;
  cauDuongName?: string;
  cauDuongAmount?: number;
  // Revenue/cost fields (name + amount + SHĐ)
  luongName?: string;
  luongAmount?: number;
  shdLuong?: string;
  cuocName?: string;
  cuocAmount?: number;
  shdCuoc?: string;
  doanhThuName?: string;
  doanhThuAmount?: number;
  shdDoanhThu?: string;
  phuThuName?: string;
  phuThuAmount?: number;
  shdPhuThu?: string;
  chiPhiName?: string;
  chiPhiAmount?: number;
  shdChiPhi?: string;
  tienDauName?: string;
  tienDauAmount?: number;
  shdTienDau?: string;
  neoXeName?: string;
  neoXeAmount?: number;
  shdNeoXe?: string;
  // Multiple other-cost rows
  otherCosts?: OtherCostItem[];
}

export interface AddTripPlanCostDto {
  costName: string;
  amount: number;
  invoiceNumber?: string;
}

export interface UpdateTripPlanDto {
  tripDate?: string;
  serviceTypeId?: string;
  tripMode?: TripMode;
  vehiclePlate?: string;
  customerId?: string;
  carrierId?: string;
  containerSizeId?: string;
  outboundContainerNumber?: string;
  inboundContainerNumber?: string;
  pickupLocationName?: string;
  loadUnloadLocationName?: string;
  dropoffLocationName?: string;
  documentSentDate?: string;
  description?: string;
  notes?: string;
  status?: TripStatus;
  phiNangName?: string;
  phiNangAmount?: number;
  shdNang?: string;
  phiHaName?: string;
  phiHaAmount?: number;
  shdHa?: string;
  phiVeSinhName?: string;
  phiVeSinhAmount?: number;
  shdVeSinh?: string;
  phiCuocName?: string;
  phiCuocAmount?: number;
  veCongName?: string;
  veCongAmount?: number;
  shdVeCong?: string;
  chiPhiKhacName?: string;
  chiPhiKhacAmount?: number;
  chiPhiTraiTuyenName?: string;
  chiPhiTraiTuyenAmount?: number;
  cauDuongName?: string;
  cauDuongAmount?: number;
  luongName?: string;
  luongAmount?: number;
  shdLuong?: string;
  cuocName?: string;
  cuocAmount?: number;
  shdCuoc?: string;
  doanhThuName?: string;
  doanhThuAmount?: number;
  shdDoanhThu?: string;
  phuThuName?: string;
  phuThuAmount?: number;
  shdPhuThu?: string;
  chiPhiName?: string;
  chiPhiAmount?: number;
  shdChiPhi?: string;
  tienDauName?: string;
  tienDauAmount?: number;
  shdTienDau?: string;
  neoXeName?: string;
  neoXeAmount?: number;
  shdNeoXe?: string;
  otherCosts?: OtherCostItem[];
}

export interface TripPlanFilters {
  dateFrom?: string;
  dateTo?: string;
  customerId?: string;
  carrierId?: string;
  vehiclePlate?: string;
  serviceTypeCode?: string;
  status?: TripStatus;
  search?: string;
}

// ---------- Pagination ----------
export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
}

// ---------- Dashboard ----------
export interface DashboardStats {
  totalTrips: number;
  tripsWaiting: number;
  tripsInTransit: number;
  tripsCompleted: number;
  tripsCancelled: number;
  vehiclesActive: number;
  moocsActive: number;
  expiringDangKiemXe: number;
  expiringCaVetXe: number;
  expiringDangKiemMooc: number;
  expiringCaVetMooc: number;
  urgentDangKiemXe: number;
  urgentCaVetXe: number;
  urgentDangKiemMooc: number;
  urgentCaVetMooc: number;
}

export interface ExpiryItem {
  entityType: "xe" | "mooc";
  plateOrMooc: string;
  parentPlate?: string;
  expType: "dangkiem" | "cavet";
  expDate: string;
  daysLeft: number;
}

export interface TripsTrendItem {
  date: string;
  count: number;
}

// ---------- Enums (mirrored from Prisma for frontend use) ----------
export type TripStatus = "PLANNED" | "DISPATCHED" | "IN_TRANSIT" | "COMPLETED" | "CANCELLED";
export const TRIP_STATUS_LABELS: Record<TripStatus, string> = {
  PLANNED: "Kế hoạch",
  DISPATCHED: "Đã điều xe",
  IN_TRANSIT: "Đang vận chuyển",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Hủy",
};
export type TripMode = "STANDARD" | "DROP_AND_HOOK";
export type LocationType = "PORT" | "DEPOT" | "ICD" | "INDUSTRIAL_ZONE" | "WAREHOUSE" | "OTHER";
export type AuditAction =
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "STATUS_CHANGE"
  | "LOGIN"
  | "LOGIN_FAILED"
  | "LOGOUT"
  | "REGISTER";

// ---------- Audit ----------
export const ENTITY_TYPES = {
  TRIP_PLAN: "TripPlan",
  YARD_MOVE: "YardMove",
  USER: "User",
  CUSTOMER: "Customer",
  CARRIER: "Carrier",
  LOCATION: "Location",
  VEHICLE_RECORD: "VehicleRecord",
} as const;
export type EntityTypeValue = (typeof ENTITY_TYPES)[keyof typeof ENTITY_TYPES];

export interface AuditLogFilters {
  action?: AuditAction;
  entityType?: string;
  entityId?: string;
  actorUserId?: string;
  dateFrom?: string;
  dateTo?: string;
}

// ---------- YardMove DTOs ----------
// ---------- Notes (shared shape across quản lý xe / bảo dưỡng xe / tiến độ vận tải) ----------
export interface NoteItemDto {
  content: string;
}

export interface CreateYardMoveDto {
  date: string;
  gps?: string;
  fullName?: string;
  truck?: string;
  mooc?: string;
  booking?: string;
  containerNumber?: string;
  notes?: NoteItemDto[];
  daKeo?: string;
}

export interface UpdateYardMoveDto {
  date?: string;
  gps?: string;
  fullName?: string;
  truck?: string;
  mooc?: string;
  booking?: string;
  containerNumber?: string;
  notes?: NoteItemDto[];
  daKeo?: string;
  isActive?: boolean;
}

export interface YardMoveFilters {
  search?: string;
}

// ---------- Excel Import/Export ----------
export interface ImportChangedField {
  field: string;
  oldValue: unknown;
  newValue: unknown;
}

export interface ImportChangedRecord {
  rowNum: number;
  identifier: string;
  entityId: string;
  changes: ImportChangedField[];
}

export interface ImportCreatedRecord {
  rowNum: number;
  identifier: string;
  entityId: string;
}

export interface ImportResult {
  imported: number;
  updated?: number;
  warnings: string[];
  errors: string[];
  changedRecords?: ImportChangedRecord[];
  createdRecords?: ImportCreatedRecord[];
}

// ---------- Vehicle Record Filters ----------
export interface VehicleRecordFilters {
  search?: string;
  expiryType?: "all" | "dangkiem" | "cavet";
  expiryScope?: "all" | "xe" | "mooc";
  expiryFrom?: string;
  expiryTo?: string;
}

// ---------- Vehicle Record Management (standalone, no FK) ----------
export interface VehicleRecordMoocDto {
  soMooc: string;
  hanDangKiem?: string;
  hanBaoHiem?: string;
  hanCaVet?: string;
}

export interface CreateVehicleRecordDto {
  tenTaiXe?: string;
  sdt?: string;
  loaiXe?: string;
  bienSo?: string;
  hanDangKiem?: string;
  hanBaoHiem?: string;
  hanCaVet?: string;
  donViSuaChua?: string;
  ngayLam?: string;
  kmHienTai?: string;
  notes?: NoteItemDto[];
  moocs?: VehicleRecordMoocDto[];
}

export interface UpdateVehicleRecordDto {
  tenTaiXe?: string;
  sdt?: string;
  loaiXe?: string;
  bienSo?: string;
  hanDangKiem?: string | null;
  hanBaoHiem?: string | null;
  hanCaVet?: string | null;
  donViSuaChua?: string | null;
  ngayLam?: string | null;
  kmHienTai?: string | null;
  notes?: NoteItemDto[];
  moocs?: VehicleRecordMoocDto[];
}
