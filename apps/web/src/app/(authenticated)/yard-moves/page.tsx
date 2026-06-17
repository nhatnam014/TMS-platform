"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/lib/toast-context";
import { formatDate } from "@/lib/date-utils";
import { SelectInput } from "@/components/SelectInput";

type YardMoveStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
type YardCostType = "YARD_HANDLING" | "FORKLIFT" | "OVERTIME" | "OTHER";
type FactoryZone = "STAGING_DROP" | "LOADING_DOCK" | "STAGING_READY";

interface YardMoveCost {
  id: string;
  type: YardCostType;
  amount: number;
  note: string | null;
}

interface YardMoveRow {
  id: string;
  date: string;
  status: YardMoveStatus;
  fromZone: FactoryZone;
  toZone: FactoryZone;
  notes: string | null;
  containerNumber: string;
  location: { id: string; code: string; name: string } | null;
  costs: YardMoveCost[];
}

interface LocationOption {
  id: string;
  code: string;
  name: string;
}

const STATUS_LABELS: Record<YardMoveStatus, string> = {
  PENDING: "Chờ xử lý",
  IN_PROGRESS: "Đang thực hiện",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã hủy",
};

const STATUS_COLORS: Record<YardMoveStatus, { bg: string; color: string }> = {
  PENDING: { bg: "#f1f5f9", color: "#64748b" },
  IN_PROGRESS: { bg: "#dbeafe", color: "#1d4ed8" },
  COMPLETED: { bg: "#dcfce7", color: "#166534" },
  CANCELLED: { bg: "#fee2e2", color: "#b91c1c" },
};

const ZONE_LABELS: Record<FactoryZone, string> = {
  STAGING_DROP: "Khu nhập",
  LOADING_DOCK: "Bến đóng hàng",
  STAGING_READY: "Khu xuất",
};

const FACTORY_ZONES: FactoryZone[] = ["STAGING_DROP", "LOADING_DOCK", "STAGING_READY"];

const COST_TYPE_LABELS: Record<YardCostType, string> = {
  YARD_HANDLING: "Xếp dỡ bãi",
  FORKLIFT: "Xe nâng",
  OVERTIME: "Ngoài giờ",
  OTHER: "Khác",
};

const NEXT_STATUS: Partial<Record<YardMoveStatus, { status: YardMoveStatus; label: string }>> = {
  PENDING: { status: "IN_PROGRESS", label: "Bắt đầu" },
  IN_PROGRESS: { status: "COMPLETED", label: "Hoàn thành" },
};

const TERMINAL: YardMoveStatus[] = ["COMPLETED", "CANCELLED"];

// ─── MODAL ───────────────────────────────────────────────────────────────────

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
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

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
      onWheel={(e) => e.stopPropagation()}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          padding: 28,
          width: wide ? "min(95vw, 760px)" : 520,
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

// ─── Shared form styles ───────────────────────────────────────────────────────

const ymInputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  border: "1px solid #d1d5db",
  borderRadius: 6,
  fontSize: 13,
  boxSizing: "border-box",
};

const ymBtnPrimary: React.CSSProperties = {
  padding: "8px 18px",
  background: "#2563eb",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
};

const ymBtnSecondary: React.CSSProperties = {
  padding: "8px 18px",
  background: "#f1f5f9",
  color: "#374151",
  border: "1px solid #e2e8f0",
  borderRadius: 6,
  fontSize: 13,
  cursor: "pointer",
};

function YmField({ label, children }: { label: string; children: React.ReactNode }) {
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

// ─── CREATE MODAL ─────────────────────────────────────────────────────────────

function CreateYardMoveModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const toast = useToast();
  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [containerNumber, setContainerNumber] = useState("");
  const [fromZone, setFromZone] = useState("");
  const [toZone, setToZone] = useState("");
  const [locationId, setLocationId] = useState("");
  const [notes, setNotes] = useState("");

  const zoneOptions = FACTORY_ZONES.map((z) => ({ value: z, label: ZONE_LABELS[z] }));
  const locationSelectOptions = locations.map((l) => ({
    value: l.id,
    label: `${l.name} (${l.code})`,
  }));

  useEffect(() => {
    fetch("/api/locations?limit=500")
      .then((r) => r.json())
      .then((res) => setLocations(res.data ?? res))
      .catch(() => {})
      .finally(() => setLoadingOptions(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!date || !containerNumber || !fromZone || !toZone || !locationId) {
      setFormError("Vui lòng điền đầy đủ các trường bắt buộc.");
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      const res = await fetch("/api/yard-moves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          containerNumber,
          fromZone,
          toZone,
          locationId,
          notes: notes || undefined,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message ?? `Lỗi ${res.status}`);
      }
      toast.success("Tạo lệnh bãi thành công");
      onCreated();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Lỗi không xác định";
      setFormError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal title="Tạo lệnh bãi mới" onClose={onClose} wide>
      {loadingOptions ? (
        <p style={{ textAlign: "center", color: "#94a3b8", padding: "24px 0" }}>
          Đang tải dữ liệu...
        </p>
      ) : (
        <form onSubmit={handleSubmit}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "0 20px",
              border: "1px solid #e2e8f0",
              borderRadius: 8,
              padding: "16px 20px",
              marginBottom: 16,
            }}
          >
            <YmField label="Ngày *">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                style={ymInputStyle}
                required
              />
            </YmField>
            <YmField label="Số Container * (VD: ABCD1234567)">
              <input
                type="text"
                value={containerNumber}
                onChange={(e) => setContainerNumber(e.target.value.toUpperCase())}
                pattern="[A-Z]{4}[0-9]{7}"
                placeholder="ABCD1234567"
                style={ymInputStyle}
                required
              />
            </YmField>
            <YmField label="Từ khu vực *">
              <SelectInput
                options={zoneOptions}
                value={fromZone}
                onChange={setFromZone}
                placeholder="— Chọn khu vực —"
                required
              />
            </YmField>
            <YmField label="Đến khu vực *">
              <SelectInput
                options={zoneOptions}
                value={toZone}
                onChange={setToZone}
                placeholder="— Chọn khu vực —"
                required
              />
            </YmField>
            <div style={{ gridColumn: "1 / -1" }}>
              <YmField label="Địa điểm *">
                <SelectInput
                  options={locationSelectOptions}
                  value={locationId}
                  onChange={setLocationId}
                  placeholder="— Chọn địa điểm —"
                  required
                />
              </YmField>
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <YmField label="Ghi chú">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  style={{ ...ymInputStyle, resize: "vertical" }}
                />
              </YmField>
            </div>
          </div>
          {formError && (
            <p style={{ color: "#dc2626", fontSize: 13, marginBottom: 12 }}>{formError}</p>
          )}
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button type="button" onClick={onClose} style={ymBtnSecondary}>
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{ ...ymBtnPrimary, opacity: submitting ? 0.7 : 1 }}
            >
              {submitting ? "Đang tạo..." : "Tạo lệnh bãi"}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}

// ─── COST MODAL ───────────────────────────────────────────────────────────────

function CostModal({
  moveId,
  onClose,
  onAdded,
}: {
  moveId: string;
  onClose: () => void;
  onAdded: () => void;
}) {
  const toast = useToast();
  const [type, setType] = useState<YardCostType>("YARD_HANDLING");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amt = Number(amount);
    if (!amount || isNaN(amt) || amt <= 0) {
      setFormError("Vui lòng nhập số tiền hợp lệ.");
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      const res = await fetch(`/api/yard-moves/${moveId}/costs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, amount: amt, note: note || undefined }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message ?? `Lỗi ${res.status}`);
      }
      toast.success("Thêm chi phí bãi thành công");
      onAdded();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Lỗi không xác định";
      setFormError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "8px 10px",
    borderRadius: 6,
    border: "1px solid #e2e8f0",
    fontSize: 13,
    boxSizing: "border-box",
  };
  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 12,
    fontWeight: 600,
    color: "#475569",
    marginBottom: 4,
  };

  return (
    <Modal title="Thêm chi phí lệnh bãi" onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <label style={labelStyle}>Loại chi phí *</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as YardCostType)}
            style={inputStyle}
          >
            {(Object.entries(COST_TYPE_LABELS) as [YardCostType, string][]).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Số tiền (VNĐ) *</label>
          <input
            type="number"
            min={1}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            style={inputStyle}
            placeholder="500000"
            required
          />
        </div>
        <div>
          <label style={labelStyle}>Ghi chú</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            style={{ ...inputStyle, resize: "vertical" }}
          />
        </div>
        {formError && <p style={{ color: "#dc2626", fontSize: 13 }}>{formError}</p>}
        <button
          type="submit"
          disabled={submitting}
          style={{
            padding: "9px 18px",
            background: "#10b981",
            color: "#fff",
            border: "none",
            borderRadius: 7,
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {submitting ? "Đang lưu..." : "Thêm chi phí"}
        </button>
      </form>
    </Modal>
  );
}

// ─── EDIT MODAL ───────────────────────────────────────────────────────────────

function EditYardMoveModal({
  move,
  onClose,
  onSaved,
}: {
  move: YardMoveRow;
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [date, setDate] = useState(move.date.slice(0, 10));
  const [containerNumber, setContainerNumber] = useState(move.containerNumber);
  const [fromZone, setFromZone] = useState(move.fromZone as string);
  const [toZone, setToZone] = useState(move.toZone as string);
  const [locationId, setLocationId] = useState(move.location?.id ?? "");
  const [notes, setNotes] = useState(move.notes ?? "");

  const zoneOptions = FACTORY_ZONES.map((z) => ({ value: z, label: ZONE_LABELS[z] }));
  const locationSelectOptions = locations.map((l) => ({
    value: l.id,
    label: `${l.name} (${l.code})`,
  }));

  useEffect(() => {
    fetch("/api/locations?limit=500")
      .then((r) => r.json())
      .then((res) => setLocations(res.data ?? res))
      .catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      const res = await fetch(`/api/yard-moves/${move.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          containerNumber,
          fromZone,
          toZone,
          locationId,
          notes: notes || undefined,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message ?? `Lỗi ${res.status}`);
      }
      toast.success("Cập nhật lệnh bãi thành công");
      onSaved();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Lỗi không xác định";
      setFormError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal title="Sửa lệnh bãi" onClose={onClose} wide>
      <form onSubmit={handleSubmit}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "0 20px",
            border: "1px solid #e2e8f0",
            borderRadius: 8,
            padding: "16px 20px",
            marginBottom: 16,
          }}
        >
          <YmField label="Ngày *">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={ymInputStyle}
              required
            />
          </YmField>
          <YmField label="Số Container * (VD: ABCD1234567)">
            <input
              type="text"
              value={containerNumber}
              onChange={(e) => setContainerNumber(e.target.value.toUpperCase())}
              pattern="[A-Z]{4}[0-9]{7}"
              placeholder="ABCD1234567"
              style={ymInputStyle}
              required
            />
          </YmField>
          <YmField label="Từ khu vực *">
            <SelectInput
              options={zoneOptions}
              value={fromZone}
              onChange={setFromZone}
              placeholder="— Chọn khu vực —"
              required
            />
          </YmField>
          <YmField label="Đến khu vực *">
            <SelectInput
              options={zoneOptions}
              value={toZone}
              onChange={setToZone}
              placeholder="— Chọn khu vực —"
              required
            />
          </YmField>
          <div style={{ gridColumn: "1 / -1" }}>
            <YmField label="Địa điểm *">
              <SelectInput
                options={locationSelectOptions}
                value={locationId}
                onChange={setLocationId}
                placeholder="— Chọn địa điểm —"
                required
              />
            </YmField>
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <YmField label="Ghi chú">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                style={{ ...ymInputStyle, resize: "vertical" }}
              />
            </YmField>
          </div>
        </div>
        {formError && (
          <p style={{ color: "#dc2626", fontSize: 13, marginBottom: 12 }}>{formError}</p>
        )}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button type="button" onClick={onClose} style={ymBtnSecondary}>
            Hủy
          </button>
          <button
            type="submit"
            disabled={submitting}
            style={{ ...ymBtnPrimary, opacity: submitting ? 0.7 : 1 }}
          >
            {submitting ? "Đang lưu..." : "Lưu"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

const PAGE_SIZE_YARD = 10;

export default function YardMovesPage() {
  const toast = useToast();
  const [moves, setMoves] = useState<YardMoveRow[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [costMoveId, setCostMoveId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [editMove, setEditMove] = useState<YardMoveRow | null>(null);
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [statusFilter, setStatusFilter] = useState<YardMoveStatus | "">("");

  function fetchMoves(currentPage = page) {
    const params = new URLSearchParams();
    params.set("page", String(currentPage));
    params.set("limit", String(PAGE_SIZE_YARD));
    if (search.trim()) params.set("search", search.trim());
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    if (statusFilter) params.set("status", statusFilter);
    fetch(`/api/yard-moves?${params.toString()}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`API error ${res.status}`);
        const data = await res.json();
        setMoves(data.data);
        setTotal(data.meta.total);
        setTotalPages(data.meta.totalPages);
        setActionError(null);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Lỗi không xác định"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchMoves(page);
  }, [page, search, dateFrom, dateTo, statusFilter]);

  async function handleSoftDelete(id: string) {
    setConfirmDeleteId(null);
    try {
      const res = await fetch(`/api/yard-moves/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: false }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message ?? `Lỗi ${res.status}`);
      }
      toast.success("Đã xoá lệnh bãi");
      fetchMoves(page);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lỗi xoá lệnh bãi");
    }
  }

  async function handleStatusChange(id: string, status: YardMoveStatus) {
    setActionError(null);
    try {
      const res = await fetch(`/api/yard-moves/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message ?? `Lỗi ${res.status}`);
      }
      toast.success("Cập nhật trạng thái lệnh bãi thành công");
      fetchMoves(page);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Lỗi không xác định";
      setActionError(msg);
      toast.error(msg);
    }
  }

  const btnBase: React.CSSProperties = {
    padding: "4px 10px",
    border: "none",
    borderRadius: 5,
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 24,
        }}
      >
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>Lệnh bãi</h1>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <span style={{ fontSize: 13, color: "#64748b" }}>{total} lệnh</span>
          <button
            onClick={() => setShowCreate(true)}
            style={{
              padding: "7px 16px",
              background: "#3b82f6",
              color: "#fff",
              border: "none",
              borderRadius: 7,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            + Tạo lệnh
          </button>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 16,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <input
          type="text"
          placeholder="Tìm container, khu vực, địa điểm..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          style={{
            padding: "7px 10px",
            border: "1px solid #e2e8f0",
            borderRadius: 6,
            fontSize: 13,
            minWidth: 240,
            flex: "1 1 240px",
          }}
        />
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => {
            setDateFrom(e.target.value);
            setPage(1);
          }}
          style={{
            padding: "7px 10px",
            border: "1px solid #e2e8f0",
            borderRadius: 6,
            fontSize: 13,
          }}
        />
        <span style={{ fontSize: 13, color: "#64748b" }}>—</span>
        <input
          type="date"
          value={dateTo}
          onChange={(e) => {
            setDateTo(e.target.value);
            setPage(1);
          }}
          style={{
            padding: "7px 10px",
            border: "1px solid #e2e8f0",
            borderRadius: 6,
            fontSize: 13,
          }}
        />
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as YardMoveStatus | "");
            setPage(1);
          }}
          style={{
            padding: "7px 10px",
            border: "1px solid #e2e8f0",
            borderRadius: 6,
            fontSize: 13,
          }}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="PENDING">Chờ xử lý</option>
          <option value="IN_PROGRESS">Đang thực hiện</option>
          <option value="COMPLETED">Hoàn thành</option>
          <option value="CANCELLED">Đã hủy</option>
        </select>
      </div>

      {error && (
        <p
          style={{
            color: "#dc2626",
            background: "#fef2f2",
            padding: "12px 16px",
            borderRadius: 8,
            marginBottom: 16,
          }}
        >
          {error}
        </p>
      )}
      {actionError && (
        <p
          style={{
            color: "#dc2626",
            background: "#fef2f2",
            padding: "10px 14px",
            borderRadius: 8,
            marginBottom: 16,
            fontSize: 13,
          }}
        >
          {actionError}
        </p>
      )}

      <div
        style={{
          background: "#fff",
          borderRadius: 10,
          boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
          overflowX: "auto",
        }}
      >
        <table style={{ width: "100%", minWidth: 900, borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
              {[
                "Ngày",
                "Container",
                "Từ khu vực",
                "Đến khu vực",
                "Địa điểm",
                "Trạng thái",
                "Thao tác",
              ].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: "10px 14px",
                    textAlign: "left",
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#64748b",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ padding: 32, textAlign: "center", color: "#94a3b8" }}>
                  Đang tải...
                </td>
              </tr>
            ) : moves.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: 32, textAlign: "center", color: "#94a3b8" }}>
                  Không có dữ liệu
                </td>
              </tr>
            ) : (
              moves.map((m, i) => {
                const { bg, color } = STATUS_COLORS[m.status];
                const next = NEXT_STATUS[m.status];
                const isTerminal = TERMINAL.includes(m.status);
                const showCost = m.status === "IN_PROGRESS" || m.status === "COMPLETED";

                return (
                  <tr
                    key={m.id}
                    style={{
                      borderBottom: "1px solid #f1f5f9",
                      background: i % 2 === 0 ? "#fff" : "#fafafa",
                    }}
                  >
                    <td
                      style={{
                        padding: "10px 14px",
                        fontSize: 12,
                        color: "#64748b",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {formatDate(m.date)}
                    </td>
                    <td style={{ padding: "10px 14px", fontSize: 13 }}>
                      <span style={{ fontWeight: 600, fontFamily: "monospace" }}>
                        {m.containerNumber || "—"}
                      </span>
                    </td>
                    <td style={{ padding: "10px 14px", fontSize: 12, color: "#64748b" }}>
                      {ZONE_LABELS[m.fromZone]}
                    </td>
                    <td style={{ padding: "10px 14px", fontSize: 12, color: "#64748b" }}>
                      {ZONE_LABELS[m.toZone]}
                    </td>
                    <td style={{ padding: "10px 14px", fontSize: 13 }}>
                      {m.location?.name ?? "—"}
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          padding: "3px 8px",
                          borderRadius: 4,
                          background: bg,
                          color,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {STATUS_LABELS[m.status]}
                      </span>
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        <button
                          onClick={() => setEditMove(m)}
                          style={{
                            ...btnBase,
                            border: "1px solid #d1d5db",
                            background: "#fff",
                            color: "#374151",
                          }}
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(m.id)}
                          style={{
                            ...btnBase,
                            border: "1px solid #ef4444",
                            background: "#fff",
                            color: "#ef4444",
                          }}
                        >
                          Xoá
                        </button>
                        {false && !isTerminal && next && (
                          <button
                            onClick={() => handleStatusChange(m.id, next!.status)}
                            style={{ ...btnBase, background: "#3b82f6", color: "#fff" }}
                          >
                            {next!.label}
                          </button>
                        )}
                        {false && !isTerminal && (
                          <button
                            onClick={() => handleStatusChange(m.id, "CANCELLED")}
                            style={{ ...btnBase, background: "#fee2e2", color: "#b91c1c" }}
                          >
                            Hủy
                          </button>
                        )}
                        {false && showCost && (
                          <button
                            onClick={() => setCostMoveId(m.id)}
                            style={{
                              ...btnBase,
                              background: "#f0fdf4",
                              color: "#166534",
                              border: "1px solid #bbf7d0",
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
        <div
          style={{
            padding: "10px 14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          <span style={{ color: "#94a3b8", fontSize: 13 }}>
            {total === 0
              ? "0 lệnh"
              : `Hiển thị ${(page - 1) * PAGE_SIZE_YARD + 1}–${Math.min(page * PAGE_SIZE_YARD, total)} / ${total}`}
          </span>
          {totalPages > 1 && (
            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{
                  padding: "4px 10px",
                  border: "1px solid #d1d5db",
                  borderRadius: 5,
                  background: page === 1 ? "#f1f5f9" : "#fff",
                  cursor: page === 1 ? "default" : "pointer",
                  fontSize: 13,
                }}
              >
                ‹
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                .reduce<(number | "…")[]>((acc, p, i, arr) => {
                  if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("…");
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, i) =>
                  p === "…" ? (
                    <span
                      key={`e${i}`}
                      style={{ padding: "4px 6px", fontSize: 13, color: "#94a3b8" }}
                    >
                      …
                    </span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setPage(p as number)}
                      style={{
                        padding: "4px 10px",
                        border: "1px solid #d1d5db",
                        borderRadius: 5,
                        background: p === page ? "#3b82f6" : "#fff",
                        color: p === page ? "#fff" : "#374151",
                        cursor: "pointer",
                        fontSize: 13,
                      }}
                    >
                      {p}
                    </button>
                  ),
                )}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={{
                  padding: "4px 10px",
                  border: "1px solid #d1d5db",
                  borderRadius: 5,
                  background: page === totalPages ? "#f1f5f9" : "#fff",
                  cursor: page === totalPages ? "default" : "pointer",
                  fontSize: 13,
                }}
              >
                ›
              </button>
            </div>
          )}
        </div>
      </div>

      {showCreate && (
        <CreateYardMoveModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            fetchMoves(page);
          }}
        />
      )}
      {costMoveId && (
        <CostModal
          moveId={costMoveId}
          onClose={() => setCostMoveId(null)}
          onAdded={() => {
            setCostMoveId(null);
            fetchMoves(page);
          }}
        />
      )}

      {editMove && (
        <EditYardMoveModal
          move={editMove}
          onClose={() => setEditMove(null)}
          onSaved={() => {
            setEditMove(null);
            fetchMoves(page);
          }}
        />
      )}

      {confirmDeleteId && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
          }}
        >
          <div style={{ background: "#fff", borderRadius: 10, padding: 28, width: 360 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Xác nhận xoá</h2>
            <p style={{ fontSize: 14, color: "#374151", marginBottom: 20 }}>
              Bạn có chắc muốn xoá lệnh bãi này?
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                onClick={() => setConfirmDeleteId(null)}
                style={{
                  padding: "8px 16px",
                  border: "1px solid #d1d5db",
                  borderRadius: 6,
                  background: "#fff",
                  fontSize: 14,
                  cursor: "pointer",
                }}
              >
                Hủy
              </button>
              <button
                onClick={() => handleSoftDelete(confirmDeleteId)}
                style={{
                  padding: "8px 16px",
                  background: "#ef4444",
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  fontSize: 14,
                  cursor: "pointer",
                }}
              >
                Xoá
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
