"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/lib/toast-context";

interface CustomerRow {
  id: string;
  code: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  taxCode: string | null;
}

const FIELD = (
  label: string,
  value: string,
  onChange: (v: string) => void,
  required?: boolean,
  type = "text",
) => (
  <div style={{ marginBottom: 14 }}>
    <label
      style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 4, color: "#374151" }}
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
        <form
          onSubmit={handleSubmit}
          onKeyDown={(e) => { const tag = (e.target as HTMLElement).tagName; if (e.key === "Enter" && tag !== "TEXTAREA" && tag !== "BUTTON") e.preventDefault(); }}
        >
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

const EMPTY_FORM = { code: "", name: "", address: "", phone: "", email: "", taxCode: "" };
const PAGE_SIZE_CUST = 10;

export default function CustomersPage() {
  const toast = useToast();
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState(EMPTY_FORM);
  const [createError, setCreateError] = useState<string | null>(null);

  const [editTarget, setEditTarget] = useState<CustomerRow | null>(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [editError, setEditError] = useState<string | null>(null);

  const [deactivating, setDeactivating] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", String(PAGE_SIZE_CUST));
    if (search.trim()) params.set("search", search.trim());
    fetch(`/api/customers?${params.toString()}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`API error ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (!cancelled) {
          setCustomers(data.data);
          setTotal(data.meta.total);
          setTotalPages(data.meta.totalPages);
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Lỗi không xác định");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [refresh, search, page]);

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
      const msg = body.message ?? `Lỗi ${res.status}`;
      setCreateError(msg);
      toast.error(msg);
      throw new Error("create failed");
    }
    setShowCreate(false);
    setCreateForm(EMPTY_FORM);
    setRefresh((r) => r + 1);
    toast.success("Thêm khách hàng thành công");
  }

  function openEdit(c: CustomerRow) {
    setEditTarget(c);
    setEditForm({
      code: c.code,
      name: c.name,
      address: c.address ?? "",
      phone: c.phone ?? "",
      email: c.email ?? "",
      taxCode: c.taxCode ?? "",
    });
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
      const msg = body.message ?? `Lỗi ${res.status}`;
      setEditError(msg);
      toast.error(msg);
      throw new Error("edit failed");
    }
    setEditTarget(null);
    setRefresh((r) => r + 1);
    toast.success("Cập nhật khách hàng thành công");
  }

  async function handleDeactivate(id: string) {
    setDeactivating(id);
    setConfirmDeleteId(null);
    const res = await fetch(`/api/customers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: false }),
    });
    setDeactivating(null);
    if (res.ok) {
      toast.success("Đã xoá khách hàng");
      setRefresh((r) => r + 1);
    } else {
      toast.error("Lỗi xoá khách hàng");
    }
  }

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
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>Khách hàng</h1>
        <button
          onClick={() => {
            setCreateForm(EMPTY_FORM);
            setCreateError(null);
            setShowCreate(true);
          }}
          style={{
            padding: "8px 16px",
            background: "#3b82f6",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            fontSize: 14,
            cursor: "pointer",
            fontWeight: 500,
          }}
        >
          + Tạo khách hàng
        </button>
      </div>

      {loading && <p style={{ color: "#64748b" }}>Đang tải...</p>}
      {error && (
        <p
          style={{ color: "#dc2626", background: "#fef2f2", padding: "12px 16px", borderRadius: 8 }}
        >
          {error}
        </p>
      )}

      {!loading && !error && (
        <>
          <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
            <input
              placeholder="Tìm theo mã, tên khách hàng..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              style={{
                flex: 1,
                padding: "8px 12px",
                border: "1px solid #d1d5db",
                borderRadius: 6,
                fontSize: 14,
              }}
            />
          </div>
          <div
            style={{
              background: "#fff",
              borderRadius: 10,
              boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
              overflowX: "auto",
            }}
          >
            <table
              style={{ width: "100%", minWidth: 720, borderCollapse: "collapse", fontSize: 14 }}
            >
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                  {["Mã", "Tên", "SĐT", "Email", "Mã số thuế", ""].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "10px 14px",
                        textAlign: "left",
                        fontWeight: 600,
                        color: "#374151",
                        fontSize: 13,
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {customers.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      style={{ padding: "24px 14px", textAlign: "center", color: "#94a3b8" }}
                    >
                      Chưa có khách hàng
                    </td>
                  </tr>
                )}
                {customers.map((c) => (
                  <tr key={c.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "10px 14px", fontWeight: 600 }}>{c.code}</td>
                    <td style={{ padding: "10px 14px" }}>{c.name}</td>
                    <td style={{ padding: "10px 14px", color: "#64748b" }}>{c.phone ?? "—"}</td>
                    <td style={{ padding: "10px 14px", color: "#64748b" }}>{c.email ?? "—"}</td>
                    <td style={{ padding: "10px 14px", color: "#64748b" }}>{c.taxCode ?? "—"}</td>
                    <td style={{ padding: "10px 14px" }}>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          onClick={() => openEdit(c)}
                          style={{
                            padding: "5px 12px",
                            border: "1px solid #d1d5db",
                            borderRadius: 5,
                            background: "#fff",
                            fontSize: 13,
                            cursor: "pointer",
                          }}
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(c.id)}
                          disabled={deactivating === c.id}
                          style={{
                            padding: "5px 12px",
                            border: "1px solid #ef4444",
                            borderRadius: 5,
                            background: "#fff",
                            color: "#ef4444",
                            fontSize: 13,
                            cursor: "pointer",
                            opacity: deactivating === c.id ? 0.6 : 1,
                          }}
                        >
                          Xoá
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
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
                  ? "0 khách hàng"
                  : `Hiển thị ${(page - 1) * PAGE_SIZE_CUST + 1}–${Math.min(page * PAGE_SIZE_CUST, total)} / ${total}`}
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
        </>
      )}

      {showCreate && (
        <Modal
          title="Tạo khách hàng"
          onClose={() => setShowCreate(false)}
          onSubmit={handleCreate}
          error={createError}
        >
          {FIELD(
            "Mã khách hàng",
            createForm.code,
            (v) => setCreateForm((f) => ({ ...f, code: v })),
            true,
          )}
          {FIELD("Tên", createForm.name, (v) => setCreateForm((f) => ({ ...f, name: v })), true)}
          {FIELD("Địa chỉ", createForm.address, (v) =>
            setCreateForm((f) => ({ ...f, address: v })),
          )}
          {FIELD("Số điện thoại", createForm.phone, (v) =>
            setCreateForm((f) => ({ ...f, phone: v })),
          )}
          {FIELD(
            "Email",
            createForm.email,
            (v) => setCreateForm((f) => ({ ...f, email: v })),
            false,
            "email",
          )}
          {FIELD("Mã số thuế", createForm.taxCode, (v) =>
            setCreateForm((f) => ({ ...f, taxCode: v })),
          )}
        </Modal>
      )}

      {editTarget && (
        <Modal
          title="Sửa khách hàng"
          onClose={() => setEditTarget(null)}
          onSubmit={handleEdit}
          error={editError}
        >
          {FIELD(
            "Mã khách hàng",
            editForm.code,
            (v) => setEditForm((f) => ({ ...f, code: v })),
            true,
          )}
          {FIELD("Tên", editForm.name, (v) => setEditForm((f) => ({ ...f, name: v })), true)}
          {FIELD("Địa chỉ", editForm.address, (v) => setEditForm((f) => ({ ...f, address: v })))}
          {FIELD("Số điện thoại", editForm.phone, (v) => setEditForm((f) => ({ ...f, phone: v })))}
          {FIELD(
            "Email",
            editForm.email,
            (v) => setEditForm((f) => ({ ...f, email: v })),
            false,
            "email",
          )}
          {FIELD("Mã số thuế", editForm.taxCode, (v) => setEditForm((f) => ({ ...f, taxCode: v })))}
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
              Bạn có chắc muốn xoá khách hàng này?
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
                onClick={() => handleDeactivate(confirmDeleteId)}
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
