// ============================================================
// @tms/shared — Types, DTOs, Constants
// ============================================================

// ---------- Vehicle & Driver DTOs ----------
export interface CreateVehicleDto {
  licensePlate: string;
  vehicleType: VehicleType;
  inspectionExpiry?: string;
  insuranceExpiry?: string;
  registrationExpiry?: string;
  notes?: string;
}

export interface UpdateVehicleDto {
  licensePlate?: string;
  vehicleType?: VehicleType;
  status?: VehicleStatus;
  inspectionExpiry?: string;
  insuranceExpiry?: string;
  registrationExpiry?: string;
  notes?: string;
}

export interface CreateDriverDto {
  fullName: string;
  phone?: string;
  notes?: string;
}

export interface UpdateDriverDto {
  fullName?: string;
  phone?: string;
  status?: DriverStatus;
  notes?: string;
  vehicleId?: string | null;
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

// ---------- Trip Plan ----------
export interface CreateTripPlanDto {
  tripDate: string;
  serviceType: ServiceType;
  tripMode?: TripMode;
  vehicleId: string;
  customerId: string;
  carrierId?: string;
  outboundContainerNumber?: string;
  inboundContainerNumber?: string;
  outboundContainerId?: string;
  inboundContainerId?: string;
  pickupLocationId?: string;
  loadUnloadLocationId?: string;
  dropoffLocationId?: string;
  notes?: string;
}

export interface AddTripCostDto {
  costType: CostType;
  amount: number;
  invoiceNumber?: string;
  description?: string;
}

export interface TripPlanFilters {
  dateFrom?: string;
  dateTo?: string;
  customerId?: string;
  carrierId?: string;
  vehicleId?: string;
  serviceType?: ServiceType;
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
  totalTripsToday: number;
  tripsCompleted: number;
  tripsInTransit: number;
  vehiclesActive: number;
  vehiclesInMaintenance: number;
  expiringCompliance: number;
}

// ---------- Enums (mirrored from Prisma for frontend use) ----------
export type ServiceType = "SEA_EXPORT" | "SEA_IMPORT" | "NEO_EXPORT" | "NEO_IMPORT";
export type TripStatus = "PLANNED" | "DISPATCHED" | "IN_TRANSIT" | "COMPLETED" | "CANCELLED";
export type TripMode = "STANDARD" | "DROP_AND_HOOK";
export type CostType =
  | "LIFTING" | "DROPPING" | "CLEANING" | "DEPOSIT"
  | "GATE_FEE" | "SEAL_BREAK" | "OFF_ROUTE" | "TOLL"
  | "LIQUIDATION" | "ADVANCE_PAYMENT" | "OTHER";
export type VehicleType = "SHACMAN" | "CHENGLONG" | "HOWO" | "FREIGHTLINER" | "FAW" | "OTHER";
export type VehicleStatus = "ACTIVE" | "MAINTENANCE" | "DECOMMISSIONED" | "WAITING_DRIVER";
export type DriverStatus = "ACTIVE" | "ON_LEAVE" | "TERMINATED";
export type LocationType = "PORT" | "DEPOT" | "ICD" | "INDUSTRIAL_ZONE" | "WAREHOUSE" | "OTHER";
export type ContainerSize = "GP20" | "HC40" | "GP40" | "HC45";
export type ContainerStatus =
  | "EMPTY_AVAILABLE"
  | "EMPTY_IN_TRANSIT"
  | "EMPTY_AT_YARD"
  | "BEING_LOADED"
  | "LOADED_READY"
  | "LOADED_IN_TRANSIT"
  | "DELIVERED";
export type YardMoveStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
export type YardCostType = "YARD_HANDLING" | "FORKLIFT" | "OVERTIME" | "OTHER";
export type AuditAction =
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "STATUS_CHANGE"
  | "COST_ADDED"
  | "LOGIN"
  | "LOGIN_FAILED"
  | "LOGOUT"
  | "REGISTER";

// ---------- Audit ----------
export const ENTITY_TYPES = {
  TRIP_PLAN: "TripPlan",
  TRIP_COST: "TripCost",
  YARD_MOVE: "YardMove",
  YARD_MOVE_COST: "YardMoveCost",
  USER: "User",
  VEHICLE: "Vehicle",
  DRIVER: "Driver",
  CONTAINER: "Container",
  CUSTOMER: "Customer",
  CARRIER: "Carrier",
  LOCATION: "Location",
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

// ---------- Factory zones ----------
export const FactoryZone = {
  STAGING_DROP: "STAGING_DROP",
  LOADING_DOCK: "LOADING_DOCK",
  STAGING_READY: "STAGING_READY",
} as const;
export type FactoryZoneValue = (typeof FactoryZone)[keyof typeof FactoryZone];

// ---------- YardMove DTOs ----------
export interface CreateYardMoveDto {
  date: string;
  containerId: string;
  fromZone: FactoryZoneValue;
  toZone: FactoryZoneValue;
  locationId: string;
  notes?: string;
}

export interface YardMoveFilters {
  locationId?: string;
  status?: YardMoveStatus;
}

// ---------- Display helpers ----------
export const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  SEA_EXPORT: "SEA - EX (Xuất khẩu đường biển)",
  SEA_IMPORT: "SEA - IM (Nhập khẩu đường biển)",
  NEO_EXPORT: "NEO - EX (Nội địa xuất)",
  NEO_IMPORT: "NEO - IM (Nội địa nhập)",
};

export const COST_TYPE_LABELS: Record<CostType, string> = {
  LIFTING: "Phí nâng",
  DROPPING: "Phí hạ",
  CLEANING: "Phí vệ sinh",
  DEPOSIT: "Phí cược",
  GATE_FEE: "Vé cổng",
  SEAL_BREAK: "Phí đứt tem",
  OFF_ROUTE: "Trái tuyến / Chỉ định / BP cam",
  TOLL: "Cầu đường",
  LIQUIDATION: "Thanh lý",
  ADVANCE_PAYMENT: "Chi hộ",
  OTHER: "Chi phí khác",
};
