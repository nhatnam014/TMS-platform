"use client";

import { useEffect, useState, Fragment } from "react";
import type { PaginatedResponse, TripStatus, ServiceType, TripPlanCostItem } from "@tms/shared";
import { SERVICE_TYPE_LABELS } from "@tms/shared";
import { useToast } from "@/lib/toast-context";
import { formatDate } from "@/lib/date-utils";

interface LocationRef {
  id: string;
  code: string;
  name: string;
}
interface VehicleOption {
  id: string;
  licensePlate: string;
  vehicleType: string;
}
interface NamedOption {
  id: string;
  code: string;
  name: string;
}
interface TripPlanRow {
  id: string;
  tripDate: string;
  tripNumber: number | null;
  serviceType: string;
  status: TripStatus;
  vehicle: { id: string; licensePlate: string; vehicleType: string } | null;
  customer: { id: string; name: string } | null;
  carrier: { id: string; name: string } | null;
  containerSize: string | null;
  outboundContainerNumber: string | null;
  inboundContainerNumber: string | null;
  pickupLocation: LocationRef | null;
  loadUnloadLocation: LocationRef | null;
  dropoffLocation: LocationRef | null;
  documentSentDate: string | null;
  description: string | null;
  notes: string | null;
  tripCostName: string | null;
  tripCostAmount: number | null;
  costs: TripPlanCostItem[];
  // Fixed cost slots
  phiNangName: string | null;
  phiNangAmount: number | null;
  shdNang: string | null;
  phiHaName: string | null;
  phiHaAmount: number | null;
  shdHa: string | null;
  phiVeSinhName: string | null;
  phiVeSinhAmount: number | null;
  shdVeSinh: string | null;
  phiCuocName: string | null;
  phiCuocAmount: number | null;
  veCongName: string | null;
  veCongAmount: number | null;
  shdVeCong: string | null;
  chiPhiKhacName: string | null;
  chiPhiKhacAmount: number | null;
  chiPhiTraiTuyenName: string | null;
  chiPhiTraiTuyenAmount: number | null;
  cauDuongName: string | null;
  cauDuongAmount: number | null;
  chiPhiPhatSinhName: string | null;
  chiPhiPhatSinhAmount: number | null;
}

interface FilterState {
  dateFrom: string;
  dateTo: string;
  status: TripStatus | "";
  customerId: string;
  carrierId: string;
  serviceType: ServiceType | "";
  search: string;
  page: number;
}

const DEFAULT_FILTERS: FilterState = {
  dateFrom: "",
  dateTo: "",
  status: "",
  customerId: "",
  carrierId: "",
  serviceType: "",
  search: "",
  page: 1,
};

const STATUS_LABELS: Record<TripStatus, string> = {
  PLANNED: "Kế hoạch",
  DISPATCHED: "Đã điều xe",
  IN_TRANSIT: "Đang vận chuyển",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Hủy",
};
const STATUS_COLORS: Record<TripStatus, string> = {
  PLANNED: "#6366f1",
  DISPATCHED: "#f59e0b",
  IN_TRANSIT: "#3b82f6",
  COMPLETED: "#10b981",
  CANCELLED: "#ef4444",
};
const NEXT_STATUS: Partial<Record<TripStatus, { status: TripStatus; label: string }>> = {
  PLANNED: { status: "DISPATCHED", label: "Điều xe" },
  DISPATCHED: { status: "IN_TRANSIT", label: "Xuất phát" },
  IN_TRANSIT: { status: "COMPLETED", label: "Hoàn thành" },
};
const TERMINAL: TripStatus[] = ["COMPLETED", "CANCELLED"];
const ALL_STATUSES: TripStatus[] = [
  "PLANNED",
  "DISPATCHED",
  "IN_TRANSIT",
  "COMPLETED",
  "CANCELLED",
];
const ALL_SERVICE_TYPES: ServiceType[] = ["SEA_EXPORT", "SEA_IMPORT", "NEO_EXPORT", "NEO_IMPORT"];

const COST_COLUMNS: Array<{
  label: string;
  amountKey: keyof TripPlanRow;
  nameKey: keyof TripPlanRow;
  shdLabel?: string;
  shdKey?: keyof TripPlanRow;
}> = [
  {
    label: "PHÍ NÂNG",
    amountKey: "phiNangAmount",
    nameKey: "phiNangName",
    shdLabel: "SHĐ NÂNG",
    shdKey: "shdNang",
  },
  {
    label: "PHÍ HẠ",
    amountKey: "phiHaAmount",
    nameKey: "phiHaName",
    shdLabel: "SHĐ HẠ",
    shdKey: "shdHa",
  },
  {
    label: "PHÍ VỆ SINH",
    amountKey: "phiVeSinhAmount",
    nameKey: "phiVeSinhName",
    shdLabel: "SHĐ",
    shdKey: "shdVeSinh",
  },
  { label: "PHÍ CƯỢC", amountKey: "phiCuocAmount", nameKey: "phiCuocName" },
  {
    label: "VÉ CỔNG",
    amountKey: "veCongAmount",
    nameKey: "veCongName",
    shdLabel: "SHĐ",
    shdKey: "shdVeCong",
  },
  { label: "CHI PHÍ KHÁC/ PHÍ ĐỨT TEM", amountKey: "chiPhiKhacAmount", nameKey: "chiPhiKhacName" },
  {
    label: "CHI PHÍ TRÁI TUYẾN/ CHỈ ĐỊNH/ BP CAM",
    amountKey: "chiPhiTraiTuyenAmount",
    nameKey: "chiPhiTraiTuyenName",
  },
  { label: "CẦU ĐƯỜNG", amountKey: "cauDuongAmount", nameKey: "cauDuongName" },
];

function fmt(n: number | string | null | undefined): string {
  if (n === null || n === undefined || n === "") return "";
  const num = typeof n === "number" ? n : Number(n);
  if (isNaN(num)) return "";
  return num.toLocaleString("vi-VN");
}

function sizeTick(containerSize: string | null | undefined, prefix: string): string {
  if (!containerSize) return "";
  return containerSize.startsWith(prefix) ? "X" : "";
}

// ─── MODAL OVERLAY ──────────────────────────────────────────────────────────

function Modal({
  title,
  onClose,
  children,
  wide,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        zIndex: 50,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        paddingTop: 40,
        overflowY: "auto",
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          padding: 28,
          width: wide ? "min(95vw, 980px)" : 520,
          maxWidth: wide ? "unset" : "95vw",
          marginBottom: 40,
          boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>{title}</h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: 20,
              cursor: "pointer",
              color: "#64748b",
            }}
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "block", marginBottom: 14, width: "100%" }}>
      <span
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: "#374151",
          display: "block",
          marginBottom: 4,
        }}
      >
        {label}
      </span>
      {children}
    </label>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  border: "1px solid #d1d5db",
  borderRadius: 6,
  fontSize: 13,
  boxSizing: "border-box",
};
const btnPrimary: React.CSSProperties = {
  padding: "8px 18px",
  background: "#2563eb",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
};
const btnSecondary: React.CSSProperties = {
  padding: "8px 18px",
  background: "#f1f5f9",
  color: "#374151",
  border: "1px solid #e2e8f0",
  borderRadius: 6,
  fontSize: 13,
  cursor: "pointer",
};

// ─── CREATE TRIP MODAL ───────────────────────────────────────────────────────

interface CostSlotState {
  amount: string;
  shd: string;
}
const emptyCostSlot = (): CostSlotState => ({ amount: "", shd: "" });

function fmtInput(raw: string): string {
  if (!raw) return "";
  const n = Number(raw);
  if (isNaN(n)) return raw;
  return n.toLocaleString("vi-VN");
}

function stripNonDigits(v: string): string {
  return v.replace(/\D/g, "");
}

const colHeaderStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  color: "#6366f1",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  marginBottom: 12,
  paddingBottom: 4,
  borderBottom: "1px solid #e0e7ff",
};
const costLabelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  color: "#64748b",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  display: "block",
  marginBottom: 4,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

function CreateTripModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const toast = useToast();
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [customers, setCustomers] = useState<NamedOption[]>([]);
  const [carriers, setCarriers] = useState<NamedOption[]>([]);
  const [locations, setLocations] = useState<NamedOption[]>([]);
  const [loadingRefs, setLoadingRefs] = useState(true);

  const [tripDate, setTripDate] = useState(new Date().toISOString().slice(0, 10));
  const [serviceType, setServiceType] = useState<ServiceType>("SEA_EXPORT");
  const [vehicleId, setVehicleId] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [carrierId, setCarrierId] = useState("");
  const [containerSize, setContainerSize] = useState("");
  const [outboundContainerNumber, setOutboundContainerNumber] = useState("");
  const [inboundContainerNumber, setInboundContainerNumber] = useState("");
  const [pickupLocationId, setPickupLocationId] = useState("");
  const [loadUnloadLocationId, setLoadUnloadLocationId] = useState("");
  const [dropoffLocationId, setDropoffLocationId] = useState("");
  const [documentSentDate, setDocumentSentDate] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Cost slots state
  const [phiNang, setPhiNang] = useState<CostSlotState>(emptyCostSlot());
  const [phiHa, setPhiHa] = useState<CostSlotState>(emptyCostSlot());
  const [phiVeSinh, setPhiVeSinh] = useState<CostSlotState>(emptyCostSlot());
  const [phiCuoc, setPhiCuoc] = useState<CostSlotState>(emptyCostSlot());
  const [veCong, setVeCong] = useState<CostSlotState>(emptyCostSlot());
  const [chiPhiKhac, setChiPhiKhac] = useState<CostSlotState>(emptyCostSlot());
  const [chiPhiTraiTuyen, setChiPhiTraiTuyen] = useState<CostSlotState>(emptyCostSlot());
  const [cauDuong, setCauDuong] = useState<CostSlotState>(emptyCostSlot());
  const [chiPhiPhatSinh, setChiPhiPhatSinh] = useState<CostSlotState>(emptyCostSlot());
  const [chiPhiPhatSinhName, setChiPhiPhatSinhName] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/vehicles").then((r) => r.json()),
      fetch("/api/customers").then((r) => r.json()),
      fetch("/api/carriers").then((r) => r.json()),
      fetch("/api/locations").then((r) => r.json()),
    ])
      .then(([v, c, ca, l]) => {
        setVehicles(v);
        setCustomers(c);
        setCarriers(ca);
        setLocations(l);
        if (v.length) setVehicleId(v[0].id);
        if (c.length) setCustomerId(c[0].id);
      })
      .catch(() => {})
      .finally(() => setLoadingRefs(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!vehicleId || !customerId) {
      setError("Vui lòng chọn xe và khách hàng");
      return;
    }
    setError(null);
    setLoading(true);

    const toNum = (s: string) => {
      const n = Number(s);
      return s && !isNaN(n) && n > 0 ? n : undefined;
    };
    const toStr = (s: string) => s.trim() || undefined;

    try {
      const res = await fetch("/api/trip-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tripDate,
          serviceType,
          vehicleId,
          customerId,
          carrierId: carrierId || undefined,
          containerSize: containerSize || undefined,
          outboundContainerNumber: outboundContainerNumber || undefined,
          inboundContainerNumber: inboundContainerNumber || undefined,
          pickupLocationId: pickupLocationId || undefined,
          loadUnloadLocationId: loadUnloadLocationId || undefined,
          dropoffLocationId: dropoffLocationId || undefined,
          documentSentDate: documentSentDate || undefined,
          description: description || undefined,
          notes: notes || undefined,
          // cost slots
          phiNangName: phiNang.amount ? "PHÍ NÂNG" : undefined,
          phiNangAmount: toNum(phiNang.amount),
          shdNang: toStr(phiNang.shd),
          phiHaName: phiHa.amount ? "PHÍ HẠ" : undefined,
          phiHaAmount: toNum(phiHa.amount),
          shdHa: toStr(phiHa.shd),
          phiVeSinhName: phiVeSinh.amount ? "PHÍ VỆ SINH" : undefined,
          phiVeSinhAmount: toNum(phiVeSinh.amount),
          shdVeSinh: toStr(phiVeSinh.shd),
          phiCuocName: phiCuoc.amount ? "PHÍ CƯỢC" : undefined,
          phiCuocAmount: toNum(phiCuoc.amount),
          veCongName: veCong.amount ? "VÉ CỔNG" : undefined,
          veCongAmount: toNum(veCong.amount),
          shdVeCong: toStr(veCong.shd),
          chiPhiKhacName: chiPhiKhac.amount ? "CHI PHÍ KHÁC/ PHÍ ĐỨT TEM" : undefined,
          chiPhiKhacAmount: toNum(chiPhiKhac.amount),
          chiPhiTraiTuyenName: chiPhiTraiTuyen.amount
            ? "CHI PHÍ TRÁI TUYẾN/ CHỈ ĐỊNH/ BP CAM"
            : undefined,
          chiPhiTraiTuyenAmount: toNum(chiPhiTraiTuyen.amount),
          cauDuongName: cauDuong.amount ? "CẦU ĐƯỜNG" : undefined,
          cauDuongAmount: toNum(cauDuong.amount),
          chiPhiPhatSinhName: chiPhiPhatSinhName.trim() || undefined,
          chiPhiPhatSinhAmount: toNum(chiPhiPhatSinh.amount),
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message ?? "Lỗi không xác định");
      }
      toast.success("Tạo chuyến thành công");
      onDone();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Lỗi không xác định";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  if (loadingRefs) {
    return (
      <Modal title="Tạo chuyến mới" onClose={onClose}>
        <p style={{ color: "#64748b", fontSize: 13 }}>Đang tải dữ liệu...</p>
      </Modal>
    );
  }

  const locationOptions = [
    <option key="" value="">
      — Không chọn —
    </option>,
    ...locations.map((l) => (
      <option key={l.id} value={l.id}>
        {l.name}
      </option>
    )),
  ];

  return (
    <Modal title="Tạo chuyến mới" onClose={onClose} wide>
      <form onSubmit={handleSubmit}>
        {/* Row 1: 3-column top section */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.4fr 1fr 1fr",
            alignItems: "start",
            border: "1px solid #e2e8f0",
            borderRadius: 8,
            marginBottom: 14,
            overflow: "hidden",
          }}
        >
          {/* Chuyến đi */}
          <div style={{ padding: "14px 16px", borderRight: "1px solid #e2e8f0" }}>
            <div style={colHeaderStyle}>Chuyến đi</div>
            <Field label="Ngày chuyến *">
              <input
                type="date"
                value={tripDate}
                onChange={(e) => setTripDate(e.target.value)}
                style={inputStyle}
                required
              />
            </Field>
            <Field label="Loại dịch vụ *">
              <select
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value as ServiceType)}
                style={inputStyle}
              >
                {ALL_SERVICE_TYPES.map((k) => (
                  <option key={k} value={k}>
                    {SERVICE_TYPE_LABELS[k]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Xe *">
              <select
                value={vehicleId}
                onChange={(e) => setVehicleId(e.target.value)}
                style={inputStyle}
                required
              >
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.licensePlate}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Khách hàng *">
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                style={inputStyle}
                required
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Đơn vị vận chuyển">
              <select
                value={carrierId}
                onChange={(e) => setCarrierId(e.target.value)}
                style={inputStyle}
              >
                <option value="">— Không chọn —</option>
                {carriers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          {/* Container */}
          <div style={{ padding: "14px 16px", borderRight: "1px solid #e2e8f0" }}>
            <div style={colHeaderStyle}>Container</div>
            <Field label="Size Cont">
              <input
                type="text"
                value={containerSize}
                onChange={(e) => setContainerSize(e.target.value)}
                style={inputStyle}
                placeholder="40HC, 20GP..."
              />
            </Field>
            <Field label="CONT ĐI">
              <input
                type="text"
                value={outboundContainerNumber}
                onChange={(e) => setOutboundContainerNumber(e.target.value)}
                style={inputStyle}
                placeholder="OOLU8990993"
              />
            </Field>
            <Field label="CONT VỀ">
              <input
                type="text"
                value={inboundContainerNumber}
                onChange={(e) => setInboundContainerNumber(e.target.value)}
                style={inputStyle}
                placeholder="OOLU8990993"
              />
            </Field>
          </div>
          {/* Địa điểm */}
          <div style={{ padding: "14px 16px" }}>
            <div style={colHeaderStyle}>Địa điểm</div>
            <Field label="Điểm Lấy (R/H)">
              <select
                value={pickupLocationId}
                onChange={(e) => setPickupLocationId(e.target.value)}
                style={inputStyle}
              >
                {locationOptions}
              </select>
            </Field>
            <Field label="Điểm Đóng/Rút">
              <select
                value={loadUnloadLocationId}
                onChange={(e) => setLoadUnloadLocationId(e.target.value)}
                style={inputStyle}
              >
                {locationOptions}
              </select>
            </Field>
            <Field label="Điểm Hạ (R/H)">
              <select
                value={dropoffLocationId}
                onChange={(e) => setDropoffLocationId(e.target.value)}
                style={inputStyle}
              >
                {locationOptions}
              </select>
            </Field>
          </div>
        </div>

        {/* Row 2: 2×4 cost grid */}
        <div
          style={{
            border: "1px solid #e2e8f0",
            borderRadius: 8,
            marginBottom: 14,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "#6366f1",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              padding: "8px 12px",
              borderBottom: "1px solid #e2e8f0",
              background: "#f8f7ff",
            }}
          >
            Chi phí chuyến
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
            <div
              style={{
                padding: "8px 12px",
                borderBottom: "1px solid #e2e8f0",
                borderRight: "1px solid #e2e8f0",
              }}
            >
              <span style={costLabelStyle}>PHÍ NÂNG</span>
              <div style={{ display: "flex", gap: 4 }}>
                <input
                  type="text"
                  value={fmtInput(phiNang.amount)}
                  onChange={(e) =>
                    setPhiNang({ ...phiNang, amount: stripNonDigits(e.target.value) })
                  }
                  style={{ ...inputStyle, flex: 1 }}
                  placeholder="0"
                />
                <input
                  type="text"
                  value={phiNang.shd}
                  onChange={(e) => setPhiNang({ ...phiNang, shd: e.target.value })}
                  style={{ ...inputStyle, flex: 1 }}
                  placeholder="SHĐ"
                />
              </div>
            </div>
            <div style={{ padding: "8px 12px", borderBottom: "1px solid #e2e8f0" }}>
              <span style={costLabelStyle}>PHÍ HẠ</span>
              <div style={{ display: "flex", gap: 4 }}>
                <input
                  type="text"
                  value={fmtInput(phiHa.amount)}
                  onChange={(e) => setPhiHa({ ...phiHa, amount: stripNonDigits(e.target.value) })}
                  style={{ ...inputStyle, flex: 1 }}
                  placeholder="0"
                />
                <input
                  type="text"
                  value={phiHa.shd}
                  onChange={(e) => setPhiHa({ ...phiHa, shd: e.target.value })}
                  style={{ ...inputStyle, flex: 1 }}
                  placeholder="SHĐ"
                />
              </div>
            </div>
            <div
              style={{
                padding: "8px 12px",
                borderBottom: "1px solid #e2e8f0",
                borderRight: "1px solid #e2e8f0",
              }}
            >
              <span style={costLabelStyle}>PHÍ VỆ SINH</span>
              <div style={{ display: "flex", gap: 4 }}>
                <input
                  type="text"
                  value={fmtInput(phiVeSinh.amount)}
                  onChange={(e) =>
                    setPhiVeSinh({ ...phiVeSinh, amount: stripNonDigits(e.target.value) })
                  }
                  style={{ ...inputStyle, flex: 1 }}
                  placeholder="0"
                />
                <input
                  type="text"
                  value={phiVeSinh.shd}
                  onChange={(e) => setPhiVeSinh({ ...phiVeSinh, shd: e.target.value })}
                  style={{ ...inputStyle, flex: 1 }}
                  placeholder="SHĐ"
                />
              </div>
            </div>
            <div style={{ padding: "8px 12px", borderBottom: "1px solid #e2e8f0" }}>
              <span style={costLabelStyle}>PHÍ CƯỢC</span>
              <input
                type="text"
                value={fmtInput(phiCuoc.amount)}
                onChange={(e) => setPhiCuoc({ ...phiCuoc, amount: stripNonDigits(e.target.value) })}
                style={inputStyle}
                placeholder="0"
              />
            </div>
            <div
              style={{
                padding: "8px 12px",
                borderBottom: "1px solid #e2e8f0",
                borderRight: "1px solid #e2e8f0",
              }}
            >
              <span style={costLabelStyle}>VÉ CỔNG</span>
              <div style={{ display: "flex", gap: 4 }}>
                <input
                  type="text"
                  value={fmtInput(veCong.amount)}
                  onChange={(e) => setVeCong({ ...veCong, amount: stripNonDigits(e.target.value) })}
                  style={{ ...inputStyle, flex: 1 }}
                  placeholder="0"
                />
                <input
                  type="text"
                  value={veCong.shd}
                  onChange={(e) => setVeCong({ ...veCong, shd: e.target.value })}
                  style={{ ...inputStyle, flex: 1 }}
                  placeholder="SHĐ"
                />
              </div>
            </div>
            <div style={{ padding: "8px 12px", borderBottom: "1px solid #e2e8f0" }}>
              <span style={costLabelStyle}>CHI PHÍ KHÁC / PHÍ ĐỨT TEM</span>
              <input
                type="text"
                value={fmtInput(chiPhiKhac.amount)}
                onChange={(e) =>
                  setChiPhiKhac({ ...chiPhiKhac, amount: stripNonDigits(e.target.value) })
                }
                style={inputStyle}
                placeholder="0"
              />
            </div>
            <div style={{ padding: "8px 12px", borderRight: "1px solid #e2e8f0" }}>
              <span style={costLabelStyle}>TRÁI TUYẾN / CHỈ ĐỊNH / BP CAM</span>
              <input
                type="text"
                value={fmtInput(chiPhiTraiTuyen.amount)}
                onChange={(e) =>
                  setChiPhiTraiTuyen({ ...chiPhiTraiTuyen, amount: stripNonDigits(e.target.value) })
                }
                style={inputStyle}
                placeholder="0"
              />
            </div>
            <div style={{ padding: "8px 12px" }}>
              <span style={costLabelStyle}>CẦU ĐƯỜNG</span>
              <input
                type="text"
                value={fmtInput(cauDuong.amount)}
                onChange={(e) =>
                  setCauDuong({ ...cauDuong, amount: stripNonDigits(e.target.value) })
                }
                style={inputStyle}
                placeholder="0"
              />
            </div>
          </div>
          <div style={{ borderTop: "1px solid #e2e8f0", padding: "8px 12px" }}>
            <span style={costLabelStyle}>CHI PHÍ PHÁT SINH KHÁC (THANH LÝ - CHI HỘ)</span>
            <div style={{ display: "flex", gap: 4 }}>
              <input
                type="text"
                value={chiPhiPhatSinhName}
                onChange={(e) => setChiPhiPhatSinhName(e.target.value)}
                style={{ ...inputStyle, flex: 2 }}
                placeholder="Mô tả chi phí..."
              />
              <input
                type="text"
                value={fmtInput(chiPhiPhatSinh.amount)}
                onChange={(e) =>
                  setChiPhiPhatSinh({ ...chiPhiPhatSinh, amount: stripNonDigits(e.target.value) })
                }
                style={{ ...inputStyle, flex: 1 }}
                placeholder="0"
              />
            </div>
          </div>
        </div>

        {/* Row 3: Supplemental row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "auto 1fr 1fr",
            gap: 12,
            marginBottom: 12,
          }}
        >
          <Field label="Ngày gửi CT">
            <input
              type="date"
              value={documentSentDate}
              onChange={(e) => setDocumentSentDate(e.target.value)}
              style={inputStyle}
            />
          </Field>
          <Field label="Nội dung">
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={inputStyle}
            />
          </Field>
          <Field label="Ghi chú">
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={inputStyle}
            />
          </Field>
        </div>

        {error && <p style={{ color: "#dc2626", fontSize: 13, marginBottom: 12 }}>{error}</p>}
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }}>
          <button type="button" onClick={onClose} style={btnSecondary}>
            Hủy
          </button>
          <button type="submit" disabled={loading} style={btnPrimary}>
            {loading ? "Đang tạo..." : "Tạo chuyến"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─── EDIT TRIP MODAL ────────────────────────────────────────────────────────

function EditTripModal({
  trip,
  onClose,
  onDone,
}: {
  trip: TripPlanRow;
  onClose: () => void;
  onDone: () => void;
}) {
  const toast = useToast();
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [customers, setCustomers] = useState<NamedOption[]>([]);
  const [carriers, setCarriers] = useState<NamedOption[]>([]);
  const [locations, setLocations] = useState<NamedOption[]>([]);
  const [loadingRefs, setLoadingRefs] = useState(true);

  const [tripDate, setTripDate] = useState(trip.tripDate ? trip.tripDate.slice(0, 10) : "");
  const [serviceType, setServiceType] = useState<ServiceType>(
    (trip.serviceType as ServiceType) ?? "SEA_EXPORT",
  );
  const [status, setStatus] = useState<TripStatus>(trip.status);
  const [vehicleId, setVehicleId] = useState(trip.vehicle?.id ?? "");
  const [customerId, setCustomerId] = useState(trip.customer?.id ?? "");
  const [carrierId, setCarrierId] = useState(trip.carrier?.id ?? "");
  const [containerSize, setContainerSize] = useState(trip.containerSize ?? "");
  const [outboundContainerNumber, setOutboundContainerNumber] = useState(
    trip.outboundContainerNumber ?? "",
  );
  const [inboundContainerNumber, setInboundContainerNumber] = useState(
    trip.inboundContainerNumber ?? "",
  );
  const [pickupLocationId, setPickupLocationId] = useState(trip.pickupLocation?.id ?? "");
  const [loadUnloadLocationId, setLoadUnloadLocationId] = useState(
    trip.loadUnloadLocation?.id ?? "",
  );
  const [dropoffLocationId, setDropoffLocationId] = useState(trip.dropoffLocation?.id ?? "");
  const [documentSentDate, setDocumentSentDate] = useState(
    trip.documentSentDate ? trip.documentSentDate.slice(0, 10) : "",
  );
  const [description, setDescription] = useState(trip.description ?? "");
  const [notes, setNotes] = useState(trip.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [phiNang, setPhiNang] = useState<CostSlotState>({
    amount: trip.phiNangAmount != null ? String(trip.phiNangAmount) : "",
    shd: trip.shdNang ?? "",
  });
  const [phiHa, setPhiHa] = useState<CostSlotState>({
    amount: trip.phiHaAmount != null ? String(trip.phiHaAmount) : "",
    shd: trip.shdHa ?? "",
  });
  const [phiVeSinh, setPhiVeSinh] = useState<CostSlotState>({
    amount: trip.phiVeSinhAmount != null ? String(trip.phiVeSinhAmount) : "",
    shd: trip.shdVeSinh ?? "",
  });
  const [phiCuoc, setPhiCuoc] = useState<CostSlotState>({
    amount: trip.phiCuocAmount != null ? String(trip.phiCuocAmount) : "",
    shd: "",
  });
  const [veCong, setVeCong] = useState<CostSlotState>({
    amount: trip.veCongAmount != null ? String(trip.veCongAmount) : "",
    shd: trip.shdVeCong ?? "",
  });
  const [chiPhiKhac, setChiPhiKhac] = useState<CostSlotState>({
    amount: trip.chiPhiKhacAmount != null ? String(trip.chiPhiKhacAmount) : "",
    shd: "",
  });
  const [chiPhiTraiTuyen, setChiPhiTraiTuyen] = useState<CostSlotState>({
    amount: trip.chiPhiTraiTuyenAmount != null ? String(trip.chiPhiTraiTuyenAmount) : "",
    shd: "",
  });
  const [cauDuong, setCauDuong] = useState<CostSlotState>({
    amount: trip.cauDuongAmount != null ? String(trip.cauDuongAmount) : "",
    shd: "",
  });
  const [chiPhiPhatSinh, setChiPhiPhatSinh] = useState<CostSlotState>({
    amount: trip.chiPhiPhatSinhAmount != null ? String(trip.chiPhiPhatSinhAmount) : "",
    shd: "",
  });
  const [chiPhiPhatSinhName, setChiPhiPhatSinhName] = useState(trip.chiPhiPhatSinhName ?? "");

  useEffect(() => {
    Promise.all([
      fetch("/api/vehicles").then((r) => r.json()),
      fetch("/api/customers").then((r) => r.json()),
      fetch("/api/carriers").then((r) => r.json()),
      fetch("/api/locations").then((r) => r.json()),
    ])
      .then(([v, c, ca, l]) => {
        setVehicles(v);
        setCustomers(c);
        setCarriers(ca);
        setLocations(l);
      })
      .catch(() => {})
      .finally(() => setLoadingRefs(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!vehicleId || !customerId) {
      setError("Vui lòng chọn xe và khách hàng");
      return;
    }
    setError(null);
    setLoading(true);

    const toNum = (s: string) => {
      const n = Number(s);
      return s && !isNaN(n) && n > 0 ? n : undefined;
    };
    const toStr = (s: string) => s.trim() || undefined;

    try {
      const res = await fetch(`/api/trip-plans/${trip.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tripDate,
          serviceType,
          status,
          vehicleId,
          customerId,
          carrierId: carrierId || undefined,
          containerSize: containerSize || undefined,
          outboundContainerNumber: outboundContainerNumber || undefined,
          inboundContainerNumber: inboundContainerNumber || undefined,
          pickupLocationId: pickupLocationId || undefined,
          loadUnloadLocationId: loadUnloadLocationId || undefined,
          dropoffLocationId: dropoffLocationId || undefined,
          documentSentDate: documentSentDate || undefined,
          description: description || undefined,
          notes: notes || undefined,
          phiNangName: phiNang.amount ? "PHÍ NÂNG" : undefined,
          phiNangAmount: toNum(phiNang.amount),
          shdNang: toStr(phiNang.shd),
          phiHaName: phiHa.amount ? "PHÍ HẠ" : undefined,
          phiHaAmount: toNum(phiHa.amount),
          shdHa: toStr(phiHa.shd),
          phiVeSinhName: phiVeSinh.amount ? "PHÍ VỆ SINH" : undefined,
          phiVeSinhAmount: toNum(phiVeSinh.amount),
          shdVeSinh: toStr(phiVeSinh.shd),
          phiCuocName: phiCuoc.amount ? "PHÍ CƯỢC" : undefined,
          phiCuocAmount: toNum(phiCuoc.amount),
          veCongName: veCong.amount ? "VÉ CỔNG" : undefined,
          veCongAmount: toNum(veCong.amount),
          shdVeCong: toStr(veCong.shd),
          chiPhiKhacName: chiPhiKhac.amount ? "CHI PHÍ KHÁC/ PHÍ ĐỨT TEM" : undefined,
          chiPhiKhacAmount: toNum(chiPhiKhac.amount),
          chiPhiTraiTuyenName: chiPhiTraiTuyen.amount
            ? "CHI PHÍ TRÁI TUYẾN/ CHỈ ĐỊNH/ BP CAM"
            : undefined,
          chiPhiTraiTuyenAmount: toNum(chiPhiTraiTuyen.amount),
          cauDuongName: cauDuong.amount ? "CẦU ĐƯỜNG" : undefined,
          cauDuongAmount: toNum(cauDuong.amount),
          chiPhiPhatSinhName: chiPhiPhatSinhName.trim() || undefined,
          chiPhiPhatSinhAmount: toNum(chiPhiPhatSinh.amount),
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message ?? "Lỗi không xác định");
      }
      toast.success("Cập nhật chuyến thành công");
      onDone();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Lỗi không xác định";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  if (loadingRefs) {
    return (
      <Modal title="Sửa chuyến" onClose={onClose}>
        <p style={{ color: "#64748b", fontSize: 13 }}>Đang tải dữ liệu...</p>
      </Modal>
    );
  }

  const locationOptions = [
    <option key="" value="">
      — Không chọn —
    </option>,
    ...locations.map((l) => (
      <option key={l.id} value={l.id}>
        {l.name}
      </option>
    )),
  ];

  return (
    <Modal title="Sửa chuyến" onClose={onClose} wide>
      <form onSubmit={handleSubmit}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.4fr 1fr 1fr",
            alignItems: "start",
            border: "1px solid #e2e8f0",
            borderRadius: 8,
            marginBottom: 14,
            overflow: "hidden",
          }}
        >
          <div style={{ padding: "14px 16px", borderRight: "1px solid #e2e8f0" }}>
            <div style={colHeaderStyle}>Chuyến đi</div>
            <Field label="Ngày chuyến *">
              <input
                type="date"
                value={tripDate}
                onChange={(e) => setTripDate(e.target.value)}
                style={inputStyle}
                required
              />
            </Field>
            <Field label="Loại dịch vụ *">
              <select
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value as ServiceType)}
                style={inputStyle}
              >
                {ALL_SERVICE_TYPES.map((k) => (
                  <option key={k} value={k}>
                    {SERVICE_TYPE_LABELS[k]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Trạng thái">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TripStatus)}
                style={inputStyle}
              >
                {ALL_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Xe *">
              <select
                value={vehicleId}
                onChange={(e) => setVehicleId(e.target.value)}
                style={inputStyle}
                required
              >
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.licensePlate}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Khách hàng *">
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                style={inputStyle}
                required
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Đơn vị vận chuyển">
              <select
                value={carrierId}
                onChange={(e) => setCarrierId(e.target.value)}
                style={inputStyle}
              >
                <option value="">— Không chọn —</option>
                {carriers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <div style={{ padding: "14px 16px", borderRight: "1px solid #e2e8f0" }}>
            <div style={colHeaderStyle}>Container</div>
            <Field label="Size Cont">
              <input
                type="text"
                value={containerSize}
                onChange={(e) => setContainerSize(e.target.value)}
                style={inputStyle}
                placeholder="40HC, 20GP..."
              />
            </Field>
            <Field label="CONT ĐI">
              <input
                type="text"
                value={outboundContainerNumber}
                onChange={(e) => setOutboundContainerNumber(e.target.value)}
                style={inputStyle}
              />
            </Field>
            <Field label="CONT VỀ">
              <input
                type="text"
                value={inboundContainerNumber}
                onChange={(e) => setInboundContainerNumber(e.target.value)}
                style={inputStyle}
              />
            </Field>
          </div>
          <div style={{ padding: "14px 16px" }}>
            <div style={colHeaderStyle}>Địa điểm</div>
            <Field label="Điểm Lấy (R/H)">
              <select
                value={pickupLocationId}
                onChange={(e) => setPickupLocationId(e.target.value)}
                style={inputStyle}
              >
                {locationOptions}
              </select>
            </Field>
            <Field label="Điểm Đóng/Rút">
              <select
                value={loadUnloadLocationId}
                onChange={(e) => setLoadUnloadLocationId(e.target.value)}
                style={inputStyle}
              >
                {locationOptions}
              </select>
            </Field>
            <Field label="Điểm Hạ (R/H)">
              <select
                value={dropoffLocationId}
                onChange={(e) => setDropoffLocationId(e.target.value)}
                style={inputStyle}
              >
                {locationOptions}
              </select>
            </Field>
          </div>
        </div>

        <div
          style={{
            border: "1px solid #e2e8f0",
            borderRadius: 8,
            marginBottom: 14,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "#6366f1",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              padding: "8px 12px",
              borderBottom: "1px solid #e2e8f0",
              background: "#f8f7ff",
            }}
          >
            Chi phí chuyến
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
            <div
              style={{
                padding: "8px 12px",
                borderBottom: "1px solid #e2e8f0",
                borderRight: "1px solid #e2e8f0",
              }}
            >
              <span style={costLabelStyle}>PHÍ NÂNG</span>
              <div style={{ display: "flex", gap: 4 }}>
                <input
                  type="text"
                  value={fmtInput(phiNang.amount)}
                  onChange={(e) =>
                    setPhiNang({ ...phiNang, amount: stripNonDigits(e.target.value) })
                  }
                  style={{ ...inputStyle, flex: 1 }}
                  placeholder="0"
                />
                <input
                  type="text"
                  value={phiNang.shd}
                  onChange={(e) => setPhiNang({ ...phiNang, shd: e.target.value })}
                  style={{ ...inputStyle, flex: 1 }}
                  placeholder="SHĐ"
                />
              </div>
            </div>
            <div style={{ padding: "8px 12px", borderBottom: "1px solid #e2e8f0" }}>
              <span style={costLabelStyle}>PHÍ HẠ</span>
              <div style={{ display: "flex", gap: 4 }}>
                <input
                  type="text"
                  value={fmtInput(phiHa.amount)}
                  onChange={(e) => setPhiHa({ ...phiHa, amount: stripNonDigits(e.target.value) })}
                  style={{ ...inputStyle, flex: 1 }}
                  placeholder="0"
                />
                <input
                  type="text"
                  value={phiHa.shd}
                  onChange={(e) => setPhiHa({ ...phiHa, shd: e.target.value })}
                  style={{ ...inputStyle, flex: 1 }}
                  placeholder="SHĐ"
                />
              </div>
            </div>
            <div
              style={{
                padding: "8px 12px",
                borderBottom: "1px solid #e2e8f0",
                borderRight: "1px solid #e2e8f0",
              }}
            >
              <span style={costLabelStyle}>PHÍ VỆ SINH</span>
              <div style={{ display: "flex", gap: 4 }}>
                <input
                  type="text"
                  value={fmtInput(phiVeSinh.amount)}
                  onChange={(e) =>
                    setPhiVeSinh({ ...phiVeSinh, amount: stripNonDigits(e.target.value) })
                  }
                  style={{ ...inputStyle, flex: 1 }}
                  placeholder="0"
                />
                <input
                  type="text"
                  value={phiVeSinh.shd}
                  onChange={(e) => setPhiVeSinh({ ...phiVeSinh, shd: e.target.value })}
                  style={{ ...inputStyle, flex: 1 }}
                  placeholder="SHĐ"
                />
              </div>
            </div>
            <div style={{ padding: "8px 12px", borderBottom: "1px solid #e2e8f0" }}>
              <span style={costLabelStyle}>PHÍ CƯỢC</span>
              <input
                type="text"
                value={fmtInput(phiCuoc.amount)}
                onChange={(e) => setPhiCuoc({ ...phiCuoc, amount: stripNonDigits(e.target.value) })}
                style={inputStyle}
                placeholder="0"
              />
            </div>
            <div
              style={{
                padding: "8px 12px",
                borderBottom: "1px solid #e2e8f0",
                borderRight: "1px solid #e2e8f0",
              }}
            >
              <span style={costLabelStyle}>VÉ CỔNG</span>
              <div style={{ display: "flex", gap: 4 }}>
                <input
                  type="text"
                  value={fmtInput(veCong.amount)}
                  onChange={(e) => setVeCong({ ...veCong, amount: stripNonDigits(e.target.value) })}
                  style={{ ...inputStyle, flex: 1 }}
                  placeholder="0"
                />
                <input
                  type="text"
                  value={veCong.shd}
                  onChange={(e) => setVeCong({ ...veCong, shd: e.target.value })}
                  style={{ ...inputStyle, flex: 1 }}
                  placeholder="SHĐ"
                />
              </div>
            </div>
            <div style={{ padding: "8px 12px", borderBottom: "1px solid #e2e8f0" }}>
              <span style={costLabelStyle}>CHI PHÍ KHÁC / PHÍ ĐỨT TEM</span>
              <input
                type="text"
                value={fmtInput(chiPhiKhac.amount)}
                onChange={(e) =>
                  setChiPhiKhac({ ...chiPhiKhac, amount: stripNonDigits(e.target.value) })
                }
                style={inputStyle}
                placeholder="0"
              />
            </div>
            <div style={{ padding: "8px 12px", borderRight: "1px solid #e2e8f0" }}>
              <span style={costLabelStyle}>TRÁI TUYẾN / CHỈ ĐỊNH / BP CAM</span>
              <input
                type="text"
                value={fmtInput(chiPhiTraiTuyen.amount)}
                onChange={(e) =>
                  setChiPhiTraiTuyen({ ...chiPhiTraiTuyen, amount: stripNonDigits(e.target.value) })
                }
                style={inputStyle}
                placeholder="0"
              />
            </div>
            <div style={{ padding: "8px 12px" }}>
              <span style={costLabelStyle}>CẦU ĐƯỜNG</span>
              <input
                type="text"
                value={fmtInput(cauDuong.amount)}
                onChange={(e) =>
                  setCauDuong({ ...cauDuong, amount: stripNonDigits(e.target.value) })
                }
                style={inputStyle}
                placeholder="0"
              />
            </div>
          </div>
          <div style={{ borderTop: "1px solid #e2e8f0", padding: "8px 12px" }}>
            <span style={costLabelStyle}>CHI PHÍ PHÁT SINH KHÁC (THANH LÝ - CHI HỘ)</span>
            <div style={{ display: "flex", gap: 4 }}>
              <input
                type="text"
                value={chiPhiPhatSinhName}
                onChange={(e) => setChiPhiPhatSinhName(e.target.value)}
                style={{ ...inputStyle, flex: 2 }}
                placeholder="Mô tả chi phí..."
              />
              <input
                type="text"
                value={fmtInput(chiPhiPhatSinh.amount)}
                onChange={(e) =>
                  setChiPhiPhatSinh({ ...chiPhiPhatSinh, amount: stripNonDigits(e.target.value) })
                }
                style={{ ...inputStyle, flex: 1 }}
                placeholder="0"
              />
            </div>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "auto 1fr 1fr",
            gap: 12,
            marginBottom: 12,
          }}
        >
          <Field label="Ngày gửi CT">
            <input
              type="date"
              value={documentSentDate}
              onChange={(e) => setDocumentSentDate(e.target.value)}
              style={inputStyle}
            />
          </Field>
          <Field label="Nội dung">
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={inputStyle}
            />
          </Field>
          <Field label="Ghi chú">
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={inputStyle}
            />
          </Field>
        </div>

        {error && <p style={{ color: "#dc2626", fontSize: 13, marginBottom: 12 }}>{error}</p>}
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }}>
          <button type="button" onClick={onClose} style={btnSecondary}>
            Hủy
          </button>
          <button type="submit" disabled={loading} style={btnPrimary}>
            {loading ? "Đang lưu..." : "Lưu"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─── PAGINATION ───────────────────────────────────────────────────────────────

function getPageNumbers(current: number, total: number): number[] {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 3) return [1, 2, 3, 4, 5];
  if (current >= total - 2) return [total - 4, total - 3, total - 2, total - 1, total];
  return [current - 2, current - 1, current, current + 1, current + 2];
}

// ─── MAIN PAGE ───────────────────────────────────────────────────────────────

export default function TripPlansPage() {
  const toast = useToast();
  const [trips, setTrips] = useState<TripPlanRow[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [rawSearch, setRawSearch] = useState("");
  const [filterCustomers, setFilterCustomers] = useState<NamedOption[]>([]);
  const [filterCarriers, setFilterCarriers] = useState<NamedOption[]>([]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTrip, setEditingTrip] = useState<TripPlanRow | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/customers").then((r) => r.json()),
      fetch("/api/carriers").then((r) => r.json()),
    ])
      .then(([c, ca]) => {
        setFilterCustomers(c);
        setFilterCarriers(ca);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setFilters((f) => ({ ...f, search: rawSearch, page: 1 })), 400);
    return () => clearTimeout(timer);
  }, [rawSearch]);

  useEffect(() => {
    let cancelled = false;
    async function doFetch() {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({ limit: "20", page: String(filters.page) });
      if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
      if (filters.dateTo) params.set("dateTo", filters.dateTo);
      if (filters.status) params.set("status", filters.status);
      if (filters.customerId) params.set("customerId", filters.customerId);
      if (filters.carrierId) params.set("carrierId", filters.carrierId);
      if (filters.serviceType) params.set("serviceType", filters.serviceType);
      if (filters.search) params.set("search", filters.search);
      try {
        const res = await fetch(`/api/trip-plans?${params}`);
        if (!res.ok) throw new Error(`API error ${res.status}`);
        const data: PaginatedResponse<TripPlanRow> = await res.json();
        if (!cancelled) {
          setTrips(data.data);
          setTotal(data.meta.total);
          setTotalPages(data.meta.totalPages);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Lỗi không xác định");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    doFetch();
    return () => {
      cancelled = true;
    };
  }, [filters]);

  function setFilterField<K extends keyof FilterState>(key: K, value: FilterState[K]) {
    setFilters((f) => ({ ...f, [key]: value, page: 1 }));
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Bạn có chắc muốn xóa chuyến này không?")) return;
    try {
      const res = await fetch(`/api/trip-plans/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message ?? "Lỗi xóa");
      }
      toast.success("Xóa chuyến thành công");
      setFilters((f) => ({ ...f }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lỗi không xác định");
    }
  }

  const selectStyle: React.CSSProperties = {
    fontSize: 13,
    padding: "6px 8px",
    borderRadius: 6,
    border: "1px solid #e2e8f0",
    background: "#fff",
    color: "#0f172a",
  };
  const hasActiveFilter =
    filters.dateFrom ||
    filters.dateTo ||
    filters.status ||
    filters.customerId ||
    filters.carrierId ||
    filters.serviceType ||
    filters.search ||
    rawSearch;
  const startItem = total === 0 ? 0 : (filters.page - 1) * 20 + 1;
  const endItem = Math.min(filters.page * 20, total);

  const thStyle: React.CSSProperties = {
    padding: "8px 10px",
    textAlign: "left",
    fontSize: 11,
    fontWeight: 600,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    whiteSpace: "nowrap",
    borderBottom: "1px solid #e2e8f0",
  };
  const tdStyle: React.CSSProperties = {
    padding: "8px 10px",
    fontSize: 12,
    whiteSpace: "nowrap",
    borderBottom: "1px solid #f1f5f9",
  };
  const tdMono: React.CSSProperties = { ...tdStyle, fontFamily: "monospace" };
  const tdCenter: React.CSSProperties = { ...tdStyle, textAlign: "center" };

  return (
    <div>
      {showCreateModal && (
        <CreateTripModal
          onClose={() => setShowCreateModal(false)}
          onDone={() => {
            setShowCreateModal(false);
            setFilters((f) => ({ ...f }));
          }}
        />
      )}
      {editingTrip && (
        <EditTripModal
          trip={editingTrip}
          onClose={() => setEditingTrip(null)}
          onDone={() => {
            setEditingTrip(null);
            setFilters((f) => ({ ...f }));
          }}
        />
      )}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>Kế hoạch chuyến</h1>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {!loading && <span style={{ fontSize: 13, color: "#64748b" }}>{total} chuyến</span>}
          <button onClick={() => setShowCreateModal(true)} style={btnPrimary}>
            + Tạo chuyến
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div
        style={{
          background: "#fff",
          borderRadius: 10,
          padding: "14px 16px",
          boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
          marginBottom: 16,
          display: "flex",
          flexWrap: "wrap",
          gap: 10,
          alignItems: "flex-end",
        }}
      >
        {[
          {
            label: "Từ ngày",
            type: "date" as const,
            val: filters.dateFrom,
            set: (v: string) => setFilterField("dateFrom", v),
          },
          {
            label: "Đến ngày",
            type: "date" as const,
            val: filters.dateTo,
            set: (v: string) => setFilterField("dateTo", v),
          },
        ].map(({ label, type, val, set }) => (
          <div key={label} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "#64748b",
                textTransform: "uppercase",
              }}
            >
              {label}
            </span>
            <input
              type={type}
              value={val}
              onChange={(e) => set(e.target.value)}
              style={{ ...selectStyle, padding: "5px 8px" }}
            />
          </div>
        ))}
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span
            style={{ fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}
          >
            Trạng thái
          </span>
          <select
            value={filters.status}
            onChange={(e) => setFilterField("status", e.target.value as TripStatus | "")}
            style={selectStyle}
          >
            <option value="">Tất cả</option>
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span
            style={{ fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}
          >
            Khách hàng
          </span>
          <select
            value={filters.customerId}
            onChange={(e) => setFilterField("customerId", e.target.value)}
            style={selectStyle}
          >
            <option value="">Tất cả</option>
            {filterCustomers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span
            style={{ fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}
          >
            Đơn vị VC
          </span>
          <select
            value={filters.carrierId}
            onChange={(e) => setFilterField("carrierId", e.target.value)}
            style={selectStyle}
          >
            <option value="">Tất cả</option>
            {filterCarriers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span
            style={{ fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}
          >
            Dịch vụ
          </span>
          <select
            value={filters.serviceType}
            onChange={(e) => setFilterField("serviceType", e.target.value as ServiceType | "")}
            style={selectStyle}
          >
            <option value="">Tất cả</option>
            {ALL_SERVICE_TYPES.map((s) => (
              <option key={s} value={s}>
                {SERVICE_TYPE_LABELS[s] ?? s}
              </option>
            ))}
          </select>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1, minWidth: 200 }}>
          <span
            style={{ fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}
          >
            Tìm kiếm
          </span>
          <input
            type="text"
            value={rawSearch}
            onChange={(e) => setRawSearch(e.target.value)}
            placeholder="Tìm xe, container, khách hàng..."
            style={{ ...selectStyle, padding: "5px 10px", width: "100%" }}
          />
        </div>
        {hasActiveFilter && (
          <button
            onClick={() => {
              setRawSearch("");
              setFilters(DEFAULT_FILTERS);
            }}
            style={{ ...btnSecondary, padding: "6px 12px", fontSize: 12, alignSelf: "flex-end" }}
          >
            Xóa bộ lọc
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <p style={{ color: "#64748b", fontSize: 14 }}>Đang tải...</p>
      ) : error ? (
        <p
          style={{ color: "#dc2626", background: "#fef2f2", padding: "12px 16px", borderRadius: 8 }}
        >
          {error}
        </p>
      ) : (
        <>
          <div
            style={{
              background: "#fff",
              borderRadius: 10,
              boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
              overflowX: "auto",
            }}
          >
            <table style={{ borderCollapse: "collapse", minWidth: 2800 }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  <th style={thStyle}>STT</th>
                  <th style={thStyle}>NGÀY</th>
                  <th style={thStyle}>SỐ XE</th>
                  <th style={thStyle}>KHÁCH HÀNG</th>
                  <th style={thStyle}>LOẠI HÌNH</th>
                  <th style={thStyle}>ĐƠN VỊ</th>
                  <th style={thStyle}>SIZE CONT</th>
                  <th style={thStyle}>CONT ĐI</th>
                  <th style={thStyle}>CONT VỀ</th>
                  <th style={{ ...thStyle, textAlign: "center" }}>20'</th>
                  <th style={{ ...thStyle, textAlign: "center" }}>40'</th>
                  <th style={{ ...thStyle, textAlign: "center" }}>45'</th>
                  <th style={thStyle}>Điểm Lấy (R/H)</th>
                  <th style={thStyle}>Điểm (Đóng/Rút)</th>
                  <th style={thStyle}>Điểm hạ (R/H)</th>
                  {COST_COLUMNS.map((cc) => (
                    <Fragment key={cc.label}>
                      <th style={{ ...thStyle, minWidth: 100 }}>{cc.label}</th>
                      {cc.shdLabel && <th style={{ ...thStyle, minWidth: 120 }}>{cc.shdLabel}</th>}
                    </Fragment>
                  ))}
                  <th style={thStyle}>NGÀY GỬI CT</th>
                  <th style={{ ...thStyle, minWidth: 100 }}>CHI PHÍ PHÁT SINH KHÁC</th>
                  <th style={thStyle}>NỘI DUNG</th>
                  <th style={thStyle}>GHI CHÚ</th>
                  <th style={thStyle}>Trạng thái</th>
                  <th style={{ ...thStyle, minWidth: 160 }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {trips.length === 0 ? (
                  <tr>
                    <td colSpan={40} style={{ padding: 32, textAlign: "center", color: "#94a3b8" }}>
                      Không có dữ liệu
                    </td>
                  </tr>
                ) : (
                  trips.map((trip, i) => {
                    const rowBg = i % 2 === 0 ? "#fff" : "#fafafa";

                    return (
                      <tr key={trip.id} style={{ background: rowBg }}>
                        <td style={tdStyle}>{trip.tripNumber ?? "—"}</td>
                        <td style={tdStyle}>{formatDate(trip.tripDate)}</td>
                        <td style={tdMono}>{trip.vehicle?.licensePlate ?? "—"}</td>
                        <td style={tdStyle}>{trip.customer?.name ?? "—"}</td>
                        <td style={tdStyle}>
                          {SERVICE_TYPE_LABELS[trip.serviceType as ServiceType] ?? trip.serviceType}
                        </td>
                        <td style={tdStyle}>{trip.carrier?.name ?? "—"}</td>
                        <td style={tdMono}>{trip.containerSize ?? ""}</td>
                        <td style={tdMono}>{trip.outboundContainerNumber ?? ""}</td>
                        <td style={tdMono}>{trip.inboundContainerNumber ?? ""}</td>
                        <td style={tdCenter}>{sizeTick(trip.containerSize, "20")}</td>
                        <td style={tdCenter}>{sizeTick(trip.containerSize, "40")}</td>
                        <td style={tdCenter}>{sizeTick(trip.containerSize, "45")}</td>
                        <td style={tdStyle}>{trip.pickupLocation?.name ?? ""}</td>
                        <td style={tdStyle}>{trip.loadUnloadLocation?.name ?? ""}</td>
                        <td style={tdStyle}>{trip.dropoffLocation?.name ?? ""}</td>
                        {COST_COLUMNS.map((cc) => (
                          <Fragment key={cc.label}>
                            <td style={{ ...tdStyle, textAlign: "right" }}>
                              {fmt(trip[cc.amountKey] as number | null)}
                            </td>
                            {cc.shdLabel && (
                              <td style={tdStyle}>{(trip[cc.shdKey!] as string | null) ?? ""}</td>
                            )}
                          </Fragment>
                        ))}
                        <td style={tdStyle}>{formatDate(trip.documentSentDate)}</td>
                        <td style={{ ...tdStyle, textAlign: "right" }}>
                          {fmt(trip.chiPhiPhatSinhAmount)}
                        </td>
                        <td style={tdStyle}>{trip.description ?? ""}</td>
                        <td style={tdStyle}>{trip.notes ?? ""}</td>
                        <td style={tdStyle}>
                          <span
                            style={{
                              display: "inline-block",
                              padding: "2px 8px",
                              borderRadius: 12,
                              fontSize: 11,
                              fontWeight: 500,
                              background: `${STATUS_COLORS[trip.status]}18`,
                              color: STATUS_COLORS[trip.status],
                            }}
                          >
                            {STATUS_LABELS[trip.status]}
                          </span>
                        </td>
                        <td style={tdStyle}>
                          <div style={{ display: "flex", gap: 4 }}>
                            <button
                              onClick={() => setEditingTrip(trip)}
                              style={{
                                padding: "3px 8px",
                                fontSize: 11,
                                fontWeight: 500,
                                background: "#f0f9ff",
                                color: "#0369a1",
                                border: "1px solid #bae6fd",
                                borderRadius: 4,
                                cursor: "pointer",
                              }}
                            >
                              Sửa
                            </button>
                            <button
                              onClick={() => handleDelete(trip.id)}
                              style={{
                                padding: "3px 8px",
                                fontSize: 11,
                                background: "#fef2f2",
                                color: "#ef4444",
                                border: "1px solid #fecaca",
                                borderRadius: 4,
                                cursor: "pointer",
                              }}
                            >
                              Xóa
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginTop: 16,
                flexWrap: "wrap",
                gap: 8,
              }}
            >
              <span style={{ fontSize: 13, color: "#64748b" }}>
                Hiển thị {startItem}–{endItem} / {total} chuyến
              </span>
              <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                <button
                  onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}
                  disabled={filters.page === 1}
                  style={{
                    padding: "5px 12px",
                    fontSize: 13,
                    borderRadius: 6,
                    border: "1px solid #e2e8f0",
                    background: filters.page === 1 ? "#f8fafc" : "#fff",
                    color: filters.page === 1 ? "#cbd5e1" : "#374151",
                    cursor: filters.page === 1 ? "default" : "pointer",
                  }}
                >
                  ← Trước
                </button>
                {getPageNumbers(filters.page, totalPages).map((p) => (
                  <button
                    key={p}
                    onClick={() => setFilters((f) => ({ ...f, page: p }))}
                    style={{
                      padding: "5px 10px",
                      fontSize: 13,
                      borderRadius: 6,
                      border: "1px solid #e2e8f0",
                      background: p === filters.page ? "#2563eb" : "#fff",
                      color: p === filters.page ? "#fff" : "#374151",
                      fontWeight: p === filters.page ? 700 : 400,
                      cursor: "pointer",
                    }}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
                  disabled={filters.page === totalPages}
                  style={{
                    padding: "5px 12px",
                    fontSize: 13,
                    borderRadius: 6,
                    border: "1px solid #e2e8f0",
                    background: filters.page === totalPages ? "#f8fafc" : "#fff",
                    color: filters.page === totalPages ? "#cbd5e1" : "#374151",
                    cursor: filters.page === totalPages ? "default" : "pointer",
                  }}
                >
                  Sau →
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
