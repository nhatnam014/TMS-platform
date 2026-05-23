"use client";

import { useEffect, useState } from "react";
import type { PaginatedResponse, TripStatus, ServiceType, CostType } from "@tms/shared";
import { SERVICE_TYPE_LABELS, COST_TYPE_LABELS } from "@tms/shared";

interface TripPlanRow {
  id: string;
  tripDate: string;
  tripNumber: number | null;
  serviceType: string;
  status: TripStatus;
  vehicle: { id: string; licensePlate: string; vehicleType: string } | null;
  customer: { id: string; name: string } | null;
  carrier: { id: string; name: string } | null;
}

interface NamedOption { id: string; code: string; name: string; locationType?: string; }
interface VehicleOption { id: string; licensePlate: string; vehicleType: string; }

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
  dateFrom: "", dateTo: "", status: "", customerId: "",
  carrierId: "", serviceType: "", search: "", page: 1,
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

const ALL_STATUSES: TripStatus[] = ["PLANNED", "DISPATCHED", "IN_TRANSIT", "COMPLETED", "CANCELLED"];
const ALL_SERVICE_TYPES: ServiceType[] = ["SEA_EXPORT", "SEA_IMPORT", "NEO_EXPORT", "NEO_IMPORT"];

// ─── MODAL OVERLAY ──────────────────────────────────────────────────────────

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#fff", borderRadius: 12, padding: 28, width: 480, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 8px 40px rgba(0,0,0,0.18)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>{title}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#64748b" }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "block", marginBottom: 14 }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>{label}</span>
      {children}
    </label>
  );
}

const inputStyle: React.CSSProperties = { width: "100%", padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 13, boxSizing: "border-box" };
const btnPrimary: React.CSSProperties = { padding: "8px 18px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer" };
const btnSecondary: React.CSSProperties = { padding: "8px 18px", background: "#f1f5f9", color: "#374151", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 13, cursor: "pointer" };

// ─── COST MODAL ─────────────────────────────────────────────────────────────

function CostModal({ tripId, onClose, onDone }: { tripId: string; onClose: () => void; onDone: () => void }) {
  const [costType, setCostType] = useState<CostType>("LIFTING");
  const [amount, setAmount] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amt = Number(amount);
    if (!amt || amt <= 0) { setError("Số tiền phải lớn hơn 0"); return; }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/trip-plans/${tripId}/costs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ costType, amount: amt, invoiceNumber: invoiceNumber || undefined, description: description || undefined }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.message ?? "Lỗi không xác định"); }
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
          <select value={costType} onChange={(e) => setCostType(e.target.value as CostType)} style={inputStyle}>
            {(Object.keys(COST_TYPE_LABELS) as CostType[]).map((k) => (
              <option key={k} value={k}>{COST_TYPE_LABELS[k]}</option>
            ))}
          </select>
        </Field>
        <Field label="Số tiền (VND) *">
          <input type="number" min={1} value={amount} onChange={(e) => setAmount(e.target.value)} style={inputStyle} placeholder="1200000" required />
        </Field>
        <Field label="Số hóa đơn">
          <input type="text" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} style={inputStyle} />
        </Field>
        <Field label="Ghi chú">
          <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} style={inputStyle} />
        </Field>
        {error && <p style={{ color: "#dc2626", fontSize: 13, marginBottom: 12 }}>{error}</p>}
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }}>
          <button type="button" onClick={onClose} style={btnSecondary}>Hủy</button>
          <button type="submit" disabled={loading} style={btnPrimary}>{loading ? "Đang lưu..." : "Lưu"}</button>
        </div>
      </form>
    </Modal>
  );
}

// ─── CREATE TRIP MODAL ───────────────────────────────────────────────────────

function CreateTripModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
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
  const [pickupLocationId, setPickupLocationId] = useState("");
  const [loadUnloadLocationId, setLoadUnloadLocationId] = useState("");
  const [dropoffLocationId, setDropoffLocationId] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/vehicles").then((r) => r.json()),
      fetch("/api/customers").then((r) => r.json()),
      fetch("/api/carriers").then((r) => r.json()),
      fetch("/api/locations").then((r) => r.json()),
    ]).then(([v, c, ca, l]) => {
      setVehicles(v);
      setCustomers(c);
      setCarriers(ca);
      setLocations(l);
      if (v.length) setVehicleId(v[0].id);
      if (c.length) setCustomerId(c[0].id);
    }).catch(() => {}).finally(() => setLoadingRefs(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!vehicleId || !customerId) { setError("Vui lòng chọn xe và khách hàng"); return; }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/trip-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tripDate, serviceType, vehicleId, customerId,
          carrierId: carrierId || undefined,
          pickupLocationId: pickupLocationId || undefined,
          loadUnloadLocationId: loadUnloadLocationId || undefined,
          dropoffLocationId: dropoffLocationId || undefined,
          notes: notes || undefined,
        }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.message ?? "Lỗi không xác định"); }
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

  const locationOptions = [<option key="" value="">— Không chọn —</option>, ...locations.map((l) => (
    <option key={l.id} value={l.id}>{l.name}</option>
  ))];

  return (
    <Modal title="Tạo chuyến mới" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <Field label="Ngày chuyến *">
          <input type="date" value={tripDate} onChange={(e) => setTripDate(e.target.value)} style={inputStyle} required />
        </Field>
        <Field label="Loại dịch vụ *">
          <select value={serviceType} onChange={(e) => setServiceType(e.target.value as ServiceType)} style={inputStyle}>
            {(Object.keys(SERVICE_TYPE_LABELS) as ServiceType[]).map((k) => (
              <option key={k} value={k}>{SERVICE_TYPE_LABELS[k]}</option>
            ))}
          </select>
        </Field>
        <Field label="Xe *">
          <select value={vehicleId} onChange={(e) => setVehicleId(e.target.value)} style={inputStyle} required>
            {vehicles.map((v) => <option key={v.id} value={v.id}>{v.licensePlate}</option>)}
          </select>
        </Field>
        <Field label="Khách hàng *">
          <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} style={inputStyle} required>
            {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
        <Field label="Đơn vị vận chuyển">
          <select value={carrierId} onChange={(e) => setCarrierId(e.target.value)} style={inputStyle}>
            <option value="">— Không chọn —</option>
            {carriers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
        <Field label="Điểm lấy (R/H)">
          <select value={pickupLocationId} onChange={(e) => setPickupLocationId(e.target.value)} style={inputStyle}>{locationOptions}</select>
        </Field>
        <Field label="Điểm đóng/rút">
          <select value={loadUnloadLocationId} onChange={(e) => setLoadUnloadLocationId(e.target.value)} style={inputStyle}>{locationOptions}</select>
        </Field>
        <Field label="Điểm hạ (R/H)">
          <select value={dropoffLocationId} onChange={(e) => setDropoffLocationId(e.target.value)} style={inputStyle}>{locationOptions}</select>
        </Field>
        <Field label="Ghi chú">
          <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} style={inputStyle} />
        </Field>
        {error && <p style={{ color: "#dc2626", fontSize: 13, marginBottom: 12 }}>{error}</p>}
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }}>
          <button type="button" onClick={onClose} style={btnSecondary}>Hủy</button>
          <button type="submit" disabled={loading} style={btnPrimary}>{loading ? "Đang tạo..." : "Tạo chuyến"}</button>
        </div>
      </form>
    </Modal>
  );
}

// ─── PAGINATION HELPERS ───────────────────────────────────────────────────────

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

  // Single filter state object — changing it triggers re-fetch
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  // Raw search input — debounced into filters.search
  const [rawSearch, setRawSearch] = useState("");

  // Reference data for filter dropdowns
  const [filterCustomers, setFilterCustomers] = useState<NamedOption[]>([]);
  const [filterCarriers, setFilterCarriers] = useState<NamedOption[]>([]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [costModalTripId, setCostModalTripId] = useState<string | null>(null);

  // Fetch filter reference data on mount
  useEffect(() => {
    Promise.all([
      fetch("/api/customers").then((r) => r.json()),
      fetch("/api/carriers").then((r) => r.json()),
    ]).then(([c, ca]) => {
      setFilterCustomers(c);
      setFilterCarriers(ca);
    }).catch(() => {});
  }, []);

  // Debounce search input: 400ms after user stops typing, update filters
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((f) => ({ ...f, search: rawSearch, page: 1 }));
    }, 400);
    return () => clearTimeout(timer);
  }, [rawSearch]);

  // Fetch trips whenever filters change
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
    return () => { cancelled = true; };
  }, [filters]);

  function setFilterField<K extends keyof FilterState>(key: K, value: FilterState[K]) {
    setFilters((f) => ({ ...f, [key]: value, page: 1 }));
  }

  function goToPage(page: number) {
    setFilters((f) => ({ ...f, page }));
  }

  function clearFilters() {
    setRawSearch("");
    setFilters(DEFAULT_FILTERS);
  }

  async function handleStatusUpdate(id: string, status: TripStatus) {
    setActionError(null);
    try {
      const res = await fetch(`/api/trip-plans/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.message ?? "Lỗi cập nhật"); }
      // Trigger re-fetch by creating a new filters object reference
      setFilters((f) => ({ ...f }));
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Lỗi không xác định");
    }
  }

  const hasActiveFilter =
    filters.dateFrom || filters.dateTo || filters.status || filters.customerId ||
    filters.carrierId || filters.serviceType || filters.search || rawSearch;

  const selectStyle: React.CSSProperties = { fontSize: 13, padding: "6px 8px", borderRadius: 6, border: "1px solid #e2e8f0", background: "#fff", color: "#0f172a" };

  const startItem = total === 0 ? 0 : (filters.page - 1) * 20 + 1;
  const endItem = Math.min(filters.page * 20, total);

  return (
    <div>
      {showCreateModal && (
        <CreateTripModal
          onClose={() => setShowCreateModal(false)}
          onDone={() => { setShowCreateModal(false); setFilters((f) => ({ ...f })); }}
        />
      )}
      {costModalTripId && (
        <CostModal
          tripId={costModalTripId}
          onClose={() => setCostModalTripId(null)}
          onDone={() => { setCostModalTripId(null); setFilters((f) => ({ ...f })); }}
        />
      )}

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>Kế hoạch chuyến</h1>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {!loading && <span style={{ fontSize: 13, color: "#64748b" }}>{total} chuyến</span>}
          <button onClick={() => setShowCreateModal(true)} style={{ ...btnPrimary, display: "flex", alignItems: "center", gap: 6 }}>
            + Tạo chuyến
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div style={{ background: "#fff", borderRadius: 10, padding: "14px 16px", boxShadow: "0 1px 4px rgba(0,0,0,0.07)", marginBottom: 16, display: "flex", flexWrap: "wrap", gap: 10, alignItems: "flex-end" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em" }}>Từ ngày</span>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => setFilterField("dateFrom", e.target.value)}
            style={{ ...selectStyle, padding: "5px 8px" }}
          />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em" }}>Đến ngày</span>
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => setFilterField("dateTo", e.target.value)}
            style={{ ...selectStyle, padding: "5px 8px" }}
          />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em" }}>Trạng thái</span>
          <select value={filters.status} onChange={(e) => setFilterField("status", e.target.value as TripStatus | "")} style={selectStyle}>
            <option value="">Tất cả</option>
            {ALL_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em" }}>Khách hàng</span>
          <select value={filters.customerId} onChange={(e) => setFilterField("customerId", e.target.value)} style={selectStyle}>
            <option value="">Tất cả</option>
            {filterCustomers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em" }}>Đơn vị VC</span>
          <select value={filters.carrierId} onChange={(e) => setFilterField("carrierId", e.target.value)} style={selectStyle}>
            <option value="">Tất cả</option>
            {filterCarriers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em" }}>Dịch vụ</span>
          <select value={filters.serviceType} onChange={(e) => setFilterField("serviceType", e.target.value as ServiceType | "")} style={selectStyle}>
            <option value="">Tất cả</option>
            {ALL_SERVICE_TYPES.map((s) => <option key={s} value={s}>{SERVICE_TYPE_LABELS[s] ?? s}</option>)}
          </select>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1, minWidth: 200 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em" }}>Tìm kiếm</span>
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
            onClick={clearFilters}
            style={{ ...btnSecondary, padding: "6px 12px", fontSize: 12, alignSelf: "flex-end" }}
          >
            Xóa bộ lọc
          </button>
        )}
      </div>

      {actionError && (
        <p style={{ color: "#dc2626", background: "#fef2f2", padding: "10px 14px", borderRadius: 8, fontSize: 13, marginBottom: 16 }}>
          {actionError}
        </p>
      )}

      {/* Table */}
      {loading ? (
        <p style={{ color: "#64748b", fontSize: 14 }}>Đang tải...</p>
      ) : error ? (
        <p style={{ color: "#dc2626", background: "#fef2f2", padding: "12px 16px", borderRadius: 8 }}>{error}</p>
      ) : (
        <>
          <div style={{ background: "#fff", borderRadius: 10, boxShadow: "0 1px 4px rgba(0,0,0,0.07)", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                  {["Ngày", "STT", "Loại dịch vụ", "Xe", "Khách hàng", "Trạng thái", "Thao tác"].map((h) => (
                    <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {trips.length === 0 ? (
                  <tr><td colSpan={7} style={{ padding: 32, textAlign: "center", color: "#94a3b8" }}>Không có dữ liệu</td></tr>
                ) : (
                  trips.map((trip, i) => {
                    const next = NEXT_STATUS[trip.status];
                    const isTerminal = TERMINAL.includes(trip.status);
                    return (
                      <tr key={trip.id} style={{ borderBottom: "1px solid #f1f5f9", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                        <td style={{ padding: "10px 14px", fontSize: 13 }}>
                          {new Date(trip.tripDate).toLocaleDateString("vi-VN")}
                        </td>
                        <td style={{ padding: "10px 14px", fontSize: 13, color: "#64748b" }}>{trip.tripNumber ?? "—"}</td>
                        <td style={{ padding: "10px 14px", fontSize: 13 }}>
                          {SERVICE_TYPE_LABELS[trip.serviceType as ServiceType] ?? trip.serviceType}
                        </td>
                        <td style={{ padding: "10px 14px", fontSize: 13, fontFamily: "monospace" }}>
                          {trip.vehicle?.licensePlate ?? "—"}
                        </td>
                        <td style={{ padding: "10px 14px", fontSize: 13 }}>{trip.customer?.name ?? "—"}</td>
                        <td style={{ padding: "10px 14px" }}>
                          <span style={{
                            display: "inline-block", padding: "2px 10px", borderRadius: 12,
                            fontSize: 12, fontWeight: 500,
                            background: `${STATUS_COLORS[trip.status]}18`,
                            color: STATUS_COLORS[trip.status],
                          }}>
                            {STATUS_LABELS[trip.status]}
                          </span>
                        </td>
                        <td style={{ padding: "10px 14px" }}>
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                            {next && (
                              <button
                                onClick={() => handleStatusUpdate(trip.id, next.status)}
                                style={{ padding: "4px 10px", fontSize: 12, fontWeight: 500, background: "#2563eb", color: "#fff", border: "none", borderRadius: 5, cursor: "pointer" }}
                              >
                                {next.label}
                              </button>
                            )}
                            {!isTerminal && (
                              <button
                                onClick={() => handleStatusUpdate(trip.id, "CANCELLED")}
                                style={{ padding: "4px 10px", fontSize: 12, fontWeight: 500, background: "#fef2f2", color: "#ef4444", border: "1px solid #fecaca", borderRadius: 5, cursor: "pointer" }}
                              >
                                Hủy
                              </button>
                            )}
                            {trip.status === "COMPLETED" && (
                              <button
                                onClick={() => setCostModalTripId(trip.id)}
                                style={{ padding: "4px 10px", fontSize: 12, fontWeight: 500, background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0", borderRadius: 5, cursor: "pointer" }}
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 16, flexWrap: "wrap", gap: 8 }}>
              <span style={{ fontSize: 13, color: "#64748b" }}>
                Hiển thị {startItem}–{endItem} / {total} chuyến
              </span>
              <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                <button
                  onClick={() => goToPage(filters.page - 1)}
                  disabled={filters.page === 1}
                  style={{ padding: "5px 12px", fontSize: 13, borderRadius: 6, border: "1px solid #e2e8f0", background: filters.page === 1 ? "#f8fafc" : "#fff", color: filters.page === 1 ? "#cbd5e1" : "#374151", cursor: filters.page === 1 ? "default" : "pointer" }}
                >
                  ← Trước
                </button>
                {getPageNumbers(filters.page, totalPages).map((p) => (
                  <button
                    key={p}
                    onClick={() => goToPage(p)}
                    style={{ padding: "5px 10px", fontSize: 13, borderRadius: 6, border: "1px solid #e2e8f0", background: p === filters.page ? "#2563eb" : "#fff", color: p === filters.page ? "#fff" : "#374151", fontWeight: p === filters.page ? 700 : 400, cursor: "pointer" }}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => goToPage(filters.page + 1)}
                  disabled={filters.page === totalPages}
                  style={{ padding: "5px 12px", fontSize: 13, borderRadius: 6, border: "1px solid #e2e8f0", background: filters.page === totalPages ? "#f8fafc" : "#fff", color: filters.page === totalPages ? "#cbd5e1" : "#374151", cursor: filters.page === totalPages ? "default" : "pointer" }}
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
