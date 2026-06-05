"use client";

import { useEffect, useState } from "react";

interface CustomerRow {
  id: string;
  code: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  taxCode: string | null;
}

const FIELD = (label: string, value: string, onChange: (v: string) => void, required?: boolean, type = "text") => (
  <div style={{ marginBottom: 14 }}>
    <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 4, color: "#374151" }}>
      {label}{required && <span style={{ color: "#dc2626" }}> *</span>}
    </label>
    <input
      type={type}
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

const EMPTY_FORM = { code: "", name: "", address: "", phone: "", email: "", taxCode: "" };

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);
  const [search, setSearch] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState(EMPTY_FORM);
  const [createError, setCreateError] = useState<string | null>(null);

  const [editTarget, setEditTarget] = useState<CustomerRow | null>(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [editError, setEditError] = useState<string | null>(null);

  const [deactivating, setDeactivating] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch("/api/customers")
      .then(async (res) => {
        if (!res.ok) throw new Error(`API error ${res.status}`);
        return res.json() as Promise<CustomerRow[]>;
      })
      .then((data) => { if (!cancelled) { setCustomers(data); setError(null); } })
      .catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : "Lỗi không xác định"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [refresh]);

  async function handleCreate() {
    setCreateError(null);
    const res = await fetch("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: createForm.code,
        name: createForm.name,
        address: createForm.address || undefined,
        phone: createForm.phone || undefined,
        email: createForm.email || undefined,
        taxCode: createForm.taxCode || undefined,
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

  function openEdit(c: CustomerRow) {
    setEditTarget(c);
    setEditForm({ code: c.code, name: c.name, address: c.address ?? "", phone: c.phone ?? "", email: c.email ?? "", taxCode: c.taxCode ?? "" });
    setEditError(null);
  }

  async function handleEdit() {
    if (!editTarget) return;
    setEditError(null);
    const res = await fetch(`/api/customers/${editTarget.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: editForm.code,
        name: editForm.name,
        address: editForm.address || undefined,
        phone: editForm.phone || undefined,
        email: editForm.email || undefined,
        taxCode: editForm.taxCode || undefined,
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
    if (!confirm("Vô hiệu hóa khách hàng này?")) return;
    setDeactivating(id);
    const res = await fetch(`/api/customers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: false }),
    });
    setDeactivating(null);
    if (res.ok) setRefresh((r) => r + 1);
  }

  const displayed = customers.filter((c) => {
    const q = search.toLowerCase();
    return !q || c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q);
  });

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>Khách hàng</h1>
        <button
          onClick={() => { setCreateForm(EMPTY_FORM); setCreateError(null); setShowCreate(true); }}
          style={{ padding: "8px 16px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: 6, fontSize: 14, cursor: "pointer", fontWeight: 500 }}
        >
          + Tạo khách hàng
        </button>
      </div>

      {loading && <p style={{ color: "#64748b" }}>Đang tải...</p>}
      {error && <p style={{ color: "#dc2626", background: "#fef2f2", padding: "12px 16px", borderRadius: 8 }}>{error}</p>}

      {!loading && !error && (
        <>
          <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
            <input
              placeholder="Tìm theo mã, tên khách hàng..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ flex: 1, padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 14 }}
            />
          </div>
          <div style={{ background: "#fff", borderRadius: 10, boxShadow: "0 1px 4px rgba(0,0,0,0.07)", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                  {["Mã", "Tên", "SĐT", "Email", "Mã số thuế", ""].map((h) => (
                    <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 600, color: "#374151", fontSize: 13 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayed.length === 0 && (
                  <tr><td colSpan={6} style={{ padding: "24px 14px", textAlign: "center", color: "#94a3b8" }}>Chưa có khách hàng</td></tr>
                )}
                {displayed.map((c) => (
                  <tr key={c.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "10px 14px", fontWeight: 600 }}>{c.code}</td>
                    <td style={{ padding: "10px 14px" }}>{c.name}</td>
                    <td style={{ padding: "10px 14px", color: "#64748b" }}>{c.phone ?? "—"}</td>
                    <td style={{ padding: "10px 14px", color: "#64748b" }}>{c.email ?? "—"}</td>
                    <td style={{ padding: "10px 14px", color: "#64748b" }}>{c.taxCode ?? "—"}</td>
                    <td style={{ padding: "10px 14px" }}>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => openEdit(c)} style={{ padding: "5px 12px", border: "1px solid #d1d5db", borderRadius: 5, background: "#fff", fontSize: 13, cursor: "pointer" }}>Sửa</button>
                        <button
                          onClick={() => handleDeactivate(c.id)}
                          disabled={deactivating === c.id}
                          style={{ padding: "5px 12px", border: "1px solid #fca5a5", borderRadius: 5, background: "#fff", color: "#dc2626", fontSize: 13, cursor: "pointer", opacity: deactivating === c.id ? 0.6 : 1 }}
                        >
                          Vô hiệu hóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ padding: "10px 14px", color: "#94a3b8", fontSize: 13 }}>{displayed.length} khách hàng</div>
          </div>
        </>
      )}

      {showCreate && (
        <Modal title="Tạo khách hàng" onClose={() => setShowCreate(false)} onSubmit={handleCreate} error={createError}>
          {FIELD("Mã khách hàng", createForm.code, (v) => setCreateForm((f) => ({ ...f, code: v })), true)}
          {FIELD("Tên", createForm.name, (v) => setCreateForm((f) => ({ ...f, name: v })), true)}
          {FIELD("Địa chỉ", createForm.address, (v) => setCreateForm((f) => ({ ...f, address: v })))}
          {FIELD("Số điện thoại", createForm.phone, (v) => setCreateForm((f) => ({ ...f, phone: v })))}
          {FIELD("Email", createForm.email, (v) => setCreateForm((f) => ({ ...f, email: v })), false, "email")}
          {FIELD("Mã số thuế", createForm.taxCode, (v) => setCreateForm((f) => ({ ...f, taxCode: v })))}
        </Modal>
      )}

      {editTarget && (
        <Modal title="Sửa khách hàng" onClose={() => setEditTarget(null)} onSubmit={handleEdit} error={editError}>
          {FIELD("Mã khách hàng", editForm.code, (v) => setEditForm((f) => ({ ...f, code: v })), true)}
          {FIELD("Tên", editForm.name, (v) => setEditForm((f) => ({ ...f, name: v })), true)}
          {FIELD("Địa chỉ", editForm.address, (v) => setEditForm((f) => ({ ...f, address: v })))}
          {FIELD("Số điện thoại", editForm.phone, (v) => setEditForm((f) => ({ ...f, phone: v })))}
          {FIELD("Email", editForm.email, (v) => setEditForm((f) => ({ ...f, email: v })), false, "email")}
          {FIELD("Mã số thuế", editForm.taxCode, (v) => setEditForm((f) => ({ ...f, taxCode: v })))}
        </Modal>
      )}
    </div>
  );
}
