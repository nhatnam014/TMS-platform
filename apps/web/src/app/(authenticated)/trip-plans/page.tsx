"use client";

import { useEffect, useState, Fragment } from "react";
import type { PaginatedResponse, TripStatus, ServiceType, TripPlanCostItem } from "@tms/shared";
import { SERVICE_TYPE_LABELS } from "@tms/shared";

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
interface TripCostOption {
  id: string;
  name: string;
  amount: number | null;
  isActive: boolean;
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

// ─── COST MODAL ─────────────────────────────────────────────────────────────

function CostModal({
  tripId,
  onClose,
  onDone,
}: {
  tripId: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const [costOptions, setCostOptions] = useState<TripCostOption[]>([]);
  const [tripCostId, setTripCostId] = useState("");
  const [amount, setAmount] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/trip-costs")
      .then((r) => r.json())
      .then((data: TripCostOption[]) => {
        const active = data.filter((c) => c.isActive);
        setCostOptions(active);
        if (active.length) setTripCostId(active[0].id);
      })
      .catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amt = Number(amount);
    if (!amt || amt <= 0) {
      setError("Số tiền phải lớn hơn 0");
      return;
    }
    if (!tripCostId) {
      setError("Vui lòng chọn loại chi phí");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/trip-plans/${tripId}/costs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tripCostId,
          amount: amt,
          invoiceNumber: invoiceNumber || undefined,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message ?? "Lỗi không xác định");
      }
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi không xác định");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal title="Thêm chi phí" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <Field label="Loại chi phí *">
          <select
            value={tripCostId}
            onChange={(e) => setTripCostId(e.target.value)}
            style={inputStyle}
          >
            {costOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Số tiền (VND) *">
          <input
            type="number"
            min={1}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            style={inputStyle}
            placeholder="1200000"
            required
          />
        </Field>
        <Field label="SHĐ (Số hóa đơn)">
          <input
            type="text"
            value={invoiceNumber}
            onChange={(e) => setInvoiceNumber(e.target.value)}
            style={inputStyle}
            placeholder="HD001..."
          />
        </Field>
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

// ─── CREATE TRIP MODAL ───────────────────────────────────────────────────────

interface CostSlotState {
  id: string;
  name: string;
  amount: string;
  shd: string;
}
const emptyCostSlot = (): CostSlotState => ({ id: "", name: "", amount: "", shd: "" });

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
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [customers, setCustomers] = useState<NamedOption[]>([]);
  const [carriers, setCarriers] = useState<NamedOption[]>([]);
  const [locations, setLocations] = useState<NamedOption[]>([]);
  const [costOptions, setCostOptions] = useState<TripCostOption[]>([]);
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

  function selectCostSlot(setter: (s: CostSlotState) => void, id: string) {
    if (!id) {
      setter(emptyCostSlot());
      return;
    }
    const opt = costOptions.find((c) => c.id === id);
    setter({
      id,
      name: opt?.name ?? "",
      amount: opt?.amount != null ? String(opt.amount) : "",
      shd: "",
    });
  }

  useEffect(() => {
    Promise.all([
      fetch("/api/vehicles").then((r) => r.json()),
      fetch("/api/customers").then((r) => r.json()),
      fetch("/api/carriers").then((r) => r.json()),
      fetch("/api/locations").then((r) => r.json()),
      fetch("/api/trip-costs").then((r) => r.json()),
    ])
      .then(([v, c, ca, l, tc]) => {
        setVehicles(v);
        setCustomers(c);
        setCarriers(ca);
        setLocations(l);
        setCostOptions((tc as TripCostOption[]).filter((x) => x.isActive));
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
          phiNangName: phiNang.id ? phiNang.name : undefined,
          phiNangAmount: phiNang.id ? toNum(phiNang.amount) : undefined,
          shdNang: phiNang.id ? toStr(phiNang.shd) : undefined,
          phiHaName: phiHa.id ? phiHa.name : undefined,
          phiHaAmount: phiHa.id ? toNum(phiHa.amount) : undefined,
          shdHa: phiHa.id ? toStr(phiHa.shd) : undefined,
          phiVeSinhName: phiVeSinh.id ? phiVeSinh.name : undefined,
          phiVeSinhAmount: phiVeSinh.id ? toNum(phiVeSinh.amount) : undefined,
          shdVeSinh: phiVeSinh.id ? toStr(phiVeSinh.shd) : undefined,
          phiCuocName: phiCuoc.id ? phiCuoc.name : undefined,
          phiCuocAmount: phiCuoc.id ? toNum(phiCuoc.amount) : undefined,
          veCongName: veCong.id ? veCong.name : undefined,
          veCongAmount: veCong.id ? toNum(veCong.amount) : undefined,
          shdVeCong: veCong.id ? toStr(veCong.shd) : undefined,
          chiPhiKhacName: chiPhiKhac.id ? chiPhiKhac.name : undefined,
          chiPhiKhacAmount: chiPhiKhac.id ? toNum(chiPhiKhac.amount) : undefined,
          chiPhiTraiTuyenName: chiPhiTraiTuyen.id ? chiPhiTraiTuyen.name : undefined,
          chiPhiTraiTuyenAmount: chiPhiTraiTuyen.id ? toNum(chiPhiTraiTuyen.amount) : undefined,
          cauDuongName: cauDuong.id ? cauDuong.name : undefined,
          cauDuongAmount: cauDuong.id ? toNum(cauDuong.amount) : undefined,
          chiPhiPhatSinhName: chiPhiPhatSinh.name.trim() || undefined,
          chiPhiPhatSinhAmount: toNum(chiPhiPhatSinh.amount),
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message ?? "Lỗi không xác định");
      }
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi không xác định");
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

  const costSelectOpts = [
    <option key="" value="">
      — Không chọn —
    </option>,
    ...costOptions.map((c) => (
      <option key={c.id} value={c.id}>
        {c.name}
        {c.amount != null ? ` (${c.amount.toLocaleString("vi-VN")})` : ""}
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
                <select
                  value={phiNang.id}
                  onChange={(e) => selectCostSlot(setPhiNang, e.target.value)}
                  style={{ ...inputStyle, flex: 2 }}
                >
                  {costSelectOpts}
                </select>
                <input
                  type="number"
                  min={1}
                  value={phiNang.amount}
                  onChange={(e) => setPhiNang({ ...phiNang, amount: e.target.value })}
                  style={{ ...inputStyle, flex: 1 }}
                  placeholder="VND"
                  disabled={!phiNang.id}
                />
                <input
                  type="text"
                  value={phiNang.shd}
                  onChange={(e) => setPhiNang({ ...phiNang, shd: e.target.value })}
                  style={{ ...inputStyle, flex: 1 }}
                  placeholder="SHĐ"
                  disabled={!phiNang.id}
                />
              </div>
            </div>
            <div style={{ padding: "8px 12px", borderBottom: "1px solid #e2e8f0" }}>
              <span style={costLabelStyle}>PHÍ HẠ</span>
              <div style={{ display: "flex", gap: 4 }}>
                <select
                  value={phiHa.id}
                  onChange={(e) => selectCostSlot(setPhiHa, e.target.value)}
                  style={{ ...inputStyle, flex: 2 }}
                >
                  {costSelectOpts}
                </select>
                <input
                  type="number"
                  min={1}
                  value={phiHa.amount}
                  onChange={(e) => setPhiHa({ ...phiHa, amount: e.target.value })}
                  style={{ ...inputStyle, flex: 1 }}
                  placeholder="VND"
                  disabled={!phiHa.id}
                />
                <input
                  type="text"
                  value={phiHa.shd}
                  onChange={(e) => setPhiHa({ ...phiHa, shd: e.target.value })}
                  style={{ ...inputStyle, flex: 1 }}
                  placeholder="SHĐ"
                  disabled={!phiHa.id}
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
                <select
                  value={phiVeSinh.id}
                  onChange={(e) => selectCostSlot(setPhiVeSinh, e.target.value)}
                  style={{ ...inputStyle, flex: 2 }}
                >
                  {costSelectOpts}
                </select>
                <input
                  type="number"
                  min={1}
                  value={phiVeSinh.amount}
                  onChange={(e) => setPhiVeSinh({ ...phiVeSinh, amount: e.target.value })}
                  style={{ ...inputStyle, flex: 1 }}
                  placeholder="VND"
                  disabled={!phiVeSinh.id}
                />
                <input
                  type="text"
                  value={phiVeSinh.shd}
                  onChange={(e) => setPhiVeSinh({ ...phiVeSinh, shd: e.target.value })}
                  style={{ ...inputStyle, flex: 1 }}
                  placeholder="SHĐ"
                  disabled={!phiVeSinh.id}
                />
              </div>
            </div>
            <div style={{ padding: "8px 12px", borderBottom: "1px solid #e2e8f0" }}>
              <span style={costLabelStyle}>PHÍ CƯỢC</span>
              <div style={{ display: "flex", gap: 4 }}>
                <select
                  value={phiCuoc.id}
                  onChange={(e) => selectCostSlot(setPhiCuoc, e.target.value)}
                  style={{ ...inputStyle, flex: 2 }}
                >
                  {costSelectOpts}
                </select>
                <input
                  type="number"
                  min={1}
                  value={phiCuoc.amount}
                  onChange={(e) => setPhiCuoc({ ...phiCuoc, amount: e.target.value })}
                  style={{ ...inputStyle, flex: 1 }}
                  placeholder="VND"
                  disabled={!phiCuoc.id}
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
              <span style={costLabelStyle}>VÉ CỔNG</span>
              <div style={{ display: "flex", gap: 4 }}>
                <select
                  value={veCong.id}
                  onChange={(e) => selectCostSlot(setVeCong, e.target.value)}
                  style={{ ...inputStyle, flex: 2 }}
                >
                  {costSelectOpts}
                </select>
                <input
                  type="number"
                  min={1}
                  value={veCong.amount}
                  onChange={(e) => setVeCong({ ...veCong, amount: e.target.value })}
                  style={{ ...inputStyle, flex: 1 }}
                  placeholder="VND"
                  disabled={!veCong.id}
                />
                <input
                  type="text"
                  value={veCong.shd}
                  onChange={(e) => setVeCong({ ...veCong, shd: e.target.value })}
                  style={{ ...inputStyle, flex: 1 }}
                  placeholder="SHĐ"
                  disabled={!veCong.id}
                />
              </div>
            </div>
            <div style={{ padding: "8px 12px", borderBottom: "1px solid #e2e8f0" }}>
              <span style={costLabelStyle}>CHI PHÍ KHÁC / PHÍ ĐỨT TEM</span>
              <div style={{ display: "flex", gap: 4 }}>
                <select
                  value={chiPhiKhac.id}
                  onChange={(e) => selectCostSlot(setChiPhiKhac, e.target.value)}
                  style={{ ...inputStyle, flex: 2 }}
                >
                  {costSelectOpts}
                </select>
                <input
                  type="number"
                  min={1}
                  value={chiPhiKhac.amount}
                  onChange={(e) => setChiPhiKhac({ ...chiPhiKhac, amount: e.target.value })}
                  style={{ ...inputStyle, flex: 1 }}
                  placeholder="VND"
                  disabled={!chiPhiKhac.id}
                />
              </div>
            </div>
            <div style={{ padding: "8px 12px", borderRight: "1px solid #e2e8f0" }}>
              <span style={costLabelStyle}>TRÁI TUYẾN / CHỈ ĐỊNH / BP CAM</span>
              <div style={{ display: "flex", gap: 4 }}>
                <select
                  value={chiPhiTraiTuyen.id}
                  onChange={(e) => selectCostSlot(setChiPhiTraiTuyen, e.target.value)}
                  style={{ ...inputStyle, flex: 2 }}
                >
                  {costSelectOpts}
                </select>
                <input
                  type="number"
                  min={1}
                  value={chiPhiTraiTuyen.amount}
                  onChange={(e) =>
                    setChiPhiTraiTuyen({ ...chiPhiTraiTuyen, amount: e.target.value })
                  }
                  style={{ ...inputStyle, flex: 1 }}
                  placeholder="VND"
                  disabled={!chiPhiTraiTuyen.id}
                />
              </div>
            </div>
            <div style={{ padding: "8px 12px" }}>
              <span style={costLabelStyle}>CẦU ĐƯỜNG</span>
              <div style={{ display: "flex", gap: 4 }}>
                <select
                  value={cauDuong.id}
                  onChange={(e) => selectCostSlot(setCauDuong, e.target.value)}
                  style={{ ...inputStyle, flex: 2 }}
                >
                  {costSelectOpts}
                </select>
                <input
                  type="number"
                  min={1}
                  value={cauDuong.amount}
                  onChange={(e) => setCauDuong({ ...cauDuong, amount: e.target.value })}
                  style={{ ...inputStyle, flex: 1 }}
                  placeholder="VND"
                  disabled={!cauDuong.id}
                />
              </div>
            </div>
          </div>
          <div style={{ borderTop: "1px solid #e2e8f0", padding: "8px 12px" }}>
            <span style={costLabelStyle}>CHI PHÍ PHÁT SINH KHÁC (THANH LÝ - CHI HỘ)</span>
            <div style={{ display: "flex", gap: 4 }}>
              <input
                type="text"
                value={chiPhiPhatSinh.name}
                onChange={(e) => setChiPhiPhatSinh({ ...chiPhiPhatSinh, name: e.target.value })}
                style={{ ...inputStyle, flex: 2 }}
                placeholder="Mô tả chi phí..."
              />
              <input
                type="number"
                min={1}
                value={chiPhiPhatSinh.amount}
                onChange={(e) => setChiPhiPhatSinh({ ...chiPhiPhatSinh, amount: e.target.value })}
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

// ─── PAGINATION ───────────────────────────────────────────────────────────────

function getPageNumbers(current: number, total: number): number[] {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 3) return [1, 2, 3, 4, 5];
  if (current >= total - 2) return [total - 4, total - 3, total - 2, total - 1, total];
  return [current - 2, current - 1, current, current + 1, current + 2];
}

// ─── MAIN PAGE ───────────────────────────────────────────────────────────────

export default function TripPlansPage() {
  const [trips, setTrips] = useState<TripPlanRow[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [rawSearch, setRawSearch] = useState("");
  const [filterCustomers, setFilterCustomers] = useState<NamedOption[]>([]);
  const [filterCarriers, setFilterCarriers] = useState<NamedOption[]>([]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [costModalTripId, setCostModalTripId] = useState<string | null>(null);

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
          setActionError(null);
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

  async function handleStatusUpdate(id: string, status: TripStatus) {
    setActionError(null);
    try {
      const res = await fetch(`/api/trip-plans/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message ?? "Lỗi cập nhật");
      }
      setFilters((f) => ({ ...f }));
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Lỗi không xác định");
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
      {costModalTripId && (
        <CostModal
          tripId={costModalTripId}
          onClose={() => setCostModalTripId(null)}
          onDone={() => {
            setCostModalTripId(null);
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

      {actionError && (
        <p
          style={{
            color: "#dc2626",
            background: "#fef2f2",
            padding: "10px 14px",
            borderRadius: 8,
            fontSize: 13,
            marginBottom: 16,
          }}
        >
          {actionError}
        </p>
      )}

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
                    const next = NEXT_STATUS[trip.status];
                    const isTerminal = TERMINAL.includes(trip.status);
                    const rowBg = i % 2 === 0 ? "#fff" : "#fafafa";

                    return (
                      <tr key={trip.id} style={{ background: rowBg }}>
                        <td style={tdStyle}>{trip.tripNumber ?? "—"}</td>
                        <td style={tdStyle}>
                          {new Date(trip.tripDate).toLocaleDateString("vi-VN")}
                        </td>
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
                        <td style={tdStyle}>
                          {trip.documentSentDate
                            ? new Date(trip.documentSentDate).toLocaleDateString("vi-VN")
                            : ""}
                        </td>
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
                          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                            {next && (
                              <button
                                onClick={() => handleStatusUpdate(trip.id, next.status)}
                                style={{
                                  padding: "3px 8px",
                                  fontSize: 11,
                                  fontWeight: 500,
                                  background: "#2563eb",
                                  color: "#fff",
                                  border: "none",
                                  borderRadius: 4,
                                  cursor: "pointer",
                                }}
                              >
                                {next.label}
                              </button>
                            )}
                            {!isTerminal && (
                              <button
                                onClick={() => handleStatusUpdate(trip.id, "CANCELLED")}
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
                                Hủy
                              </button>
                            )}
                            {trip.status !== "CANCELLED" && (
                              <button
                                onClick={() => setCostModalTripId(trip.id)}
                                style={{
                                  padding: "3px 8px",
                                  fontSize: 11,
                                  background: "#f0fdf4",
                                  color: "#16a34a",
                                  border: "1px solid #bbf7d0",
                                  borderRadius: 4,
                                  cursor: "pointer",
                                }}
                              >
                                + Chi phí
                              </button>
                            )}
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
