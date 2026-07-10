"use client";

import { useToast } from "@/lib/toast-context";
import { useEffect, useState } from "react";
import { BulkActionBar, ConfirmDialog, SelectionCheckbox, useRowSelection } from "@tms/ui";
import type { BulkDeleteResult } from "@tms/shared";
import { formatDate, toDateInput } from "@/lib/date-utils";
import { ImportExportModal } from "@/components/import-export/import-export-modal";
import { UploadSection } from "@/components/import-export/upload-section";
import { DownloadButton } from "@/components/import-export/download-button";

interface YardMoveRow {
  id: string;
  date: string;
  gps: string | null;
  fullName: string | null;
  truck: string | null;
  mooc: string | null;
  booking: string | null;
  containerNumber: string | null;
  notes: string | null;
  daKeo: string | null;
}

interface YardMoveFormValues {
  date: string;
  gps: string;
  fullName: string;
  truck: string;
  mooc: string;
  booking: string;
  containerNumber: string;
  notes: string;
  daKeo: string;
}

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

const EMPTY_FORM: YardMoveFormValues = {
  date: "",
  gps: "",
  fullName: "",
  truck: "",
  mooc: "",
  booking: "",
  containerNumber: "",
  notes: "",
  daKeo: "",
};

function YardMoveFormFields({
  values,
  onChange,
}: {
  values: YardMoveFormValues;
  onChange: (next: YardMoveFormValues) => void;
}) {
  function setField(key: keyof YardMoveFormValues, value: string) {
    onChange({ ...values, [key]: value });
  }

  return (
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
          value={values.date}
          onChange={(e) => setField("date", e.target.value)}
          style={ymInputStyle}
          required
        />
      </YmField>
      <YmField label="GPS">
        <input
          type="text"
          value={values.gps}
          onChange={(e) => setField("gps", e.target.value)}
          style={ymInputStyle}
        />
      </YmField>
      <YmField label="Full Name">
        <input
          type="text"
          value={values.fullName}
          onChange={(e) => setField("fullName", e.target.value)}
          style={ymInputStyle}
        />
      </YmField>
      <YmField label="Truck">
        <input
          type="text"
          value={values.truck}
          onChange={(e) => setField("truck", e.target.value)}
          style={ymInputStyle}
        />
      </YmField>
      <YmField label="Mooc">
        <input
          type="text"
          value={values.mooc}
          onChange={(e) => setField("mooc", e.target.value)}
          style={ymInputStyle}
        />
      </YmField>
      <YmField label="Booking">
        <input
          type="text"
          value={values.booking}
          onChange={(e) => setField("booking", e.target.value)}
          style={ymInputStyle}
        />
      </YmField>
      <YmField label="Container">
        <input
          type="text"
          value={values.containerNumber}
          onChange={(e) => setField("containerNumber", e.target.value)}
          style={ymInputStyle}
        />
      </YmField>

      <div style={{ gridColumn: "1 / -1" }}>
        <YmField label="Ghi chú">
          <textarea
            value={values.notes}
            onChange={(e) => setField("notes", e.target.value)}
            rows={2}
            style={{ ...ymInputStyle, resize: "vertical" }}
          />
        </YmField>
      </div>
      <YmField label="Đã kéo">
        <input
          type="text"
          value={values.daKeo}
          onChange={(e) => setField("daKeo", e.target.value)}
          style={ymInputStyle}
        />
      </YmField>
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
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [values, setValues] = useState<YardMoveFormValues>(EMPTY_FORM);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!values.date.trim()) {
      setFormError("Vui lòng nhập ngày.");
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      const res = await fetch("/api/yard-moves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: values.date,
          gps: values.gps || undefined,
          fullName: values.fullName || undefined,
          truck: values.truck || undefined,
          mooc: values.mooc || undefined,
          booking: values.booking || undefined,
          containerNumber: values.containerNumber || undefined,
          notes: values.notes || undefined,
          daKeo: values.daKeo || undefined,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message ?? `Lỗi ${res.status}`);
      }
      toast.success("Tạo tiến độ vận tải thành công");
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
    <Modal title="Tạo tiến độ vận tải mới" onClose={onClose} wide>
      <form
        onSubmit={handleSubmit}
        onKeyDown={(e) => { const tag = (e.target as HTMLElement).tagName; if (e.key === "Enter" && tag !== "TEXTAREA" && tag !== "BUTTON") e.preventDefault(); }}
      >
        <YardMoveFormFields values={values} onChange={setValues} />
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
            {submitting ? "Đang tạo..." : "Tạo tiến độ vận tải"}
          </button>
        </div>
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
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [values, setValues] = useState<YardMoveFormValues>({
    date: toDateInput(move.date),
    gps: move.gps ?? "",
    fullName: move.fullName ?? "",
    truck: move.truck ?? "",
    mooc: move.mooc ?? "",
    booking: move.booking ?? "",
    containerNumber: move.containerNumber ?? "",
    notes: move.notes ?? "",
    daKeo: move.daKeo ?? "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!values.date.trim()) {
      setFormError("Vui lòng nhập ngày.");
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      const res = await fetch(`/api/yard-moves/${move.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: values.date,
          gps: values.gps || undefined,
          fullName: values.fullName || undefined,
          truck: values.truck || undefined,
          mooc: values.mooc || undefined,
          booking: values.booking || undefined,
          containerNumber: values.containerNumber || undefined,
          notes: values.notes || undefined,
          daKeo: values.daKeo || undefined,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message ?? `Lỗi ${res.status}`);
      }
      toast.success("Cập nhật tiến độ vận tải thành công");
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
    <Modal title="Sửa tiến độ vận tải" onClose={onClose} wide>
      <form
        onSubmit={handleSubmit}
        onKeyDown={(e) => { const tag = (e.target as HTMLElement).tagName; if (e.key === "Enter" && tag !== "TEXTAREA" && tag !== "BUTTON") e.preventDefault(); }}
      >
        <YardMoveFormFields values={values} onChange={setValues} />
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

const TABLE_HEADERS = [
  "STT",
  "Ngày",
  "GPS",
  "Full Name",
  "Truck",
  "Mooc",
  "Booking",
  "Container",
  "Đã kéo",
  "Ghi chú",
  "Thao tác",
];

export default function YardMovesPage() {
  const toast = useToast();
  const [moves, setMoves] = useState<YardMoveRow[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [editMove, setEditMove] = useState<YardMoveRow | null>(null);
  const [search, setSearch] = useState("");
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);
  const [showImportExport, setShowImportExport] = useState(false);
  const [exportFromDate, setExportFromDate] = useState("");
  const [exportToDate, setExportToDate] = useState("");
  const [exportDaKeoStatus, setExportDaKeoStatus] = useState<"" | "hauled" | "pending">("");

  const selection = useRowSelection(moves.map((m) => m.id));

  function fetchMoves(currentPage = page) {
    selection.clear();
    const params = new URLSearchParams();
    params.set("page", String(currentPage));
    params.set("limit", String(PAGE_SIZE_YARD));
    if (search.trim()) params.set("search", search.trim());
    fetch(`/api/yard-moves?${params.toString()}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`API error ${res.status}`);
        const data = await res.json();
        setMoves(data.data);
        setTotal(data.meta.total);
        setTotalPages(data.meta.totalPages);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Lỗi không xác định"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchMoves(page);
  }, [page, search]);

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
      toast.success("Đã xoá tiến độ vận tải");
      fetchMoves(page);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lỗi xoá tiến độ vận tải");
    }
  }

  async function handleBulkDelete() {
    const ids = Array.from(selection.selected);
    const res = await fetch("/api/yard-moves/bulk-delete", {
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
    fetchMoves(page);
    if (result.skipped.length === 0) {
      toast.success(`Đã xoá ${result.deleted.length} tiến độ vận tải`);
    } else {
      const reasons = Array.from(new Set(result.skipped.map((s) => s.reason))).join("; ");
      toast.error(
        `Đã xoá ${result.deleted.length}, bỏ qua ${result.skipped.length}: ${reasons}`,
      );
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
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>Tiến độ vận tải</h1>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <span style={{ fontSize: 13, color: "#64748b" }}>{total} lệnh</span>
          <button
            onClick={() => setShowImportExport(true)}
            style={{
              padding: "7px 16px",
              background: "#fff",
              color: "#374151",
              border: "1px solid #d1d5db",
              borderRadius: 7,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Nhập / Xuất Excel
          </button>
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

      {showImportExport && (
        <ImportExportModal
          title="Nhập / Xuất Excel — Tiến độ vận tải"
          onClose={() => setShowImportExport(false)}
        >
          <UploadSection
            title="Nhập tiến độ vận tải"
            endpoint="/api/import/yard-moves?confirm=true"
            onImported={() => fetchMoves(page)}
            description="Tải lên sheet 'tiến độ vận tải'. Hàng có ID → cập nhật; hàng không có ID → tạo mới."
          />
          <div style={{ background: "#fff", borderRadius: 10, padding: 24, border: "1px solid #e5e7eb" }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Xuất tiến độ vận tải</h2>
            <p style={{ fontSize: 13, color: "#64748b", marginBottom: 16 }}>
              Xuất danh sách tiến độ vận tải ra file Excel. Lọc theo ngày và trạng thái đã kéo (tùy chọn).
            </p>
            <DownloadButton
              label="Tải xuống tien-do-van-tai.xlsx"
              endpoint="/api/export/yard-moves"
              filename="tien-do-van-tai.xlsx"
              buildUrl={() => {
                const params = new URLSearchParams();
                if (exportFromDate) params.set("from", exportFromDate);
                if (exportToDate) params.set("to", exportToDate);
                if (exportDaKeoStatus) params.set("daKeoStatus", exportDaKeoStatus);
                const qs = params.toString();
                return `/api/export/yard-moves${qs ? `?${qs}` : ""}`;
              }}
              extraInputs={
                <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                  <div>
                    <label style={{ display: "block", fontSize: 12, color: "#64748b", marginBottom: 4 }}>
                      Từ ngày
                    </label>
                    <input
                      type="date"
                      value={exportFromDate}
                      onChange={(e) => setExportFromDate(e.target.value)}
                      style={{ padding: "6px 10px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 13 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, color: "#64748b", marginBottom: 4 }}>
                      Đến ngày
                    </label>
                    <input
                      type="date"
                      value={exportToDate}
                      onChange={(e) => setExportToDate(e.target.value)}
                      style={{ padding: "6px 10px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 13 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, color: "#64748b", marginBottom: 4 }}>
                      Trạng thái
                    </label>
                    <div style={{ display: "flex", gap: 4 }}>
                      {(
                        [
                          { value: "", label: "Tất cả" },
                          { value: "hauled", label: "Đã kéo" },
                          { value: "pending", label: "Tồn" },
                        ] as const
                      ).map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setExportDaKeoStatus(opt.value)}
                          style={{
                            padding: "6px 12px",
                            border: "1px solid #d1d5db",
                            borderRadius: 6,
                            fontSize: 13,
                            cursor: "pointer",
                            background: exportDaKeoStatus === opt.value ? "#3b82f6" : "#fff",
                            color: exportDaKeoStatus === opt.value ? "#fff" : "#374151",
                            fontWeight: exportDaKeoStatus === opt.value ? 600 : 400,
                          }}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              }
            />
          </div>
        </ImportExportModal>
      )}

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
          placeholder="Tìm theo GPS, tên, truck, mooc, booking, container..."
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
            minWidth: 280,
            flex: "1 1 280px",
          }}
        />
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
        <table style={{ width: "100%", minWidth: 1100, borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
              <th style={{ padding: "10px 14px", width: 32 }}>
                <SelectionCheckbox
                  checked={selection.isAllSelected}
                  onChange={selection.toggleAll}
                  ariaLabel="Chọn tất cả tiến độ vận tải"
                />
              </th>
              {TABLE_HEADERS.map((h) => (
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
                <td
                  colSpan={TABLE_HEADERS.length + 1}
                  style={{ padding: 32, textAlign: "center", color: "#94a3b8" }}
                >
                  Đang tải...
                </td>
              </tr>
            ) : moves.length === 0 ? (
              <tr>
                <td
                  colSpan={TABLE_HEADERS.length + 1}
                  style={{ padding: 32, textAlign: "center", color: "#94a3b8" }}
                >
                  Không có dữ liệu
                </td>
              </tr>
            ) : (
              moves.map((m, i) => {
                const stt = (page - 1) * PAGE_SIZE_YARD + i + 1;
                return (
                  <tr
                    key={m.id}
                    style={{
                      borderBottom: "1px solid #f1f5f9",
                      background: i % 2 === 0 ? "#fff" : "#fafafa",
                    }}
                  >
                    <td style={{ padding: "10px 14px" }}>
                      <SelectionCheckbox
                        checked={selection.isSelected(m.id)}
                        onChange={() => selection.toggle(m.id)}
                        ariaLabel={`Chọn tiến độ vận tải ${formatDate(m.date)}`}
                      />
                    </td>
                    <td style={{ padding: "10px 14px", fontSize: 12, color: "#64748b" }}>{stt}</td>
                    <td style={{ padding: "10px 14px", fontSize: 13, whiteSpace: "nowrap" }}>
                      {formatDate(m.date)}
                    </td>
                    <td style={{ padding: "10px 14px", fontSize: 13 }}>{m.gps || "—"}</td>
                    <td style={{ padding: "10px 14px", fontSize: 13 }}>{m.fullName || "—"}</td>
                    <td style={{ padding: "10px 14px", fontSize: 13, fontFamily: "monospace" }}>
                      {m.truck || "—"}
                    </td>
                    <td style={{ padding: "10px 14px", fontSize: 13, fontFamily: "monospace" }}>
                      {m.mooc || "—"}
                    </td>
                    <td style={{ padding: "10px 14px", fontSize: 13 }}>{m.booking || "—"}</td>
                    <td style={{ padding: "10px 14px", fontSize: 13, fontFamily: "monospace" }}>
                      {m.containerNumber || "—"}
                    </td>
                    <td style={{ padding: "10px 14px", fontSize: 13 }}>{m.daKeo || "—"}</td>
                    <td style={{ padding: "10px 14px", fontSize: 13 }}>{m.notes || "—"}</td>
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
              Bạn có chắc muốn xoá tiến độ vận tải này?
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

      {showBulkConfirm && (
        <ConfirmDialog
          title="Xác nhận xoá hàng loạt"
          message={`Bạn có chắc muốn xoá vĩnh viễn ${selection.selectedCount} tiến độ vận tải đã chọn? Hành động này không thể hoàn tác.`}
          danger
          onConfirm={handleBulkDelete}
          onCancel={() => setShowBulkConfirm(false)}
        />
      )}
    </div>
  );
}
