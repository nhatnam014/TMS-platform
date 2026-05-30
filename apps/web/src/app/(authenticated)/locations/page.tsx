"use client";

import { useEffect, useState } from "react";
import type { LocationType } from "@tms/shared";

interface LocationRow {
  id: string;
  code: string;
  name: string;
  locationType: LocationType;
  address: string | null;
}

const LOCATION_TYPE_LABELS: Record<LocationType, string> = {
  PORT: "Cảng",
  DEPOT: "Bãi container",
  ICD: "ICD",
  INDUSTRIAL_ZONE: "KCN",
  WAREHOUSE: "Kho",
  OTHER: "Khác",
};

const LOCATION_TYPES: LocationType[] = ["PORT", "DEPOT", "ICD", "INDUSTRIAL_ZONE", "WAREHOUSE", "OTHER"];

const FIELD = (label: string, value: string, onChange: (v: string) => void, required?: boolean) => (
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

interface FormState { code: string; name: string; locationType: LocationType; address: string; latitude: string; longitude: string; }
const EMPTY_FORM: FormState = { code: "", name: "", locationType: "PORT", address: "", latitude: "", longitude: "" };

function SelectField({ label, value, onChange, options, required }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; required?: boolean }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 4, color: "#374151" }}>
        {label}{required && <span style={{ color: "#dc2626" }}> *</span>}
      </label>
      <select value={value} onChange={(e) => onChange(e.target.value)} required={required} style={{ width: "100%", padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 14 }}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

export default function LocationsPage() {
  const [locations, setLocations] = useState<LocationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);
  const [typeFilter, setTypeFilter] = useState<LocationType | "">("");
  const [search, setSearch] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState<FormState>(EMPTY_FORM);
  const [createError, setCreateError] = useState<string | null>(null);

  const [editTarget, setEditTarget] = useState<LocationRow | null>(null);
  const [editForm, setEditForm] = useState<FormState>(EMPTY_FORM);
  const [editError, setEditError] = useState<string | null>(null);

  const [deactivating, setDeactivating] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch("/api/locations")
      .then(async (res) => {
        if (!res.ok) throw new Error(`API error ${res.status}`);
        return res.json() as Promise<LocationRow[]>;
      })
      .then((data) => { if (!cancelled) { setLocations(data); setError(null); } })
      .catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : "Lỗi không xác định"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [refresh]);

  const displayed = locations.filter((l) => {
    const q = search.toLowerCase();
    const matchType = !typeFilter || l.locationType === typeFilter;
    const matchSearch = !q || l.code.toLowerCase().includes(q) || l.name.toLowerCase().includes(q);
    return matchType && matchSearch;
  });

  async function handleCreate() {
    setCreateError(null);
    const res = await fetch("/api/locations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: createForm.code,
        name: createForm.name,
        locationType: createForm.locationType,
        address: createForm.address || undefined,
        latitude: createForm.latitude ? Number(createForm.latitude) : undefined,
        longitude: createForm.longitude ? Number(createForm.longitude) : undefined,
      }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setCreateError(body.message ?? `Lỗi ${res.status}`);
      throw new Error("create failed");
    }
    setShowCreate(false);
    setCreateForm(EMPTY_FORM);
    setRefresh((r) => r + 1);
  }

  function openEdit(l: LocationRow) {
    setEditTarget(l);
    setEditForm({ code: l.code, name: l.name, locationType: l.locationType, address: l.address ?? "", latitude: "", longitude: "" });
    setEditError(null);
  }

  async function handleEdit() {
    if (!editTarget) return;
    setEditError(null);
    const res = await fetch(`/api/locations/${editTarget.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: editForm.code,
        name: editForm.name,
        locationType: editForm.locationType,
        address: editForm.address || undefined,
        latitude: editForm.latitude ? Number(editForm.latitude) : undefined,
        longitude: editForm.longitude ? Number(editForm.longitude) : undefined,
      }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setEditError(body.message ?? `Lỗi ${res.status}`);
      throw new Error("edit failed");
    }
    setEditTarget(null);
    setRefresh((r) => r + 1);
  }

  async function handleDeactivate(id: string) {
    if (!confirm("Vô hiệu hóa địa điểm này?")) return;
    setDeactivating(id);
    const res = await fetch(`/api/locations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: false }),
    });
    setDeactivating(null);
    if (res.ok) setRefresh((r) => r + 1);
  }

  const typeOptions = [{ value: "", label: "Tất cả loại" }, ...LOCATION_TYPES.map((t) => ({ value: t, label: LOCATION_TYPE_LABELS[t] }))];
  const locationTypeOptions = LOCATION_TYPES.map((t) => ({ value: t, label: LOCATION_TYPE_LABELS[t] }));

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>Địa điểm</h1>
        <button
          onClick={() => { setCreateForm(EMPTY_FORM); setCreateError(null); setShowCreate(true); }}
          style={{ padding: "8px 16px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: 6, fontSize: 14, cursor: "pointer", fontWeight: 500 }}
        >
          + Tạo địa điểm
        </button>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <input
          placeholder="Tìm theo mã, tên địa điểm..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 14 }}
        />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as LocationType | "")}
          style={{ padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 14, background: "#fff" }}
        >
          {typeOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {loading && <p style={{ color: "#64748b" }}>Đang tải...</p>}
      {error && <p style={{ color: "#dc2626", background: "#fef2f2", padding: "12px 16px", borderRadius: 8 }}>{error}</p>}

      {!loading && !error && (
        <div style={{ background: "#fff", borderRadius: 10, boxShadow: "0 1px 4px rgba(0,0,0,0.07)", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                {["Mã", "Tên", "Loại", "Địa chỉ", ""].map((h) => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 600, color: "#374151", fontSize: 13 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayed.length === 0 && (
                <tr><td colSpan={5} style={{ padding: "24px 14px", textAlign: "center", color: "#94a3b8" }}>Chưa có địa điểm</td></tr>
              )}
              {displayed.map((l) => (
                <tr key={l.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "10px 14px", fontWeight: 600 }}>{l.code}</td>
                  <td style={{ padding: "10px 14px" }}>{l.name}</td>
                  <td style={{ padding: "10px 14px" }}>
                    <span style={{ padding: "2px 8px", background: "#f1f5f9", borderRadius: 4, fontSize: 12, color: "#475569" }}>
                      {LOCATION_TYPE_LABELS[l.locationType]}
                    </span>
                  </td>
                  <td style={{ padding: "10px 14px", color: "#64748b" }}>{l.address ?? "—"}</td>
                  <td style={{ padding: "10px 14px" }}>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => openEdit(l)} style={{ padding: "5px 12px", border: "1px solid #d1d5db", borderRadius: 5, background: "#fff", fontSize: 13, cursor: "pointer" }}>Sửa</button>
                      <button
                        onClick={() => handleDeactivate(l.id)}
                        disabled={deactivating === l.id}
                        style={{ padding: "5px 12px", border: "1px solid #fca5a5", borderRadius: 5, background: "#fff", color: "#dc2626", fontSize: 13, cursor: "pointer", opacity: deactivating === l.id ? 0.6 : 1 }}
                      >
                        Vô hiệu hóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ padding: "10px 14px", color: "#94a3b8", fontSize: 13 }}>{displayed.length} địa điểm</div>
        </div>
      )}

      {showCreate && (
        <Modal title="Tạo địa điểm" onClose={() => setShowCreate(false)} onSubmit={handleCreate} error={createError}>
          {FIELD("Mã địa điểm", createForm.code, (v) => setCreateForm((f) => ({ ...f, code: v })), true)}
          {FIELD("Tên", createForm.name, (v) => setCreateForm((f) => ({ ...f, name: v })), true)}
          <SelectField label="Loại" value={createForm.locationType} onChange={(v) => setCreateForm((f) => ({ ...f, locationType: v as LocationType }))} options={locationTypeOptions} required />
          {FIELD("Địa chỉ", createForm.address, (v) => setCreateForm((f) => ({ ...f, address: v })))}
          {FIELD("Vĩ độ (latitude)", createForm.latitude, (v) => setCreateForm((f) => ({ ...f, latitude: v })))}
          {FIELD("Kinh độ (longitude)", createForm.longitude, (v) => setCreateForm((f) => ({ ...f, longitude: v })))}
        </Modal>
      )}

      {editTarget && (
        <Modal title="Sửa địa điểm" onClose={() => setEditTarget(null)} onSubmit={handleEdit} error={editError}>
          {FIELD("Mã địa điểm", editForm.code, (v) => setEditForm((f) => ({ ...f, code: v })), true)}
          {FIELD("Tên", editForm.name, (v) => setEditForm((f) => ({ ...f, name: v })), true)}
          <SelectField label="Loại" value={editForm.locationType} onChange={(v) => setEditForm((f) => ({ ...f, locationType: v as LocationType }))} options={locationTypeOptions} required />
          {FIELD("Địa chỉ", editForm.address, (v) => setEditForm((f) => ({ ...f, address: v })))}
          {FIELD("Vĩ độ (latitude)", editForm.latitude, (v) => setEditForm((f) => ({ ...f, latitude: v })))}
          {FIELD("Kinh độ (longitude)", editForm.longitude, (v) => setEditForm((f) => ({ ...f, longitude: v })))}
        </Modal>
      )}
    </div>
  );
}
