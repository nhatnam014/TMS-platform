"use client";

import { useEffect, useState } from "react";
import type { DriverStatus, VehicleType } from "@tms/shared";

interface VehicleOption {
  id: string;
  licensePlate: string;
  vehicleType: VehicleType;
}

interface DriverRow {
  id: string;
  fullName: string;
  phone: string | null;
  status: DriverStatus;
  notes: string | null;
  vehicle: { id: string; licensePlate: string; vehicleType: VehicleType } | null;
}

const STATUS_LABELS: Record<DriverStatus, string> = {
  ACTIVE: "Đang làm",
  ON_LEAVE: "Nghỉ phép",
  TERMINATED: "Đã nghỉ",
};

const STATUS_COLORS: Record<DriverStatus, string> = {
  ACTIVE: "#10b981",
  ON_LEAVE: "#f59e0b",
  TERMINATED: "#94a3b8",
};

const DRIVER_STATUSES: DriverStatus[] = ["ACTIVE", "ON_LEAVE", "TERMINATED"];

function FIELD(label: string, value: string, onChange: (v: string) => void, required?: boolean) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 4, color: "#374151" }}>
        {label}{required && <span style={{ color: "#dc2626" }}> *</span>}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        style={{ width: "100%", padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 14, boxSizing: "border-box" }}
      />
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
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
      <div style={{ background: "#fff", borderRadius: 10, padding: 28, width: 480, maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>{title}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#6b7280" }}>×</button>
        </div>
        {error && <p style={{ color: "#dc2626", background: "#fef2f2", padding: "8px 12px", borderRadius: 6, fontSize: 13, marginBottom: 14 }}>{error}</p>}
        <form onSubmit={handleSubmit}>
          {children}
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
            <button type="button" onClick={onClose} style={{ padding: "8px 16px", border: "1px solid #d1d5db", borderRadius: 6, background: "#fff", fontSize: 14, cursor: "pointer" }}>Hủy</button>
            <button type="submit" disabled={loading} style={{ padding: "8px 16px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: 6, fontSize: 14, cursor: "pointer", opacity: loading ? 0.7 : 1 }}>
              {loading ? "Đang lưu..." : "Lưu"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const EMPTY_CREATE = { fullName: "", phone: "", notes: "" };
const EMPTY_EDIT = { fullName: "", phone: "", notes: "", status: "" as DriverStatus | "" };

export default function DriversPage() {
  const [drivers, setDrivers] = useState<DriverRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);

  // Available WAITING_DRIVER vehicles for assignment
  const [waitingVehicles, setWaitingVehicles] = useState<VehicleOption[]>([]);

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState(EMPTY_CREATE);
  const [createError, setCreateError] = useState<string | null>(null);

  const [editTarget, setEditTarget] = useState<DriverRow | null>(null);
  const [editForm, setEditForm] = useState(EMPTY_EDIT);
  const [editError, setEditError] = useState<string | null>(null);

  // Assign vehicle inline
  const [assignTarget, setAssignTarget] = useState<DriverRow | null>(null);
  const [assignVehicleId, setAssignVehicleId] = useState("");
  const [assignError, setAssignError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      fetch("/api/drivers").then((r) => r.json()),
      fetch("/api/vehicles").then((r) => r.json()),
    ])
      .then(([driversData, vehiclesData]) => {
        if (!cancelled) {
          setDrivers(driversData);
          const allVehicles = vehiclesData as (VehicleOption & { status: string })[];
          setWaitingVehicles(allVehicles.filter((v) => v.status === "WAITING_DRIVER"));
          setFetchError(null);
        }
      })
      .catch((e) => { if (!cancelled) setFetchError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [refresh]);

  function openCreate() {
    setCreateForm(EMPTY_CREATE);
    setCreateError(null);
    setShowCreate(true);
  }

  function openEdit(d: DriverRow) {
    setEditForm({ fullName: d.fullName, phone: d.phone ?? "", notes: d.notes ?? "", status: d.status });
    setEditError(null);
    setEditTarget(d);
  }

  function openAssign(d: DriverRow) {
    setAssignVehicleId("");
    setAssignError(null);
    setAssignTarget(d);
  }

  async function handleCreate() {
    setCreateError(null);
    if (!createForm.fullName.trim()) { setCreateError("Họ tên là bắt buộc"); return; }
    const res = await fetch("/api/drivers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: createForm.fullName.trim(),
        phone: createForm.phone || undefined,
        notes: createForm.notes || undefined,
      }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setCreateError(body.message ?? "Lỗi tạo tài xế");
      return;
    }
    setShowCreate(false);
    setRefresh((r) => r + 1);
  }

  async function handleEdit() {
    if (!editTarget) return;
    setEditError(null);
    const res = await fetch(`/api/drivers/${editTarget.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: editForm.fullName || undefined,
        phone: editForm.phone || undefined,
        status: editForm.status || undefined,
        notes: editForm.notes || undefined,
      }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setEditError(body.message ?? "Lỗi cập nhật tài xế");
      return;
    }
    setEditTarget(null);
    setRefresh((r) => r + 1);
  }

  async function handleAssign() {
    if (!assignTarget) return;
    setAssignError(null);
    if (!assignVehicleId) { setAssignError("Chọn một xe để phân công"); return; }
    const res = await fetch(`/api/drivers/${assignTarget.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vehicleId: assignVehicleId }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setAssignError(body.message ?? "Lỗi phân công");
      return;
    }
    setAssignTarget(null);
    setRefresh((r) => r + 1);
  }

  async function handleUnassign(d: DriverRow) {
    if (!confirm(`Hủy phân công xe khỏi tài xế "${d.fullName}"?`)) return;
    const res = await fetch(`/api/drivers/${d.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vehicleId: null }),
    });
    if (res.ok) setRefresh((r) => r + 1);
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>Tài xế</h1>
        <button
          onClick={openCreate}
          style={{ padding: "8px 16px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: 6, fontSize: 14, cursor: "pointer" }}
        >
          + Thêm tài xế
        </button>
      </div>

      {fetchError && (
        <p style={{ color: "#dc2626", background: "#fef2f2", padding: "10px 14px", borderRadius: 6, marginBottom: 16, fontSize: 13 }}>
          {fetchError}
        </p>
      )}

      <div style={{ background: "#fff", borderRadius: 10, boxShadow: "0 1px 4px rgba(0,0,0,0.07)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
              {["Họ tên", "Điện thoại", "Trạng thái", "Xe phân công", ""].map((h, i) => (
                <th key={i} style={{ padding: "10px 16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ padding: 32, textAlign: "center", color: "#94a3b8" }}>Đang tải...</td></tr>
            ) : drivers.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: 32, textAlign: "center", color: "#94a3b8" }}>Không có dữ liệu</td></tr>
            ) : (
              drivers.map((d, i) => (
                <tr key={d.id} style={{ borderBottom: "1px solid #f1f5f9", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                  <td style={{ padding: "10px 16px", fontSize: 13, fontWeight: 500 }}>{d.fullName}</td>
                  <td style={{ padding: "10px 16px", fontSize: 13 }}>{d.phone ?? "—"}</td>
                  <td style={{ padding: "10px 16px" }}>
                    <span style={{ display: "inline-block", padding: "2px 10px", borderRadius: 12, fontSize: 12, fontWeight: 500, background: `${STATUS_COLORS[d.status]}18`, color: STATUS_COLORS[d.status] }}>
                      {STATUS_LABELS[d.status]}
                    </span>
                  </td>
                  <td style={{ padding: "10px 16px", fontSize: 13 }}>
                    {d.vehicle
                      ? <span>{d.vehicle.licensePlate} <span style={{ color: "#94a3b8", fontSize: 12 }}>({d.vehicle.vehicleType})</span></span>
                      : <span style={{ color: "#94a3b8" }}>Chưa phân công</span>
                    }
                  </td>
                  <td style={{ padding: "10px 16px", whiteSpace: "nowrap" }}>
                    <button
                      onClick={() => openEdit(d)}
                      style={{ fontSize: 12, padding: "4px 10px", border: "1px solid #d1d5db", borderRadius: 4, background: "#fff", cursor: "pointer", marginRight: 6 }}
                    >
                      Sửa
                    </button>
                    {d.vehicle ? (
                      <button
                        onClick={() => handleUnassign(d)}
                        style={{ fontSize: 12, padding: "4px 10px", border: "1px solid #f87171", borderRadius: 4, background: "#fef2f2", color: "#b91c1c", cursor: "pointer" }}
                      >
                        Hủy phân công
                      </button>
                    ) : (
                      <button
                        onClick={() => openAssign(d)}
                        style={{ fontSize: 12, padding: "4px 10px", border: "1px solid #6366f1", borderRadius: 4, background: "#eef2ff", color: "#4338ca", cursor: "pointer" }}
                      >
                        Phân công xe
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
        <Modal title="Thêm tài xế" onClose={() => setShowCreate(false)} onSubmit={handleCreate} error={createError}>
          {FIELD("Họ tên *", createForm.fullName, (v) => setCreateForm((f) => ({ ...f, fullName: v })), true)}
          {FIELD("Điện thoại", createForm.phone, (v) => setCreateForm((f) => ({ ...f, phone: v })))}
          {FIELD("Ghi chú", createForm.notes, (v) => setCreateForm((f) => ({ ...f, notes: v })))}
        </Modal>
      )}

      {/* Edit Modal */}
      {editTarget && (
        <Modal title={`Sửa tài xế — ${editTarget.fullName}`} onClose={() => setEditTarget(null)} onSubmit={handleEdit} error={editError}>
          {FIELD("Họ tên", editForm.fullName, (v) => setEditForm((f) => ({ ...f, fullName: v })), true)}
          {FIELD("Điện thoại", editForm.phone, (v) => setEditForm((f) => ({ ...f, phone: v })))}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 4, color: "#374151" }}>Trạng thái</label>
            <select
              value={editForm.status}
              onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value as DriverStatus }))}
              style={{ width: "100%", padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 14, boxSizing: "border-box", background: "#fff" }}
            >
              {DRIVER_STATUSES.map((s) => (
                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
              ))}
            </select>
          </div>
          {FIELD("Ghi chú", editForm.notes, (v) => setEditForm((f) => ({ ...f, notes: v })))}
        </Modal>
      )}

      {/* Assign Vehicle Modal */}
      {assignTarget && (
        <Modal title={`Phân công xe cho ${assignTarget.fullName}`} onClose={() => setAssignTarget(null)} onSubmit={handleAssign} error={assignError}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 4, color: "#374151" }}>
              Chọn xe <span style={{ color: "#dc2626" }}>*</span>
            </label>
            <select
              value={assignVehicleId}
              onChange={(e) => setAssignVehicleId(e.target.value)}
              required
              style={{ width: "100%", padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 14, boxSizing: "border-box", background: "#fff" }}
            >
              <option value="">-- Chọn xe --</option>
              {waitingVehicles.map((v) => (
                <option key={v.id} value={v.id}>{v.licensePlate} ({v.vehicleType})</option>
              ))}
            </select>
            {waitingVehicles.length === 0 && (
              <p style={{ marginTop: 8, fontSize: 12, color: "#94a3b8" }}>Không có xe nào đang chờ tài xế</p>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
