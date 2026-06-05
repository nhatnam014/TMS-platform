"use client";

import { useEffect, useState } from "react";

interface TripCostItem {
  id: string;
  name: string;
  amount: number | null;
  isActive: boolean;
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

function fmt(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  return n.toLocaleString("vi-VN");
}

export default function TripCostsPage() {
  const [items, setItems] = useState<TripCostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [creating, setCreating] = useState(false);

  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [saving, setSaving] = useState(false);

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function fetchItems() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/trip-costs");
      if (!res.ok) throw new Error(`API error ${res.status}`);
      setItems(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchItems();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    setActionError(null);
    try {
      const body: { name: string; amount?: number } = { name: newName.trim() };
      if (newAmount.trim()) {
        const amt = Number(newAmount);
        if (isNaN(amt) || amt <= 0) throw new Error("Số tiền mặc định phải lớn hơn 0");
        body.amount = amt;
      }
      const res = await fetch("/api/trip-costs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message ?? "Lỗi tạo chi phí");
      }
      setNewName("");
      setNewAmount("");
      setShowCreate(false);
      fetchItems();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Lỗi không xác định");
    } finally {
      setCreating(false);
    }
  }

  async function handleSaveEdit(id: string) {
    if (!editName.trim()) return;
    setSaving(true);
    setActionError(null);
    try {
      const body: { name: string; amount?: number | null } = { name: editName.trim() };
      if (editAmount.trim()) {
        const amt = Number(editAmount);
        if (isNaN(amt) || amt <= 0) throw new Error("Số tiền mặc định phải lớn hơn 0");
        body.amount = amt;
      } else {
        body.amount = null;
      }
      const res = await fetch(`/api/trip-costs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message ?? "Lỗi cập nhật");
      }
      setEditId(null);
      fetchItems();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Lỗi không xác định");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(item: TripCostItem) {
    setActionError(null);
    try {
      const res = await fetch(`/api/trip-costs/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !item.isActive }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message ?? "Lỗi cập nhật");
      }
      fetchItems();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Lỗi không xác định");
    }
  }

  async function handleDelete(id: string) {
    setDeleting(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/trip-costs/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message ?? "Lỗi xóa");
      }
      setConfirmDeleteId(null);
      fetchItems();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Lỗi không xác định");
    } finally {
      setDeleting(false);
    }
  }

  const confirmItem = items.find((i) => i.id === confirmDeleteId);

  return (
    <div>
      {confirmDeleteId && confirmItem && (
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
              width: 420,
              boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
            }}
          >
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Xác nhận xóa</h2>
            <p style={{ fontSize: 13, color: "#374151", marginBottom: 8 }}>
              Bạn có chắc muốn xóa <strong>"{confirmItem.name}"</strong>?
            </p>
            <p style={{ fontSize: 12, color: "#dc2626", marginBottom: 20 }}>
              ⚠️ Tất cả dữ liệu chi phí liên quan trong các chuyến xe sẽ bị xóa vĩnh viễn.
            </p>
            {actionError && (
              <p style={{ color: "#dc2626", fontSize: 13, marginBottom: 10 }}>{actionError}</p>
            )}
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={() => setConfirmDeleteId(null)} style={btnSecondary}>
                Hủy
              </button>
              <button
                onClick={() => handleDelete(confirmDeleteId)}
                disabled={deleting}
                style={{ ...btnPrimary, background: "#dc2626" }}
              >
                {deleting ? "Đang xóa..." : "Xóa vĩnh viễn"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>Danh mục chi phí</h1>
        <button
          onClick={() => {
            setShowCreate(true);
            setActionError(null);
          }}
          style={btnPrimary}
        >
          + Thêm chi phí
        </button>
      </div>

      {showCreate && (
        <form
          onSubmit={handleCreate}
          style={{
            background: "#fff",
            borderRadius: 10,
            padding: "14px 16px",
            boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
            marginBottom: 16,
          }}
        >
          <div style={{ display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap" }}>
            <div style={{ flex: 2, minWidth: 160 }}>
              <label
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#374151",
                  display: "block",
                  marginBottom: 4,
                }}
              >
                Tên chi phí *
              </label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                style={inputStyle}
                placeholder="Ví dụ: PHÍ NÂNG"
                autoFocus
                required
              />
            </div>
            <div style={{ flex: 1, minWidth: 130 }}>
              <label
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#374151",
                  display: "block",
                  marginBottom: 4,
                }}
              >
                Giá mặc định (VND)
              </label>
              <input
                type="number"
                min={1}
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                style={inputStyle}
                placeholder="1200000"
              />
            </div>
            {actionError && (
              <p style={{ color: "#dc2626", fontSize: 12, width: "100%" }}>{actionError}</p>
            )}
            <button type="submit" disabled={creating} style={btnPrimary}>
              {creating ? "Đang tạo..." : "Tạo"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowCreate(false);
                setNewName("");
                setNewAmount("");
                setActionError(null);
              }}
              style={btnSecondary}
            >
              Hủy
            </button>
          </div>
        </form>
      )}

      {actionError && !showCreate && !confirmDeleteId && (
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

      {loading ? (
        <p style={{ color: "#64748b", fontSize: 14 }}>Đang tải...</p>
      ) : error ? (
        <p
          style={{ color: "#dc2626", background: "#fef2f2", padding: "12px 16px", borderRadius: 8 }}
        >
          {error}
        </p>
      ) : (
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
                {["Tên chi phí", "Giá mặc định", "Trạng thái", "Thao tác"].map((h) => (
                  <th
                    key={h}
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
              {items.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: 32, textAlign: "center", color: "#94a3b8" }}>
                    Chưa có loại chi phí nào
                  </td>
                </tr>
              ) : (
                items.map((item, i) => (
                  <tr
                    key={item.id}
                    style={{
                      borderBottom: "1px solid #f1f5f9",
                      background: i % 2 === 0 ? "#fff" : "#fafafa",
                    }}
                  >
                    <td style={{ padding: "10px 16px", fontSize: 13 }}>
                      {editId === item.id ? (
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          style={{ ...inputStyle, width: 220 }}
                          autoFocus
                        />
                      ) : (
                        <span style={{ fontWeight: 500 }}>{item.name}</span>
                      )}
                    </td>
                    <td
                      style={{
                        padding: "10px 16px",
                        fontSize: 13,
                        color: item.amount ? "#0f172a" : "#94a3b8",
                      }}
                    >
                      {editId === item.id ? (
                        <input
                          type="number"
                          min={1}
                          value={editAmount}
                          onChange={(e) => setEditAmount(e.target.value)}
                          style={{ ...inputStyle, width: 140 }}
                          placeholder="Để trống = bỏ giá"
                        />
                      ) : (
                        fmt(item.amount)
                      )}
                    </td>
                    <td style={{ padding: "10px 16px" }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "2px 10px",
                          borderRadius: 12,
                          fontSize: 12,
                          fontWeight: 500,
                          background: item.isActive ? "#f0fdf4" : "#f8fafc",
                          color: item.isActive ? "#16a34a" : "#94a3b8",
                        }}
                      >
                        {item.isActive ? "Hoạt động" : "Ẩn"}
                      </span>
                    </td>
                    <td style={{ padding: "10px 16px" }}>
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        {editId === item.id ? (
                          <>
                            <button
                              onClick={() => handleSaveEdit(item.id)}
                              disabled={saving}
                              style={{
                                padding: "4px 10px",
                                fontSize: 12,
                                background: "#2563eb",
                                color: "#fff",
                                border: "none",
                                borderRadius: 5,
                                cursor: "pointer",
                              }}
                            >
                              {saving ? "..." : "Lưu"}
                            </button>
                            <button
                              onClick={() => setEditId(null)}
                              style={{
                                padding: "4px 10px",
                                fontSize: 12,
                                background: "#f8fafc",
                                color: "#64748b",
                                border: "1px solid #e2e8f0",
                                borderRadius: 5,
                                cursor: "pointer",
                              }}
                            >
                              Hủy
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => {
                              setEditId(item.id);
                              setEditName(item.name);
                              setEditAmount(item.amount != null ? String(item.amount) : "");
                              setActionError(null);
                            }}
                            style={{
                              padding: "4px 10px",
                              fontSize: 12,
                              background: "#eff6ff",
                              color: "#2563eb",
                              border: "1px solid #bfdbfe",
                              borderRadius: 5,
                              cursor: "pointer",
                            }}
                          >
                            Sửa
                          </button>
                        )}
                        <button
                          onClick={() => handleToggleActive(item)}
                          style={{
                            padding: "4px 10px",
                            fontSize: 12,
                            background: "#f8fafc",
                            color: "#64748b",
                            border: "1px solid #e2e8f0",
                            borderRadius: 5,
                            cursor: "pointer",
                          }}
                        >
                          {item.isActive ? "Ẩn" : "Hiện"}
                        </button>
                        <button
                          onClick={() => {
                            setConfirmDeleteId(item.id);
                            setActionError(null);
                          }}
                          style={{
                            padding: "4px 10px",
                            fontSize: 12,
                            background: "#fef2f2",
                            color: "#ef4444",
                            border: "1px solid #fecaca",
                            borderRadius: 5,
                            cursor: "pointer",
                          }}
                        >
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
