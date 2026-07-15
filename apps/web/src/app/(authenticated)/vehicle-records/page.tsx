"use client";

import { useEffect, useRef, useState } from "react";
import { useToast } from "@/lib/toast-context";
import { formatDate } from "@/lib/date-utils";
import { BulkActionBar, ConfirmDialog, SelectionCheckbox, useRowSelection } from "@tms/ui";
import type { BulkDeleteResult } from "@tms/shared";
import { ImportExportModal } from "@/components/import-export/import-export-modal";
import { UploadSection } from "@/components/import-export/upload-section";
import { DownloadButton } from "@/components/import-export/download-button";

interface MoocRow {
  id?: string;
  soMooc: string;
  hanDangKiem: string | null;
  hanBaoHiem: string | null;
  hanCaVet: string | null;
}

interface NoteRow {
  id?: string;
  content: string;
  createdAt?: string;
}

interface VehicleRecord {
  id: string;
  tenTaiXe: string | null;
  sdt: string | null;
  loaiXe: string | null;
  bienSo: string | null;
  hanDangKiem: string | null;
  hanBaoHiem: string | null;
  hanCaVet: string | null;
  notes: NoteRow[];
  moocs: MoocRow[];
}

const EMPTY_MOOC: Omit<MoocRow, "id"> = {
  soMooc: "",
  hanDangKiem: "",
  hanBaoHiem: "",
  hanCaVet: "",
};

const EMPTY_NOTE: NoteRow = { content: "" };

const EMPTY_FORM = {
  tenTaiXe: "",
  sdt: "",
  loaiXe: "",
  bienSo: "",
  hanDangKiem: "",
  hanBaoHiem: "",
  hanCaVet: "",
  notes: [] as NoteRow[],
  moocs: [] as Omit<MoocRow, "id">[],
};
type RecordForm = typeof EMPTY_FORM;

function joinNotes(notes: NoteRow[]): string {
  return notes.map((n) => n.content).join("\n");
}

function isExpiring(d: string | null, days = 30) {
  if (!d) return false;
  const diff = new Date(d).getTime() - Date.now();
  return diff > 0 && diff < days * 86400 * 1000;
}

function isExpired(d: string | null) {
  if (!d) return false;
  return new Date(d).getTime() < Date.now();
}

function DateCell({ date }: { date: string | null }) {
  const warn = isExpiring(date);
  const expired = isExpired(date);
  const color = expired ? "#dc2626" : warn ? "#d97706" : "#374151";
  const weight = expired || warn ? 600 : 400;
  return (
    <span style={{ color, fontWeight: weight, fontSize: 12 }}>
      {(expired || warn) && <span style={{ marginRight: 3 }}>⚠</span>}
      {formatDate(date)}
    </span>
  );
}

// Helper: does the vehicle itself match by non-mooc fields?
function vehicleMatchesByField(rec: VehicleRecord, search: string): boolean {
  if (!search) return true;
  const s = search.toLowerCase();
  return (
    (rec.tenTaiXe ?? "").toLowerCase().includes(s) ||
    (rec.sdt ?? "").toLowerCase().includes(s) ||
    (rec.loaiXe ?? "").toLowerCase().includes(s) ||
    (rec.bienSo ?? "").toLowerCase().includes(s)
  );
}

// ─── Filter button group ───────────────────────────────────────────────────

function FilterBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "5px 12px",
        fontSize: 12,
        border: "1px solid",
        borderColor: active ? "#3b82f6" : "#d1d5db",
        borderRadius: 4,
        background: active ? "#eff6ff" : "#fff",
        color: active ? "#1d4ed8" : "#374151",
        fontWeight: active ? 600 : 400,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

// ─── Pagination ────────────────────────────────────────────────────────────

function Pagination({
  page,
  totalPages,
  total,
  onPage,
}: {
  page: number;
  totalPages: number;
  total: number;
  onPage: (p: number) => void;
}) {
  const pages: (number | "...")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push("...");
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      pages.push(i);
    }
    if (page < totalPages - 2) pages.push("...");
    pages.push(totalPages);
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 14px",
        borderTop: "1px solid #e2e8f0",
        background: "#f8fafc",
        borderRadius: "0 0 10px 10px",
      }}
    >
      <span style={{ fontSize: 13, color: "#6b7280" }}>Tổng: {total} bản ghi</span>
      <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
        <button
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
          style={{
            padding: "4px 10px",
            fontSize: 13,
            border: "1px solid #d1d5db",
            borderRadius: 4,
            background: "#fff",
            cursor: page <= 1 ? "not-allowed" : "pointer",
            opacity: page <= 1 ? 0.4 : 1,
          }}
        >
          ←
        </button>
        {pages.map((p, i) =>
          p === "..." ? (
            <span key={`e${i}`} style={{ padding: "0 4px", color: "#9ca3af", fontSize: 13 }}>
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPage(p as number)}
              style={{
                padding: "4px 10px",
                fontSize: 13,
                border: "1px solid",
                borderColor: p === page ? "#3b82f6" : "#d1d5db",
                borderRadius: 4,
                background: p === page ? "#3b82f6" : "#fff",
                color: p === page ? "#fff" : "#374151",
                fontWeight: p === page ? 700 : 400,
                cursor: "pointer",
              }}
            >
              {p}
            </button>
          ),
        )}
        <button
          onClick={() => onPage(page + 1)}
          disabled={page >= totalPages}
          style={{
            padding: "4px 10px",
            fontSize: 13,
            border: "1px solid #d1d5db",
            borderRadius: 4,
            background: "#fff",
            cursor: page >= totalPages ? "not-allowed" : "pointer",
            opacity: page >= totalPages ? 0.4 : 1,
          }}
        >
          →
        </button>
      </div>
    </div>
  );
}

// ─── Modal ─────────────────────────────────────────────────────────────────

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
        background: "rgba(0,0,0,0.45)",
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
          width: "min(95vw, 820px)",
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
              fontSize: 22,
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
          <div
            style={{
              display: "flex",
              gap: 10,
              justifyContent: "flex-end",
              marginTop: 20,
              borderTop: "1px solid #e5e7eb",
              paddingTop: 16,
            }}
          >
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

// ─── Form components ───────────────────────────────────────────────────────

function TextField({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label
        style={{
          display: "block",
          fontSize: 12,
          fontWeight: 500,
          marginBottom: 3,
          color: "#6b7280",
        }}
      >
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%",
          padding: "7px 10px",
          border: "1px solid #d1d5db",
          borderRadius: 6,
          fontSize: 13,
          boxSizing: "border-box",
          background: "#fff",
          color: "#111827",
        }}
      />
    </div>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 12,
        fontWeight: 700,
        color: "#6366f1",
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        marginBottom: 10,
        marginTop: 18,
        borderBottom: "1px solid #e0e7ff",
        paddingBottom: 4,
      }}
    >
      {children}
    </div>
  );
}

function RecordFormFields({
  form,
  setForm,
}: {
  form: RecordForm;
  setForm: (f: RecordForm) => void;
}) {
  function updateField(key: keyof Omit<RecordForm, "moocs" | "notes">, val: string) {
    setForm({ ...form, [key]: val });
  }

  function updateMooc(idx: number, key: keyof Omit<MoocRow, "id">, val: string) {
    const moocs = [...form.moocs];
    moocs[idx] = { ...moocs[idx], [key]: val };
    setForm({ ...form, moocs });
  }

  function addMooc() {
    setForm({ ...form, moocs: [...form.moocs, { ...EMPTY_MOOC }] });
  }

  function removeMooc(idx: number) {
    setForm({ ...form, moocs: form.moocs.filter((_, i) => i !== idx) });
  }

  function updateNote(idx: number, val: string) {
    const notes = [...form.notes];
    notes[idx] = { ...notes[idx], content: val };
    setForm({ ...form, notes });
  }

  function addNote() {
    setForm({ ...form, notes: [...form.notes, { ...EMPTY_NOTE }] });
  }

  function removeNote(idx: number) {
    setForm({ ...form, notes: form.notes.filter((_, i) => i !== idx) });
  }

  return (
    <>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1.6fr",
          gap: 16,
          marginBottom: 4,
          alignItems: "start",
        }}
      >
        <div style={{ border: "1px solid #e2e8f0", borderRadius: 8, padding: "12px 14px" }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "#6366f1",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: 10,
              borderBottom: "1px solid #e0e7ff",
              paddingBottom: 4,
            }}
          >
            Tài xế
          </div>
          <TextField
            label="Tên tài xế"
            value={form.tenTaiXe}
            onChange={(v) => updateField("tenTaiXe", v)}
          />
          <TextField label="SĐT" value={form.sdt} onChange={(v) => updateField("sdt", v)} />
        </div>

        <div style={{ border: "1px solid #e2e8f0", borderRadius: 8, padding: "12px 14px" }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "#6366f1",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: 10,
              borderBottom: "1px solid #e0e7ff",
              paddingBottom: 4,
            }}
          >
            Thông tin xe
          </div>
          <TextField
            label="Loại xe"
            value={form.loaiXe}
            onChange={(v) => updateField("loaiXe", v)}
          />
          <TextField
            label="Biển số"
            value={form.bienSo}
            onChange={(v) => updateField("bienSo", v)}
          />
          <TextField
            label="Hạn đăng kiểm"
            value={form.hanDangKiem}
            onChange={(v) => updateField("hanDangKiem", v)}
            type="date"
          />
          <TextField
            label="Hạn bảo hiểm"
            value={form.hanBaoHiem}
            onChange={(v) => updateField("hanBaoHiem", v)}
            type="date"
          />
          <TextField
            label="Hạn cà vẹt"
            value={form.hanCaVet}
            onChange={(v) => updateField("hanCaVet", v)}
            type="date"
          />
        </div>
      </div>

      <SectionHeader>Mooc</SectionHeader>
      {form.moocs.map((mooc, idx) => (
        <div
          key={idx}
          style={{
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: 8,
            padding: "12px 14px",
            marginBottom: 10,
            position: "relative",
          }}
        >
          <button
            type="button"
            onClick={() => removeMooc(idx)}
            style={{
              position: "absolute",
              top: 8,
              right: 10,
              background: "none",
              border: "none",
              color: "#ef4444",
              fontSize: 18,
              cursor: "pointer",
              lineHeight: 1,
            }}
          >
            ×
          </button>
          <div style={{ fontWeight: 600, fontSize: 12, color: "#64748b", marginBottom: 8 }}>
            Mooc {idx + 1}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "0 12px" }}>
            <TextField
              label="Số mooc"
              value={mooc.soMooc}
              onChange={(v) => updateMooc(idx, "soMooc", v)}
            />
            <TextField
              label="Hạn đăng kiểm"
              value={mooc.hanDangKiem ?? ""}
              onChange={(v) => updateMooc(idx, "hanDangKiem", v)}
              type="date"
            />
            <TextField
              label="Hạn bảo hiểm"
              value={mooc.hanBaoHiem ?? ""}
              onChange={(v) => updateMooc(idx, "hanBaoHiem", v)}
              type="date"
            />
            <TextField
              label="Hạn cà vẹt"
              value={mooc.hanCaVet ?? ""}
              onChange={(v) => updateMooc(idx, "hanCaVet", v)}
              type="date"
            />
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={addMooc}
        style={{
          fontSize: 13,
          padding: "6px 14px",
          border: "1px dashed #6366f1",
          borderRadius: 6,
          background: "#f0f0ff",
          color: "#6366f1",
          cursor: "pointer",
          marginBottom: 4,
        }}
      >
        + Thêm mooc
      </button>

      <SectionHeader>Ghi chú</SectionHeader>
      {form.notes.map((note, idx) => (
        <div
          key={idx}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 8,
          }}
        >
          <input
            type="text"
            value={note.content}
            onChange={(e) => updateNote(idx, e.target.value)}
            style={{
              flex: 1,
              padding: "7px 10px",
              border: "1px solid #d1d5db",
              borderRadius: 6,
              fontSize: 13,
              boxSizing: "border-box",
            }}
          />
          <button
            type="button"
            onClick={() => removeNote(idx)}
            style={{
              background: "none",
              border: "none",
              color: "#ef4444",
              fontSize: 18,
              cursor: "pointer",
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addNote}
        style={{
          fontSize: 13,
          padding: "6px 14px",
          border: "1px dashed #6366f1",
          borderRadius: 6,
          background: "#f0f0ff",
          color: "#6366f1",
          cursor: "pointer",
          marginBottom: 4,
        }}
      >
        + Thêm ghi chú
      </button>
    </>
  );
}

function formToPayload(form: RecordForm, isEdit = false) {
  const nullOrUndef = (v: string) => (v ? v : isEdit ? null : undefined);
  return {
    tenTaiXe: nullOrUndef(form.tenTaiXe),
    sdt: nullOrUndef(form.sdt),
    loaiXe: nullOrUndef(form.loaiXe),
    bienSo: nullOrUndef(form.bienSo),
    hanDangKiem: nullOrUndef(form.hanDangKiem),
    hanBaoHiem: nullOrUndef(form.hanBaoHiem),
    hanCaVet: nullOrUndef(form.hanCaVet),
    notes: form.notes
      .filter((n) => n.content.trim())
      .map((n) => ({ content: n.content.trim() })),
    moocs: form.moocs
      .filter((m) => m.soMooc.trim())
      .map((m) => ({
        soMooc: m.soMooc.trim(),
        hanDangKiem: m.hanDangKiem || undefined,
        hanBaoHiem: m.hanBaoHiem || undefined,
        hanCaVet: m.hanCaVet || undefined,
      })),
  };
}

function recordToForm(r: VehicleRecord): RecordForm {
  return {
    tenTaiXe: r.tenTaiXe ?? "",
    sdt: r.sdt ?? "",
    loaiXe: r.loaiXe ?? "",
    bienSo: r.bienSo ?? "",
    hanDangKiem: r.hanDangKiem ? r.hanDangKiem.slice(0, 10) : "",
    hanBaoHiem: r.hanBaoHiem ? r.hanBaoHiem.slice(0, 10) : "",
    hanCaVet: r.hanCaVet ? r.hanCaVet.slice(0, 10) : "",
    notes: r.notes.map((n) => ({ id: n.id, content: n.content, createdAt: n.createdAt })),
    moocs: r.moocs.map((m) => ({
      soMooc: m.soMooc,
      hanDangKiem: m.hanDangKiem ? m.hanDangKiem.slice(0, 10) : "",
      hanBaoHiem: m.hanBaoHiem ? m.hanBaoHiem.slice(0, 10) : "",
      hanCaVet: m.hanCaVet ? m.hanCaVet.slice(0, 10) : "",
    })),
  };
}

// ─── Table cells ───────────────────────────────────────────────────────────

const TH = ({ children, width }: { children?: React.ReactNode; width?: number }) => (
  <th
    style={{
      padding: "9px 10px",
      textAlign: "left",
      fontSize: 11,
      fontWeight: 700,
      color: "#64748b",
      textTransform: "uppercase",
      letterSpacing: "0.04em",
      whiteSpace: "nowrap",
      width,
    }}
  >
    {children}
  </th>
);

const TD = ({
  children,
  style,
  colSpan,
  rowSpan,
}: {
  children?: React.ReactNode;
  style?: React.CSSProperties;
  colSpan?: number;
  rowSpan?: number;
}) => (
  <td
    colSpan={colSpan}
    rowSpan={rowSpan}
    style={{ padding: "8px 10px", fontSize: 12, color: "#374151", verticalAlign: "top", ...style }}
  >
    {children}
  </td>
);

// ─── Main Page ─────────────────────────────────────────────────────────────

export default function VehicleRecordsPage() {
  const toast = useToast();

  // Filter state
  const [search, setSearch] = useState("");
  const [expiryScope, setExpiryScope] = useState<"all" | "xe" | "mooc">("all");
  const [expiryType, setExpiryType] = useState<"all" | "dangkiem" | "cavet">("all");
  const [expiryFrom, setExpiryFrom] = useState("");
  const [expiryTo, setExpiryTo] = useState("");

  // Pagination state
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const PAGE_SIZE = 10;

  // Data state
  const [records, setRecords] = useState<VehicleRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);

  // Modal state
  const [showCreate, setShowCreate] = useState(false);
  const [showImportExport, setShowImportExport] = useState(false);
  const [createForm, setCreateForm] = useState<RecordForm>(EMPTY_FORM);
  const [createError, setCreateError] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<VehicleRecord | null>(null);
  const [editForm, setEditForm] = useState<RecordForm>(EMPTY_FORM);
  const [editError, setEditError] = useState<string | null>(null);
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);

  const selection = useRowSelection(records.map((r) => r.id));

  // Debounce search: delay fetch by 300ms after user stops typing
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleSearchChange(val: string) {
    setSearch(val);
    setPage(1);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setRefresh((r) => r + 1), 300);
  }

  // Reset page on filter change (non-search)
  function updateExpiryScope(v: "all" | "xe" | "mooc") {
    setExpiryScope(v);
    setPage(1);
  }
  function updateExpiryType(v: "all" | "dangkiem" | "cavet") {
    setExpiryType(v);
    setPage(1);
  }
  function updateExpiryFrom(v: string) {
    setExpiryFrom(v);
    setPage(1);
  }
  function updateExpiryTo(v: string) {
    setExpiryTo(v);
    setPage(1);
  }

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", String(PAGE_SIZE));
    if (search.trim()) params.set("search", search.trim());
    if (expiryScope !== "all") params.set("expiryScope", expiryScope);
    if (expiryType !== "all") params.set("expiryType", expiryType);
    if (expiryFrom) params.set("expiryFrom", expiryFrom);
    if (expiryTo) params.set("expiryTo", expiryTo);

    fetch(`/api/vehicle-records?${params.toString()}`)
      .then((r) => r.json())
      .then((res) => {
        if (!cancelled) {
          setRecords(res.data ?? []);
          setTotal(res.meta?.total ?? 0);
          setTotalPages(res.meta?.totalPages ?? 1);
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
  }, [page, refresh, expiryScope, expiryType, expiryFrom, expiryTo]);

  useEffect(() => {
    selection.clear();
  }, [page, refresh, expiryScope, expiryType, expiryFrom, expiryTo, selection.clear]);

  function openCreate() {
    setCreateForm(EMPTY_FORM);
    setCreateError(null);
    setShowCreate(true);
  }

  function openEdit(r: VehicleRecord) {
    setEditForm(recordToForm(r));
    setEditError(null);
    setEditTarget(r);
  }

  async function handleCreate() {
    setCreateError(null);
    const res = await fetch("/api/vehicle-records", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formToPayload(createForm)),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const msg = body.message ?? "Lỗi tạo biên bản";
      setCreateError(msg);
      toast.error(msg);
      return;
    }
    setShowCreate(false);
    setRefresh((r) => r + 1);
    toast.success("Thêm biên bản thành công");
  }

  async function handleEdit() {
    if (!editTarget) return;
    setEditError(null);
    const res = await fetch(`/api/vehicle-records/${editTarget.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formToPayload(editForm, true)),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const msg = body.message ?? "Lỗi cập nhật biên bản";
      setEditError(msg);
      toast.error(msg);
      return;
    }
    setEditTarget(null);
    setRefresh((r) => r + 1);
    toast.success("Cập nhật biên bản thành công");
  }

  async function handleDelete(r: VehicleRecord) {
    const label = r.bienSo ?? r.tenTaiXe ?? "biên bản này";
    if (!confirm(`Xóa "${label}"? Thao tác không thể hoàn tác.`)) return;
    const res = await fetch(`/api/vehicle-records/${r.id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Đã xóa biên bản");
    } else {
      toast.error("Lỗi xóa biên bản");
    }
    setRefresh((n) => n + 1);
  }

  async function handleBulkDelete() {
    const ids = Array.from(selection.selected);
    const res = await fetch("/api/vehicle-records/bulk-delete", {
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
    setRefresh((n) => n + 1);
    if (result.skipped.length === 0) {
      toast.success(`Đã xoá ${result.deleted.length} biên bản`);
    } else {
      const reasons = Array.from(new Set(result.skipped.map((s) => s.reason))).join("; ");
      toast.error(
        `Đã xoá ${result.deleted.length}, bỏ qua ${result.skipped.length}: ${reasons}`,
      );
    }
  }

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>Quản lý xe</h1>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => setShowImportExport(true)}
            style={{
              padding: "8px 16px",
              background: "#fff",
              color: "#374151",
              border: "1px solid #d1d5db",
              borderRadius: 6,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Nhập / Xuất Excel
          </button>
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
            + Thêm record
          </button>
        </div>
      </div>

      {/* Search + Filter bar */}
      <div
        style={{
          background: "#fff",
          borderRadius: 10,
          boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
          padding: "14px 16px",
          marginBottom: 14,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {/* Search input */}
        <input
          type="text"
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Tìm tên tài xế, SĐT, loại xe, biển số, số mooc..."
          style={{
            width: "100%",
            padding: "8px 12px",
            border: "1px solid #d1d5db",
            borderRadius: 6,
            fontSize: 13,
            boxSizing: "border-box",
            color: "#111827",
          }}
        />

        {/* Expiry filters */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 500, whiteSpace: "nowrap" }}>
            Lọc theo hạn:
          </span>

          {/* Scope */}
          <div style={{ display: "flex", gap: 4 }}>
            {(["all", "xe", "mooc"] as const).map((v) => (
              <FilterBtn key={v} active={expiryScope === v} onClick={() => updateExpiryScope(v)}>
                {v === "all" ? "Tất cả" : v === "xe" ? "Xe" : "Mooc"}
              </FilterBtn>
            ))}
          </div>

          {/* Type */}
          <div style={{ display: "flex", gap: 4 }}>
            {(["all", "dangkiem", "cavet"] as const).map((v) => (
              <FilterBtn key={v} active={expiryType === v} onClick={() => updateExpiryType(v)}>
                {v === "all" ? "Tất cả" : v === "dangkiem" ? "Đăng kiểm" : "Cà vẹt"}
              </FilterBtn>
            ))}
          </div>

          {/* Date range */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 12, color: "#6b7280" }}>Từ</span>
            <input
              type="date"
              value={expiryFrom}
              onChange={(e) => updateExpiryFrom(e.target.value)}
              style={{
                padding: "5px 8px",
                border: "1px solid #d1d5db",
                borderRadius: 4,
                fontSize: 12,
              }}
            />
            <span style={{ fontSize: 12, color: "#6b7280" }}>Đến</span>
            <input
              type="date"
              value={expiryTo}
              onChange={(e) => updateExpiryTo(e.target.value)}
              style={{
                padding: "5px 8px",
                border: "1px solid #d1d5db",
                borderRadius: 4,
                fontSize: 12,
              }}
            />
          </div>
        </div>
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

      <BulkActionBar
        selectedCount={selection.selectedCount}
        onDelete={() => setShowBulkConfirm(true)}
        onClear={selection.clear}
      />

      {/* Table */}
      <div
        style={{
          background: "#fff",
          borderRadius: 10,
          boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
          overflow: "auto",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1100 }}>
          <thead>
            <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
              <TH width={32}>
                <SelectionCheckbox
                  checked={selection.isAllSelected}
                  onChange={selection.toggleAll}
                  ariaLabel="Chọn tất cả biên bản"
                />
              </TH>
              <TH width={36}>STT</TH>
              <TH>Tên TX</TH>
              <TH>SĐT</TH>
              <TH>Loại xe</TH>
              <TH>Biển số</TH>
              <TH>Hạn ĐK (xe)</TH>
              <TH>Hạn BH (xe)</TH>
              <TH>Hạn CV (xe)</TH>
              <TH>Số Mooc</TH>
              <TH>Hạn ĐK (mooc)</TH>
              <TH>Hạn BH (mooc)</TH>
              <TH>Hạn CV (mooc)</TH>
              <TH>Ghi chú</TH>
              <TH></TH>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={15} style={{ padding: 32, textAlign: "center", color: "#94a3b8" }}>
                  Đang tải...
                </td>
              </tr>
            ) : records.length === 0 ? (
              <tr>
                <td colSpan={15} style={{ padding: 32, textAlign: "center", color: "#94a3b8" }}>
                  Chưa có dữ liệu
                </td>
              </tr>
            ) : (
              records.map((rec, recIdx) => {
                // Determine which moocs to display (Option B logic)
                const displayMoocs = vehicleMatchesByField(rec, search)
                  ? rec.moocs
                  : rec.moocs.filter((m) => m.soMooc.toLowerCase().includes(search.toLowerCase()));

                const moocCount = displayMoocs.length;
                const rows = moocCount === 0 ? 1 : moocCount;
                const rowSpan = rows;
                const bg = recIdx % 2 === 0 ? "#fff" : "#fafafa";
                const borderTop = recIdx > 0 ? "2px solid #e2e8f0" : undefined;
                // Offset for display: based on overall record position
                const recNum = (page - 1) * PAGE_SIZE + recIdx + 1;

                if (moocCount === 0) {
                  return (
                    <tr key={rec.id} style={{ background: bg, borderTop }}>
                      <TD>
                        <SelectionCheckbox
                          checked={selection.isSelected(rec.id)}
                          onChange={() => selection.toggle(rec.id)}
                          ariaLabel={`Chọn biên bản ${rec.bienSo ?? rec.tenTaiXe ?? recNum}`}
                        />
                      </TD>
                      <TD style={{ color: "#94a3b8" }}>{recNum}</TD>
                      <TD style={{ fontWeight: 500 }}>
                        {rec.tenTaiXe ?? <span style={{ color: "#94a3b8" }}>—</span>}
                      </TD>
                      <TD style={{ fontFamily: "monospace" }}>
                        {rec.sdt ?? <span style={{ color: "#94a3b8" }}>—</span>}
                      </TD>
                      <TD>{rec.loaiXe ?? <span style={{ color: "#94a3b8" }}>—</span>}</TD>
                      <TD style={{ fontFamily: "monospace", fontWeight: 600 }}>
                        {rec.bienSo ?? <span style={{ color: "#94a3b8" }}>—</span>}
                      </TD>
                      <TD>
                        <DateCell date={rec.hanDangKiem} />
                      </TD>
                      <TD>
                        <DateCell date={rec.hanBaoHiem} />
                      </TD>
                      <TD>
                        <DateCell date={rec.hanCaVet} />
                      </TD>
                      <TD colSpan={4} style={{ color: "#94a3b8" }}>
                        —
                      </TD>
                      <TD
                        style={{
                          maxWidth: 180,
                          color: "#6b7280",
                          fontStyle: rec.notes.length ? "normal" : "italic",
                          whiteSpace: "pre-line",
                        }}
                      >
                        {rec.notes.length ? joinNotes(rec.notes) : "—"}
                      </TD>
                      <TD>
                        <button
                          onClick={() => openEdit(rec)}
                          style={{
                            fontSize: 12,
                            padding: "3px 10px",
                            border: "1px solid #d1d5db",
                            borderRadius: 4,
                            background: "#fff",
                            cursor: "pointer",
                            marginRight: 4,
                          }}
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => handleDelete(rec)}
                          style={{
                            fontSize: 12,
                            padding: "3px 10px",
                            border: "1px solid #fca5a5",
                            borderRadius: 4,
                            background: "#fff",
                            color: "#dc2626",
                            cursor: "pointer",
                          }}
                        >
                          Xóa
                        </button>
                      </TD>
                    </tr>
                  );
                }

                return displayMoocs.map((mooc, mIdx) => (
                  <tr
                    key={`${rec.id}-${mIdx}`}
                    style={{ background: bg, borderTop: mIdx === 0 ? borderTop : undefined }}
                  >
                    {mIdx === 0 && (
                      <>
                        <TD rowSpan={rowSpan > 1 ? rowSpan : undefined}>
                          <SelectionCheckbox
                            checked={selection.isSelected(rec.id)}
                            onChange={() => selection.toggle(rec.id)}
                            ariaLabel={`Chọn biên bản ${rec.bienSo ?? rec.tenTaiXe ?? recNum}`}
                          />
                        </TD>
                        <TD
                          style={{ color: "#94a3b8" }}
                          rowSpan={rowSpan > 1 ? rowSpan : undefined}
                        >
                          {recNum}
                        </TD>
                        <TD
                          style={{ fontWeight: 500, verticalAlign: "top" }}
                          rowSpan={rowSpan > 1 ? rowSpan : undefined}
                        >
                          {rec.tenTaiXe ?? <span style={{ color: "#94a3b8" }}>—</span>}
                        </TD>
                        <TD
                          style={{ fontFamily: "monospace", verticalAlign: "top" }}
                          rowSpan={rowSpan > 1 ? rowSpan : undefined}
                        >
                          {rec.sdt ?? <span style={{ color: "#94a3b8" }}>—</span>}
                        </TD>
                        <TD
                          style={{ verticalAlign: "top" }}
                          rowSpan={rowSpan > 1 ? rowSpan : undefined}
                        >
                          {rec.loaiXe ?? <span style={{ color: "#94a3b8" }}>—</span>}
                        </TD>
                        <TD
                          style={{
                            fontFamily: "monospace",
                            fontWeight: 600,
                            verticalAlign: "top",
                          }}
                          rowSpan={rowSpan > 1 ? rowSpan : undefined}
                        >
                          {rec.bienSo ?? <span style={{ color: "#94a3b8" }}>—</span>}
                        </TD>
                        <TD
                          style={{ verticalAlign: "top" }}
                          rowSpan={rowSpan > 1 ? rowSpan : undefined}
                        >
                          <DateCell date={rec.hanDangKiem} />
                        </TD>
                        <TD
                          style={{ verticalAlign: "top" }}
                          rowSpan={rowSpan > 1 ? rowSpan : undefined}
                        >
                          <DateCell date={rec.hanBaoHiem} />
                        </TD>
                        <TD
                          style={{ verticalAlign: "top" }}
                          rowSpan={rowSpan > 1 ? rowSpan : undefined}
                        >
                          <DateCell date={rec.hanCaVet} />
                        </TD>
                      </>
                    )}
                    <TD
                      style={{
                        fontFamily: "monospace",
                        fontWeight: 600,
                        borderTop: mIdx > 0 ? "1px dashed #e2e8f0" : undefined,
                      }}
                    >
                      {mooc.soMooc}
                    </TD>
                    <TD style={{ borderTop: mIdx > 0 ? "1px dashed #e2e8f0" : undefined }}>
                      <DateCell date={mooc.hanDangKiem} />
                    </TD>
                    <TD style={{ borderTop: mIdx > 0 ? "1px dashed #e2e8f0" : undefined }}>
                      <DateCell date={mooc.hanBaoHiem} />
                    </TD>
                    <TD style={{ borderTop: mIdx > 0 ? "1px dashed #e2e8f0" : undefined }}>
                      <DateCell date={mooc.hanCaVet} />
                    </TD>
                    {mIdx === 0 && (
                      <>
                        <TD
                          style={{
                            maxWidth: 180,
                            color: "#6b7280",
                            verticalAlign: "top",
                            whiteSpace: "pre-line",
                          }}
                          rowSpan={rowSpan > 1 ? rowSpan : undefined}
                        >
                          {rec.notes.length ? (
                            joinNotes(rec.notes)
                          ) : (
                            <span style={{ fontStyle: "italic" }}>—</span>
                          )}
                        </TD>
                        <TD
                          style={{ whiteSpace: "nowrap", verticalAlign: "top" }}
                          rowSpan={rowSpan > 1 ? rowSpan : undefined}
                        >
                          <button
                            onClick={() => openEdit(rec)}
                            style={{
                              fontSize: 12,
                              padding: "3px 10px",
                              border: "1px solid #d1d5db",
                              borderRadius: 4,
                              background: "#fff",
                              cursor: "pointer",
                              marginRight: 4,
                            }}
                          >
                            Sửa
                          </button>
                          <button
                            onClick={() => handleDelete(rec)}
                            style={{
                              fontSize: 12,
                              padding: "3px 10px",
                              border: "1px solid #fca5a5",
                              borderRadius: 4,
                              background: "#fff",
                              color: "#dc2626",
                              cursor: "pointer",
                            }}
                          >
                            Xóa
                          </button>
                        </TD>
                      </>
                    )}
                  </tr>
                ));
              })
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {!loading && (
          <Pagination
            page={page}
            totalPages={totalPages || 1}
            total={total}
            onPage={(p) => setPage(p)}
          />
        )}
      </div>

      {/* Modals */}
      {showImportExport && (
        <ImportExportModal title="Nhập / Xuất Excel — Quản lý xe" onClose={() => setShowImportExport(false)}>
          <UploadSection
            title="Nhập danh sách xe"
            endpoint="/api/import/vehicles?confirm=true"
            onImported={() => setRefresh((r) => r + 1)}
            description="Tải lên sheet 'quản lý xe' — mỗi lần nhập sẽ tạo thêm bản ghi mới vào danh sách quản lý xe."
          />
          <div style={{ background: "#fff", borderRadius: 10, padding: 24, border: "1px solid #e5e7eb" }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Xuất danh sách quản lý xe</h2>
            <p style={{ fontSize: 13, color: "#64748b", marginBottom: 16 }}>
              Xuất danh sách xe, tài xế và rơ moóc kèm hạn đăng kiểm / bảo hiểm.
            </p>
            <DownloadButton
              label="Tải xuống quan-ly-xe.xlsx"
              endpoint="/api/export/vehicles"
              filename="quan-ly-xe.xlsx"
            />
          </div>
        </ImportExportModal>
      )}

      {showCreate && (
        <Modal
          title="Thêm record quản lý xe"
          onClose={() => setShowCreate(false)}
          onSubmit={handleCreate}
          error={createError}
        >
          <RecordFormFields form={createForm} setForm={setCreateForm} />
        </Modal>
      )}

      {editTarget && (
        <Modal
          title={`Sửa — ${editTarget.bienSo ?? editTarget.tenTaiXe ?? "record"}`}
          onClose={() => setEditTarget(null)}
          onSubmit={handleEdit}
          error={editError}
        >
          <RecordFormFields form={editForm} setForm={setEditForm} />
        </Modal>
      )}

      {showBulkConfirm && (
        <ConfirmDialog
          title="Xác nhận xoá hàng loạt"
          message={`Bạn có chắc muốn xoá vĩnh viễn ${selection.selectedCount} biên bản đã chọn? Hành động này không thể hoàn tác.`}
          danger
          onConfirm={handleBulkDelete}
          onCancel={() => setShowBulkConfirm(false)}
        />
      )}
    </div>
  );
}
