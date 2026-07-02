"use client";

import { useToast } from "@/lib/toast-context";
import { useEffect, useState } from "react";
import { BulkActionBar, ConfirmDialog, SelectionCheckbox, useRowSelection } from "@tms/ui";
import type { BulkDeleteResult } from "@tms/shared";

function fmtInput(raw: string): string {
  const digits = raw.replace(/\./g, "");
  if (!digits) return "";
  return Number(digits).toLocaleString("vi-VN");
}

function stripNonDigits(v: string): string {
  return v.replace(/\./g, "").replace(/[^\d]/g, "");
}

interface CostTemplateRow {
  id: string;
  name: string;
  defaultAmount: number | null;
  isActive: boolean;
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
}) {
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

function Modal({
  title,
  onClose,
  onSubmit,
  error,
  children,
}: {
  title: string;
  onClose: () => void;
  onSubmit: () => Promise<void>;
  error: string | null;
  children: React.ReactNode;
}) {
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
      <div style={{ background: "#fff", borderRadius: 10, padding: 28, width: 440 }}>
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

const EMPTY = { name: "", defaultAmount: "" };

const PAGE_SIZE = 10;

export default function CostTemplatesPage() {
  const toast = useToast();
  const [rows, setRows] = useState<CostTemplateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState(EMPTY);
  const [createError, setCreateError] = useState<string | null>(null);

  const [editTarget, setEditTarget] = useState<CostTemplateRow | null>(null);
  const [editForm, setEditForm] = useState(EMPTY);
  const [editError, setEditError] = useState<string | null>(null);

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);

  const selection = useRowSelection(rows.map((r) => r.id));

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", String(PAGE_SIZE));
    if (search.trim()) params.set("q", search.trim());
    fetch(`/api/cost-templates?${params.toString()}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((data) => {
        if (!cancelled) {
          setRows(data.data);
          setTotal(data.meta.total);
          setTotalPages(data.meta.totalPages);
          setError(null);
        }
      })
      .catch((e) => {
        if (!cancelled) setError(`Lỗi tải dữ liệu: ${e}`);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [refresh, search, page]);

  useEffect(() => {
    selection.clear();
  }, [refresh, search, page, selection.clear]);

  function parseAmount(v: string): number | undefined {
    const n = parseFloat(v.replace(/,/g, ""));
    return isNaN(n) ? undefined : n;
  }

  async function handleCreate() {
    setCreateError(null);
    const body: Record<string, unknown> = { name: createForm.name };
    const amt = parseAmount(createForm.defaultAmount);
    if (amt !== undefined) body.defaultAmount = amt;
    const res = await fetch("/api/cost-templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const b = await res.json().catch(() => ({}));
      const msg = b.message ?? `Lỗi ${res.status}`;
      setCreateError(msg);
      toast.error(msg);
      throw new Error("create failed");
    }
    setShowCreate(false);
    setCreateForm(EMPTY);
    setRefresh((r) => r + 1);
    toast.success("Thêm danh mục chi phí thành công");
  }

  async function handleEdit() {
    if (!editTarget) return;
    setEditError(null);
    const body: Record<string, unknown> = { name: editForm.name };
    const amt = parseAmount(editForm.defaultAmount);
    body.defaultAmount = amt !== undefined ? amt : null;
    const res = await fetch(`/api/cost-templates/${editTarget.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const b = await res.json().catch(() => ({}));
      const msg = b.message ?? `Lỗi ${res.status}`;
      setEditError(msg);
      toast.error(msg);
      throw new Error("edit failed");
    }
    setEditTarget(null);
    setRefresh((r) => r + 1);
    toast.success("Cập nhật danh mục chi phí thành công");
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    setConfirmDeleteId(null);
    const res = await fetch(`/api/cost-templates/${id}`, { method: "DELETE" });
    setDeleting(null);
    if (res.ok) {
      toast.success("Đã xoá danh mục chi phí");
      setRefresh((r) => r + 1);
    } else {
      const b = await res.json().catch(() => ({}));
      toast.error(b.message ?? "Lỗi xoá danh mục chi phí");
    }
  }

  async function handleBulkDelete() {
    const ids = Array.from(selection.selected);
    const res = await fetch("/api/cost-templates/bulk-delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });
    setShowBulkConfirm(false);
    if (!res.ok) {
      toast.error("Lỗi xoá hàng loạt");
      return;
    }
    const result: BulkDeleteResult = await res.json();
    setRefresh((r) => r + 1);
    if (result.skipped.length === 0) {
      toast.success(`Đã xoá ${result.deleted.length} danh mục chi phí`);
    } else {
      const reasons = Array.from(new Set(result.skipped.map((s) => s.reason))).join("; ");
      toast.error(
        `Đã xoá ${result.deleted.length}, bỏ qua ${result.skipped.length}: ${reasons}`,
      );
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
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>Danh mục chi phí</h1>
        <button
          onClick={() => {
            setCreateForm(EMPTY);
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
          + Thêm chi phí
        </button>
      </div>

      <div style={{ marginBottom: 16 }}>
        <input
          placeholder="Tìm theo tên chi phí..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          style={{
            padding: "8px 12px",
            border: "1px solid #d1d5db",
            borderRadius: 6,
            fontSize: 14,
            width: 300,
          }}
        />
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
        <BulkActionBar
          selectedCount={selection.selectedCount}
          onDelete={() => setShowBulkConfirm(true)}
          onClear={selection.clear}
        />
        <div
          style={{
            background: "#fff",
            borderRadius: 10,
            boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
            overflowX: "auto",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                <th style={{ padding: "10px 14px", width: 32 }}>
                  <SelectionCheckbox
                    checked={selection.isAllSelected}
                    onChange={selection.toggleAll}
                    ariaLabel="Chọn tất cả danh mục chi phí"
                  />
                </th>
                {["Tên chi phí", "Số tiền mặc định", "Trạng thái", ""].map((h) => (
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
              {rows.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    style={{ padding: "24px 14px", textAlign: "center", color: "#94a3b8" }}
                  >
                    Chưa có danh mục chi phí
                  </td>
                </tr>
              )}
              {rows.map((r) => (
                <tr key={r.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "10px 14px" }}>
                    <SelectionCheckbox
                      checked={selection.isSelected(r.id)}
                      onChange={() => selection.toggle(r.id)}
                      ariaLabel={`Chọn danh mục chi phí ${r.name}`}
                    />
                  </td>
                  <td style={{ padding: "10px 14px", fontWeight: 500 }}>{r.name}</td>
                  <td
                    style={{
                      padding: "10px 14px",
                      color: r.defaultAmount != null ? "#111827" : "#94a3b8",
                    }}
                  >
                    {r.defaultAmount != null
                      ? Number(r.defaultAmount).toLocaleString("vi-VN") + "đ"
                      : "—"}
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: 12,
                        fontSize: 12,
                        fontWeight: 500,
                        background: r.isActive ? "#dcfce7" : "#f1f5f9",
                        color: r.isActive ? "#166534" : "#64748b",
                      }}
                    >
                      {r.isActive ? "Hoạt động" : "Ngừng"}
                    </span>
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={() => {
                          setEditTarget(r);
                          setEditForm({
                            name: r.name,
                            defaultAmount: r.defaultAmount != null ? String(r.defaultAmount) : "",
                          });
                          setEditError(null);
                        }}
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
                        onClick={() => setConfirmDeleteId(r.id)}
                        disabled={deleting === r.id}
                        style={{
                          padding: "5px 12px",
                          border: "1px solid #ef4444",
                          borderRadius: 5,
                          background: "#fff",
                          color: "#ef4444",
                          fontSize: 13,
                          cursor: "pointer",
                          opacity: deleting === r.id ? 0.6 : 1,
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
                ? "0 danh mục"
                : `Hiển thị ${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, total)} / ${total}`}
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
          title="Thêm danh mục chi phí"
          onClose={() => setShowCreate(false)}
          onSubmit={handleCreate}
          error={createError}
        >
          <Field
            label="Tên chi phí"
            value={createForm.name}
            onChange={(v) => setCreateForm((f) => ({ ...f, name: v }))}
            required
          />
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
              Số tiền mặc định (để trống nếu không có)
            </label>
            <input
              type="text"
              value={fmtInput(createForm.defaultAmount)}
              onChange={(e) =>
                setCreateForm((f) => ({ ...f, defaultAmount: stripNonDigits(e.target.value) }))
              }
              placeholder="Ví dụ: 1.000.000"
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
        </Modal>
      )}

      {editTarget && (
        <Modal
          title="Sửa danh mục chi phí"
          onClose={() => setEditTarget(null)}
          onSubmit={handleEdit}
          error={editError}
        >
          <Field
            label="Tên chi phí"
            value={editForm.name}
            onChange={(v) => setEditForm((f) => ({ ...f, name: v }))}
            required
          />
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
              Số tiền mặc định (để trống để xoá)
            </label>
            <input
              type="text"
              value={fmtInput(editForm.defaultAmount)}
              onChange={(e) =>
                setEditForm((f) => ({ ...f, defaultAmount: stripNonDigits(e.target.value) }))
              }
              placeholder="Ví dụ: 1.000.000"
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
              Bạn có chắc muốn xoá danh mục chi phí này?
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
                onClick={() => handleDelete(confirmDeleteId)}
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

      {showBulkConfirm && (
        <ConfirmDialog
          title="Xác nhận xoá hàng loạt"
          message={`Bạn có chắc muốn xoá vĩnh viễn ${selection.selectedCount} danh mục chi phí đã chọn? Hành động này không thể hoàn tác.`}
          danger
          onConfirm={handleBulkDelete}
          onCancel={() => setShowBulkConfirm(false)}
        />
      )}
    </div>
  );
}
