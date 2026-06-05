"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import type { UserRole } from "@tms/shared";

interface UserRow {
  id: string;
  username: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}

const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: "Quản trị viên",
  OPERATOR: "Điều phối viên",
  VIEWER: "Xem",
};

const ROLE_COLORS: Record<UserRole, { bg: string; text: string }> = {
  ADMIN: { bg: "#fef2f2", text: "#dc2626" },
  OPERATOR: { bg: "#eff6ff", text: "#2563eb" },
  VIEWER: { bg: "#f8fafc", text: "#64748b" },
};

const ALL_ROLES: UserRole[] = ["ADMIN", "OPERATOR", "VIEWER"];

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("vi-VN");
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
      <div style={{ background: "#fff", borderRadius: 10, padding: 28, width: 440 }}>
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

function FIELD(label: string, value: string, onChange: (v: string) => void, required?: boolean, type = "text") {
  return (
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
}

export default function UsersPage() {
  const router = useRouter();
  const { role } = useAuth();

  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);
  const [search, setSearch] = useState("");

  // Create modal
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ username: "", password: "", role: "" as UserRole | "" });
  const [createError, setCreateError] = useState<string | null>(null);

  // Edit modal
  const [editTarget, setEditTarget] = useState<UserRow | null>(null);
  const [editForm, setEditForm] = useState({ role: "" as UserRole | "", isActive: true });
  const [editError, setEditError] = useState<string | null>(null);

  // Reset password dialog
  const [resetTarget, setResetTarget] = useState<UserRow | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);

  // Role guard
  useEffect(() => {
    if (role && role !== "ADMIN") router.replace("/dashboard");
  }, [role, router]);

  useEffect(() => {
    if (role !== "ADMIN") return;
    let cancelled = false;
    setLoading(true);
    fetch("/api/users")
      .then((r) => r.json())
      .then((data) => { if (!cancelled) { setUsers(data); setFetchError(null); } })
      .catch((e) => { if (!cancelled) setFetchError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [refresh, role]);

  function openCreate() {
    setCreateForm({ username: "", password: "", role: "" });
    setCreateError(null);
    setShowCreate(true);
  }

  function openEdit(u: UserRow) {
    setEditForm({ role: u.role, isActive: u.isActive });
    setEditError(null);
    setEditTarget(u);
  }

  function openReset(u: UserRow) {
    setNewPassword("");
    setResetError(null);
    setResetSuccess(null);
    setResetTarget(u);
  }

  async function handleCreate() {
    setCreateError(null);
    if (!createForm.username.trim() || !createForm.password || !createForm.role) {
      setCreateError("Vui lòng điền đầy đủ thông tin");
      return;
    }
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: createForm.username.trim(), password: createForm.password, role: createForm.role }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setCreateError(body.message ?? "Lỗi tạo người dùng");
      return;
    }
    setShowCreate(false);
    setRefresh((r) => r + 1);
  }

  async function handleEdit() {
    if (!editTarget) return;
    setEditError(null);
    const res = await fetch(`/api/users/${editTarget.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        role: editForm.role || undefined,
        isActive: editForm.isActive,
      }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setEditError(body.message ?? "Lỗi cập nhật");
      return;
    }
    setEditTarget(null);
    setRefresh((r) => r + 1);
  }

  async function handleReset() {
    if (!resetTarget) return;
    setResetError(null);
    setResetSuccess(null);
    const res = await fetch(`/api/users/${resetTarget.id}/reset-password`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newPassword }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setResetError(body.message ?? "Lỗi đặt lại mật khẩu");
      return;
    }
    setResetSuccess("Mật khẩu đã được đặt lại thành công");
    setNewPassword("");
  }

  if (role && role !== "ADMIN") return null;

  const displayed = users.filter((u) => {
    const q = search.toLowerCase();
    return !q || u.username.toLowerCase().includes(q);
  });

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>Người dùng</h1>
        <button
          onClick={openCreate}
          style={{ padding: "8px 16px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: 6, fontSize: 14, cursor: "pointer" }}
        >
          + Tạo người dùng
        </button>
      </div>

      {fetchError && (
        <p style={{ color: "#dc2626", background: "#fef2f2", padding: "10px 14px", borderRadius: 6, marginBottom: 16, fontSize: 13 }}>{fetchError}</p>
      )}

      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <input
          placeholder="Tìm theo tên đăng nhập..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 14 }}
        />
      </div>

      <div style={{ background: "#fff", borderRadius: 10, boxShadow: "0 1px 4px rgba(0,0,0,0.07)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
              {["Tên đăng nhập", "Vai trò", "Trạng thái", "Ngày tạo", ""].map((h, i) => (
                <th key={i} style={{ padding: "10px 16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ padding: 32, textAlign: "center", color: "#94a3b8" }}>Đang tải...</td></tr>
            ) : displayed.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: 32, textAlign: "center", color: "#94a3b8" }}>Không có dữ liệu</td></tr>
            ) : (
              displayed.map((u, i) => (
                <tr key={u.id} style={{ borderBottom: "1px solid #f1f5f9", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                  <td style={{ padding: "10px 16px", fontSize: 13, fontWeight: 500, fontFamily: "monospace" }}>{u.username}</td>
                  <td style={{ padding: "10px 16px" }}>
                    <span style={{ display: "inline-block", padding: "2px 10px", borderRadius: 12, fontSize: 12, fontWeight: 500, background: ROLE_COLORS[u.role].bg, color: ROLE_COLORS[u.role].text }}>
                      {ROLE_LABELS[u.role]}
                    </span>
                  </td>
                  <td style={{ padding: "10px 16px" }}>
                    <span style={{ display: "inline-block", padding: "2px 10px", borderRadius: 12, fontSize: 12, fontWeight: 500, background: u.isActive ? "#ecfdf5" : "#f8fafc", color: u.isActive ? "#065f46" : "#94a3b8" }}>
                      {u.isActive ? "Hoạt động" : "Vô hiệu"}
                    </span>
                  </td>
                  <td style={{ padding: "10px 16px", fontSize: 13, color: "#64748b" }}>{formatDate(u.createdAt)}</td>
                  <td style={{ padding: "10px 16px", whiteSpace: "nowrap" }}>
                    <button
                      onClick={() => openEdit(u)}
                      style={{ fontSize: 12, padding: "4px 10px", border: "1px solid #d1d5db", borderRadius: 4, background: "#fff", cursor: "pointer", marginRight: 6 }}
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => openReset(u)}
                      style={{ fontSize: 12, padding: "4px 10px", border: "1px solid #6366f1", borderRadius: 4, background: "#eef2ff", color: "#4338ca", cursor: "pointer" }}
                    >
                      Đặt lại MK
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <Modal title="Tạo người dùng mới" onClose={() => setShowCreate(false)} onSubmit={handleCreate} error={createError}>
          {FIELD("Tên đăng nhập *", createForm.username, (v) => setCreateForm((f) => ({ ...f, username: v })), true)}
          {FIELD("Mật khẩu *", createForm.password, (v) => setCreateForm((f) => ({ ...f, password: v })), true, "password")}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 4, color: "#374151" }}>
              Vai trò <span style={{ color: "#dc2626" }}>*</span>
            </label>
            <select
              value={createForm.role}
              onChange={(e) => setCreateForm((f) => ({ ...f, role: e.target.value as UserRole }))}
              required
              style={{ width: "100%", padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 14, boxSizing: "border-box", background: "#fff" }}
            >
              <option value="">-- Chọn vai trò --</option>
              {ALL_ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
            </select>
          </div>
        </Modal>
      )}

      {/* Edit Modal */}
      {editTarget && (
        <Modal title={`Sửa — ${editTarget.username}`} onClose={() => setEditTarget(null)} onSubmit={handleEdit} error={editError}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 4, color: "#374151" }}>Tên đăng nhập</label>
            <div style={{ padding: "8px 10px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 14, background: "#f8fafc", color: "#64748b", fontFamily: "monospace" }}>
              {editTarget.username}
            </div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 4, color: "#374151" }}>Vai trò</label>
            <select
              value={editForm.role}
              onChange={(e) => setEditForm((f) => ({ ...f, role: e.target.value as UserRole }))}
              style={{ width: "100%", padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 14, boxSizing: "border-box", background: "#fff" }}
            >
              {ALL_ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, fontWeight: 500, color: "#374151" }}>
              <input
                type="checkbox"
                checked={editForm.isActive}
                onChange={(e) => setEditForm((f) => ({ ...f, isActive: e.target.checked }))}
                style={{ width: 16, height: 16 }}
              />
              Tài khoản đang hoạt động
            </label>
          </div>
        </Modal>
      )}

      {/* Reset Password Dialog */}
      {resetTarget && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
          <div style={{ background: "#fff", borderRadius: 10, padding: 28, width: 400 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Đặt lại mật khẩu</h2>
              <button onClick={() => setResetTarget(null)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#6b7280" }}>×</button>
            </div>
            <p style={{ fontSize: 13, color: "#64748b", marginBottom: 16 }}>
              Người dùng: <strong style={{ fontFamily: "monospace" }}>{resetTarget.username}</strong>
            </p>
            {resetError && <p style={{ color: "#dc2626", background: "#fef2f2", padding: "8px 12px", borderRadius: 6, fontSize: 13, marginBottom: 14 }}>{resetError}</p>}
            {resetSuccess && <p style={{ color: "#065f46", background: "#ecfdf5", padding: "8px 12px", borderRadius: 6, fontSize: 13, marginBottom: 14 }}>{resetSuccess}</p>}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 4, color: "#374151" }}>
                Mật khẩu mới <span style={{ color: "#dc2626" }}>*</span>
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Tối thiểu 6 ký tự"
                style={{ width: "100%", padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 14, boxSizing: "border-box" }}
              />
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setResetTarget(null)} style={{ padding: "8px 16px", border: "1px solid #d1d5db", borderRadius: 6, background: "#fff", fontSize: 14, cursor: "pointer" }}>Đóng</button>
              <button
                onClick={handleReset}
                disabled={!newPassword}
                style={{ padding: "8px 16px", background: "#6366f1", color: "#fff", border: "none", borderRadius: 6, fontSize: 14, cursor: "pointer", opacity: !newPassword ? 0.5 : 1 }}
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
