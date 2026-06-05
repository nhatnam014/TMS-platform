"use client";

import { useEffect, useState } from "react";

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
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          padding: 28,
          width: 500,
          maxHeight: "90vh",
          overflowY: "auto",
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

// ─── CREATE MODAL ─────────────────────────────────────────────────────────────

function CreateYardMoveModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [containerNumber, setContainerNumber] = useState("");
  const [fromZone, setFromZone] = useState<FactoryZone | "">("");
  const [toZone, setToZone] = useState<FactoryZone | "">("");
  const [locationId, setLocationId] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    fetch("/api/locations")
      .then((r) => r.json())
      .then((locs) => setLocations(locs))
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
      onCreated();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Lỗi không xác định");
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
    <Modal title="Tạo lệnh bãi mới" onClose={onClose}>
      {loadingOptions ? (
        <p style={{ textAlign: "center", color: "#94a3b8" }}>Đang tải dữ liệu...</p>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={labelStyle}>Ngày *</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={inputStyle}
              required
            />
          </div>
          <div>
            <label style={labelStyle}>Số Container * (VD: ABCD1234567)</label>
            <input
              type="text"
              value={containerNumber}
              onChange={(e) => setContainerNumber(e.target.value.toUpperCase())}
              pattern="[A-Z]{4}[0-9]{7}"
              placeholder="ABCD1234567"
              style={inputStyle}
              required
            />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={labelStyle}>Từ khu vực *</label>
              <select
                value={fromZone}
                onChange={(e) => setFromZone(e.target.value as FactoryZone)}
                style={inputStyle}
                required
              >
                <option value="">-- Chọn --</option>
                {FACTORY_ZONES.map((z) => (
                  <option key={z} value={z}>
                    {ZONE_LABELS[z]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Đến khu vực *</label>
              <select
                value={toZone}
                onChange={(e) => setToZone(e.target.value as FactoryZone)}
                style={inputStyle}
                required
              >
                <option value="">-- Chọn --</option>
                {FACTORY_ZONES.map((z) => (
                  <option key={z} value={z}>
                    {ZONE_LABELS[z]}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label style={labelStyle}>Địa điểm *</label>
            <select
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              style={inputStyle}
              required
            >
              <option value="">-- Chọn địa điểm --</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} ({l.code})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Ghi chú</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
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
              background: "#3b82f6",
              color: "#fff",
              border: "none",
              borderRadius: 7,
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {submitting ? "Đang tạo..." : "Tạo lệnh bãi"}
          </button>
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
      onAdded();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Lỗi không xác định");
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

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function YardMovesPage() {
  const [moves, setMoves] = useState<YardMoveRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [costMoveId, setCostMoveId] = useState<string | null>(null);

  function fetchMoves() {
    fetch("/api/yard-moves?limit=100")
      .then(async (res) => {
        if (!res.ok) throw new Error(`API error ${res.status}`);
        const data: YardMoveRow[] = await res.json();
        setMoves(data);
        setTotal(data.length);
        setActionError(null);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Lỗi không xác định"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchMoves();
  }, []);

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
      fetchMoves();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Lỗi không xác định");
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
          overflow: "hidden",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
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
                      {new Date(m.date).toLocaleDateString("vi-VN")}
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
                        {!isTerminal && next && (
                          <button
                            onClick={() => handleStatusChange(m.id, next.status)}
                            style={{ ...btnBase, background: "#3b82f6", color: "#fff" }}
                          >
                            {next.label}
                          </button>
                        )}
                        {!isTerminal && (
                          <button
                            onClick={() => handleStatusChange(m.id, "CANCELLED")}
                            style={{ ...btnBase, background: "#fee2e2", color: "#b91c1c" }}
                          >
                            Hủy
                          </button>
                        )}
                        {showCost && (
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
      </div>

      {showCreate && (
        <CreateYardMoveModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            fetchMoves();
          }}
        />
      )}
      {costMoveId && (
        <CostModal
          moveId={costMoveId}
          onClose={() => setCostMoveId(null)}
          onAdded={() => {
            setCostMoveId(null);
            fetchMoves();
          }}
        />
      )}
    </div>
  );
}
