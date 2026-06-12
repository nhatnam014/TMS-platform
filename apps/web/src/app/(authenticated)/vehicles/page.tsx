"use client";

import { useEffect, useState } from "react";
import type { VehicleStatus, VehicleType } from "@tms/shared";
import { useToast } from "@/lib/toast-context";
import { formatDate } from "@/lib/date-utils";

interface VehicleRow {
  id: string;
  licensePlate: string;
  vehicleType: VehicleType;
  status: VehicleStatus;
  inspectionExpiry: string | null;
  insuranceExpiry: string | null;
  registrationExpiry: string | null;
  notes: string | null;
  driver: { id: string; fullName: string; phone: string | null } | null;
}

const STATUS_LABELS: Record<VehicleStatus, string> = {
  ACTIVE: "Hoạt động",
  MAINTENANCE: "Bảo dưỡng",
  DECOMMISSIONED: "Ngừng hoạt động",
  WAITING_DRIVER: "Chờ tài",
};

const STATUS_COLORS: Record<VehicleStatus, string> = {
  ACTIVE: "#10b981",
  MAINTENANCE: "#f59e0b",
  DECOMMISSIONED: "#94a3b8",
  WAITING_DRIVER: "#6366f1",
};

const VEHICLE_TYPES: VehicleType[] = [
  "SHACMAN",
  "CHENGLONG",
  "HOWO",
  "FREIGHTLINER",
  "FAW",
  "OTHER",
];
const ALL_STATUSES: VehicleStatus[] = ["ACTIVE", "MAINTENANCE", "DECOMMISSIONED", "WAITING_DRIVER"];

function isExpiring(d: string | null, days = 30) {
  if (!d) return false;
  const diff = new Date(d).getTime() - Date.now();
  return diff < days * 86400 * 1000;
}

function FIELD(
  label: string,
  value: string,
  onChange: (v: string) => void,
  required?: boolean,
  type = "text",
) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label
        style={{
          display: "block",
          fontSize: 13,
          fontWeight: 500,
          marginBottom: 4,
          color: "#374151",
        }}
      >
        {label}
        {required && <span style={{ color: "#dc2626" }}> *</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        style={{
          width: "100%",
          padding: "8px 10px",
          border: "1px solid #d1d5db",
          borderRadius: 6,
          fontSize: 14,
          boxSizing: "border-box",
        }}
      />
    </div>
  );
}

function SelectField(
  label: string,
  value: string,
  onChange: (v: string) => void,
  options: { value: string; label: string }[],
  required?: boolean,
) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label
        style={{
          display: "block",
          fontSize: 13,
          fontWeight: 500,
          marginBottom: 4,
          color: "#374151",
        }}
      >
        {label}
        {required && <span style={{ color: "#dc2626" }}> *</span>}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        style={{
          width: "100%",
          padding: "8px 10px",
          border: "1px solid #d1d5db",
          borderRadius: 6,
          fontSize: 14,
          boxSizing: "border-box",
          background: "#fff",
        }}
      >
        <option value="">-- Chọn --</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

interface ModalProps {
  title: string;
  onClose: () => void;
  onSubmit: () => Promise<void>;
  error: string | null;
  children: React.ReactNode;
}

function Modal({ title, onClose, onSubmit, error, children }: ModalProps) {
  const [loading, setLoading] = useState(false);
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await onSubmit();
    setLoading(false);
  }
  return (
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
      <div
        style={{
          background: "#fff",
          borderRadius: 10,
          padding: 28,
          width: 480,
          maxHeight: "90vh",
          overflowY: "auto",
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
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>{title}</h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: 20,
              cursor: "pointer",
              color: "#6b7280",
            }}
          >
            ×
          </button>
        </div>
        {error && (
          <p
            style={{
              color: "#dc2626",
              background: "#fef2f2",
              padding: "8px 12px",
              borderRadius: 6,
              fontSize: 13,
              marginBottom: 14,
            }}
          >
            {error}
          </p>
        )}
        <form onSubmit={handleSubmit}>
          {children}
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
            <button
              type="button"
              onClick={onClose}
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
              type="submit"
              disabled={loading}
              style={{
                padding: "8px 16px",
                background: "#3b82f6",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                fontSize: 14,
                cursor: "pointer",
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? "Đang lưu..." : "Lưu"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const EMPTY_FORM = {
  licensePlate: "",
  vehicleType: "" as VehicleType | "",
  inspectionExpiry: "",
  insuranceExpiry: "",
  registrationExpiry: "",
  notes: "",
};
type VehicleForm = typeof EMPTY_FORM;

export default function VehiclesPage() {
  const toast = useToast();
  const [vehicles, setVehicles] = useState<VehicleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<VehicleStatus | "">("");

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState<VehicleForm>(EMPTY_FORM);
  const [createError, setCreateError] = useState<string | null>(null);

  const [editTarget, setEditTarget] = useState<VehicleRow | null>(null);
  const [editForm, setEditForm] = useState<VehicleForm & { status: VehicleStatus | "" }>({
    ...EMPTY_FORM,
    status: "",
  });
  const [editError, setEditError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch("/api/vehicles")
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) {
          setVehicles(data);
          setFetchError(null);
        }
      })
      .catch((e) => {
        if (!cancelled) setFetchError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  const displayed = vehicles.filter((v) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      v.licensePlate.toLowerCase().includes(q) ||
      (v.driver?.fullName.toLowerCase().includes(q) ?? false);
    const matchStatus = !statusFilter || v.status === statusFilter;
    return matchSearch && matchStatus;
  });

  function openCreate() {
    setCreateForm(EMPTY_FORM);
    setCreateError(null);
    setShowCreate(true);
  }

  function openEdit(v: VehicleRow) {
    setEditForm({
      licensePlate: v.licensePlate,
      vehicleType: v.vehicleType,
      status: v.status,
      inspectionExpiry: v.inspectionExpiry ? v.inspectionExpiry.slice(0, 10) : "",
      insuranceExpiry: v.insuranceExpiry ? v.insuranceExpiry.slice(0, 10) : "",
      registrationExpiry: v.registrationExpiry ? v.registrationExpiry.slice(0, 10) : "",
      notes: v.notes ?? "",
    });
    setEditError(null);
    setEditTarget(v);
  }

  async function handleCreate() {
    setCreateError(null);
    if (!createForm.licensePlate.trim() || !createForm.vehicleType) {
      setCreateError("Biển số và loại xe là bắt buộc");
      return;
    }
    const res = await fetch("/api/vehicles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        licensePlate: createForm.licensePlate.trim(),
        vehicleType: createForm.vehicleType,
        inspectionExpiry: createForm.inspectionExpiry || undefined,
        insuranceExpiry: createForm.insuranceExpiry || undefined,
        registrationExpiry: createForm.registrationExpiry || undefined,
        notes: createForm.notes || undefined,
      }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const msg = body.message ?? "Lỗi tạo xe";
      setCreateError(msg);
      toast.error(msg);
      return;
    }
    setShowCreate(false);
    setRefresh((r) => r + 1);
    toast.success("Thêm xe thành công");
  }

  async function handleEdit() {
    if (!editTarget) return;
    setEditError(null);
    const res = await fetch(`/api/vehicles/${editTarget.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        licensePlate: editForm.licensePlate || undefined,
        vehicleType: editForm.vehicleType || undefined,
        status: editForm.status || undefined,
        inspectionExpiry: editForm.inspectionExpiry || undefined,
        insuranceExpiry: editForm.insuranceExpiry || undefined,
        registrationExpiry: editForm.registrationExpiry || undefined,
        notes: editForm.notes || undefined,
      }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const msg = body.message ?? "Lỗi cập nhật xe";
      setEditError(msg);
      toast.error(msg);
      return;
    }
    setEditTarget(null);
    setRefresh((r) => r + 1);
    toast.success("Cập nhật xe thành công");
  }

  async function handleStatusTransition(v: VehicleRow, newStatus: VehicleStatus) {
    if (!confirm(`Chuyển trạng thái "${v.licensePlate}" sang "${STATUS_LABELS[newStatus]}"?`))
      return;
    try {
      const res = await fetch(`/api/vehicles/${v.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        toast.success(`Đã chuyển "${v.licensePlate}" sang ${STATUS_LABELS[newStatus]}`);
      } else {
        toast.error("Lỗi chuyển trạng thái xe");
      }
      setRefresh((r) => r + 1);
    } catch {
      toast.error("Lỗi chuyển trạng thái xe");
    }
  }

  async function handleSoftDelete(id: string) {
    setConfirmDeleteId(null);
    try {
      const res = await fetch(`/api/vehicles/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "DECOMMISSIONED" }),
      });
      if (res.ok) {
        toast.success("Đã xoá xe");
      } else {
        toast.error("Lỗi xoá xe");
      }
      setRefresh((r) => r + 1);
    } catch {
      toast.error("Lỗi xoá xe");
    }
  }

  function DateCell({ date }: { date: string | null }) {
    const warn = isExpiring(date);
    return (
      <td
        style={{
          padding: "10px 16px",
          fontSize: 13,
          color: warn ? "#d97706" : "#374151",
          fontWeight: warn ? 600 : 400,
        }}
      >
        {warn && <span style={{ marginRight: 4 }}>⚠</span>}
        {formatDate(date)}
      </td>
    );
  }

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 20,
        }}
      >
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>Phương tiện</h1>
        <button
          onClick={openCreate}
          style={{
            padding: "8px 16px",
            background: "#3b82f6",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          + Thêm xe
        </button>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <input
          placeholder="Tìm biển số hoặc tên tài xế..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1,
            padding: "8px 12px",
            border: "1px solid #d1d5db",
            borderRadius: 6,
            fontSize: 14,
          }}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as VehicleStatus | "")}
          style={{
            padding: "8px 12px",
            border: "1px solid #d1d5db",
            borderRadius: 6,
            fontSize: 14,
            background: "#fff",
          }}
        >
          <option value="">Tất cả</option>
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      {fetchError && (
        <p
          style={{
            color: "#dc2626",
            background: "#fef2f2",
            padding: "10px 14px",
            borderRadius: 6,
            marginBottom: 16,
            fontSize: 13,
          }}
        >
          {fetchError}
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
        <table style={{ width: "100%", minWidth: 920, borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
              {[
                "Biển số",
                "Loại xe",
                "Trạng thái",
                "Tài xế",
                "Hạn đăng kiểm",
                "Hạn bảo hiểm",
                "Hạn cà vẹt",
                "",
              ].map((h, i) => (
                <th
                  key={i}
                  style={{
                    padding: "10px 16px",
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
                <td colSpan={8} style={{ padding: 32, textAlign: "center", color: "#94a3b8" }}>
                  Đang tải...
                </td>
              </tr>
            ) : displayed.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: 32, textAlign: "center", color: "#94a3b8" }}>
                  Không có dữ liệu
                </td>
              </tr>
            ) : (
              displayed.map((v, i) => (
                <tr
                  key={v.id}
                  style={{
                    borderBottom: "1px solid #f1f5f9",
                    background: i % 2 === 0 ? "#fff" : "#fafafa",
                  }}
                >
                  <td
                    style={{
                      padding: "10px 16px",
                      fontFamily: "monospace",
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                  >
                    {v.licensePlate}
                  </td>
                  <td style={{ padding: "10px 16px", fontSize: 13 }}>{v.vehicleType}</td>
                  <td style={{ padding: "10px 16px" }}>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "2px 10px",
                        borderRadius: 12,
                        fontSize: 12,
                        fontWeight: 500,
                        background: `${STATUS_COLORS[v.status]}18`,
                        color: STATUS_COLORS[v.status],
                      }}
                    >
                      {STATUS_LABELS[v.status]}
                    </span>
                  </td>
                  <td style={{ padding: "10px 16px", fontSize: 13 }}>
                    {v.driver?.fullName ?? <span style={{ color: "#94a3b8" }}>Chưa có tài</span>}
                  </td>
                  <DateCell date={v.inspectionExpiry} />
                  <DateCell date={v.insuranceExpiry} />
                  <DateCell date={v.registrationExpiry} />
                  <td style={{ padding: "10px 16px", whiteSpace: "nowrap" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        onClick={() => openEdit(v)}
                        style={{
                          fontSize: 12,
                          padding: "4px 10px",
                          border: "1px solid #d1d5db",
                          borderRadius: 4,
                          background: "#fff",
                          cursor: "pointer",
                        }}
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(v.id)}
                        style={{
                          fontSize: 12,
                          padding: "4px 10px",
                          border: "1px solid #ef4444",
                          borderRadius: 4,
                          background: "#fff",
                          color: "#ef4444",
                          cursor: "pointer",
                        }}
                      >
                        Xoá
                      </button>
                    </div>
                    {false && v.status === "ACTIVE" && (
                      <button
                        onClick={() => handleStatusTransition(v, "MAINTENANCE")}
                        style={{
                          fontSize: 12,
                          padding: "4px 10px",
                          border: "1px solid #f59e0b",
                          borderRadius: 4,
                          background: "#fffbeb",
                          color: "#92400e",
                          cursor: "pointer",
                          marginRight: 6,
                        }}
                      >
                        Bảo dưỡng
                      </button>
                    )}
                    {false && v.status === "MAINTENANCE" && (
                      <button
                        onClick={() => handleStatusTransition(v, "ACTIVE")}
                        style={{
                          fontSize: 12,
                          padding: "4px 10px",
                          border: "1px solid #10b981",
                          borderRadius: 4,
                          background: "#ecfdf5",
                          color: "#065f46",
                          cursor: "pointer",
                          marginRight: 6,
                        }}
                      >
                        Kích hoạt
                      </button>
                    )}
                    {false && v.status !== "DECOMMISSIONED" && (
                      <button
                        onClick={() => handleStatusTransition(v, "DECOMMISSIONED")}
                        style={{
                          fontSize: 12,
                          padding: "4px 10px",
                          border: "1px solid #94a3b8",
                          borderRadius: 4,
                          background: "#f8fafc",
                          color: "#475569",
                          cursor: "pointer",
                        }}
                      >
                        Ngừng HĐ
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <Modal
          title="Thêm xe mới"
          onClose={() => setShowCreate(false)}
          onSubmit={handleCreate}
          error={createError}
        >
          {FIELD(
            "Biển số *",
            createForm.licensePlate,
            (v) => setCreateForm((f) => ({ ...f, licensePlate: v })),
            true,
          )}
          {SelectField(
            "Loại xe *",
            createForm.vehicleType,
            (v) => setCreateForm((f) => ({ ...f, vehicleType: v as VehicleType })),
            VEHICLE_TYPES.map((t) => ({ value: t, label: t })),
            true,
          )}
          {FIELD(
            "Hạn đăng kiểm",
            createForm.inspectionExpiry,
            (v) => setCreateForm((f) => ({ ...f, inspectionExpiry: v })),
            false,
            "date",
          )}
          {FIELD(
            "Hạn bảo hiểm",
            createForm.insuranceExpiry,
            (v) => setCreateForm((f) => ({ ...f, insuranceExpiry: v })),
            false,
            "date",
          )}
          {FIELD(
            "Hạn cà vẹt",
            createForm.registrationExpiry,
            (v) => setCreateForm((f) => ({ ...f, registrationExpiry: v })),
            false,
            "date",
          )}
          {FIELD("Ghi chú", createForm.notes, (v) => setCreateForm((f) => ({ ...f, notes: v })))}
        </Modal>
      )}

      {/* Edit Modal */}
      {editTarget && (
        <Modal
          title={`Sửa xe — ${editTarget.licensePlate}`}
          onClose={() => setEditTarget(null)}
          onSubmit={handleEdit}
          error={editError}
        >
          {FIELD(
            "Biển số",
            editForm.licensePlate,
            (v) => setEditForm((f) => ({ ...f, licensePlate: v })),
            true,
          )}
          {SelectField(
            "Loại xe",
            editForm.vehicleType,
            (v) => setEditForm((f) => ({ ...f, vehicleType: v as VehicleType })),
            VEHICLE_TYPES.map((t) => ({ value: t, label: t })),
            true,
          )}
          {SelectField(
            "Trạng thái",
            editForm.status,
            (v) => setEditForm((f) => ({ ...f, status: v as VehicleStatus })),
            ALL_STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s] })),
          )}
          {FIELD(
            "Hạn đăng kiểm",
            editForm.inspectionExpiry,
            (v) => setEditForm((f) => ({ ...f, inspectionExpiry: v })),
            false,
            "date",
          )}
          {FIELD(
            "Hạn bảo hiểm",
            editForm.insuranceExpiry,
            (v) => setEditForm((f) => ({ ...f, insuranceExpiry: v })),
            false,
            "date",
          )}
          {FIELD(
            "Hạn cà vẹt",
            editForm.registrationExpiry,
            (v) => setEditForm((f) => ({ ...f, registrationExpiry: v })),
            false,
            "date",
          )}
          {FIELD("Ghi chú", editForm.notes, (v) => setEditForm((f) => ({ ...f, notes: v })))}
        </Modal>
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
              Bạn có chắc muốn xoá xe này?
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
