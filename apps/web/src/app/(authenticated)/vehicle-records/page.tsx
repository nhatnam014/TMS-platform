"use client";

import { useEffect, useState } from "react";

interface MoocRow {
  id?: string;
  soMooc: string;
  hanDangKiem: string | null;
  hanBaoHiem: string | null;
  hanCaVet: string | null;
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
  ghiChu: string | null;
  moocs: MoocRow[];
}

const EMPTY_MOOC: Omit<MoocRow, "id"> = {
  soMooc: "",
  hanDangKiem: "",
  hanBaoHiem: "",
  hanCaVet: "",
};

const EMPTY_FORM = {
  tenTaiXe: "",
  sdt: "",
  loaiXe: "",
  bienSo: "",
  hanDangKiem: "",
  hanBaoHiem: "",
  hanCaVet: "",
  ghiChu: "",
  moocs: [] as Omit<MoocRow, "id">[],
};
type RecordForm = typeof EMPTY_FORM;

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("vi-VN");
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

function DateCell({ date, style }: { date: string | null; style?: React.CSSProperties }) {
  const warn = isExpiring(date);
  const expired = isExpired(date);
  const color = expired ? "#dc2626" : warn ? "#d97706" : "#374151";
  const weight = expired || warn ? 600 : 400;
  return (
    <span style={{ color, fontWeight: weight, fontSize: 12, ...style }}>
      {(expired || warn) && <span style={{ marginRight: 3 }}>⚠</span>}
      {formatDate(date)}
    </span>
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
        <form onSubmit={handleSubmit}>
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
  function updateField(key: keyof Omit<RecordForm, "moocs">, val: string) {
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

  return (
    <>
      {/* Top: 2-column section — Tài xế (left) · Thông tin xe (right) */}
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
      <div style={{ marginBottom: 12 }}>
        <textarea
          value={form.ghiChu}
          onChange={(e) => updateField("ghiChu", e.target.value)}
          rows={2}
          style={{
            width: "100%",
            padding: "7px 10px",
            border: "1px solid #d1d5db",
            borderRadius: 6,
            fontSize: 13,
            boxSizing: "border-box",
            resize: "vertical",
          }}
        />
      </div>
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
    ghiChu: nullOrUndef(form.ghiChu),
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
    ghiChu: r.ghiChu ?? "",
    moocs: r.moocs.map((m) => ({
      soMooc: m.soMooc,
      hanDangKiem: m.hanDangKiem ? m.hanDangKiem.slice(0, 10) : "",
      hanBaoHiem: m.hanBaoHiem ? m.hanBaoHiem.slice(0, 10) : "",
      hanCaVet: m.hanCaVet ? m.hanCaVet.slice(0, 10) : "",
    })),
  };
}

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

export default function VehicleRecordsPage() {
  const [records, setRecords] = useState<VehicleRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState<RecordForm>(EMPTY_FORM);
  const [createError, setCreateError] = useState<string | null>(null);

  const [editTarget, setEditTarget] = useState<VehicleRecord | null>(null);
  const [editForm, setEditForm] = useState<RecordForm>(EMPTY_FORM);
  const [editError, setEditError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch("/api/vehicle-records")
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) {
          setRecords(data);
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
      setCreateError(body.message ?? "Lỗi tạo record");
      return;
    }
    setShowCreate(false);
    setRefresh((r) => r + 1);
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
      setEditError(body.message ?? "Lỗi cập nhật record");
      return;
    }
    setEditTarget(null);
    setRefresh((r) => r + 1);
  }

  async function handleDelete(r: VehicleRecord) {
    const label = r.bienSo ?? r.tenTaiXe ?? "record này";
    if (!confirm(`Xóa "${label}"? Thao tác không thể hoàn tác.`)) return;
    await fetch(`/api/vehicle-records/${r.id}`, { method: "DELETE" });
    setRefresh((n) => n + 1);
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
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>Quản lý xe</h1>
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
          overflow: "auto",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1100 }}>
          <thead>
            <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
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
                <td colSpan={14} style={{ padding: 32, textAlign: "center", color: "#94a3b8" }}>
                  Đang tải...
                </td>
              </tr>
            ) : records.length === 0 ? (
              <tr>
                <td colSpan={14} style={{ padding: 32, textAlign: "center", color: "#94a3b8" }}>
                  Chưa có dữ liệu
                </td>
              </tr>
            ) : (
              records.map((rec, recIdx) => {
                const moocCount = rec.moocs.length;
                const rows = moocCount === 0 ? 1 : moocCount;
                const rowSpan = rows;
                const bg = recIdx % 2 === 0 ? "#fff" : "#fafafa";
                const borderTop = recIdx > 0 ? "2px solid #e2e8f0" : undefined;

                if (moocCount === 0) {
                  return (
                    <tr key={rec.id} style={{ background: bg, borderTop }}>
                      <TD style={{ color: "#94a3b8" }}>{recIdx + 1}</TD>
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
                          fontStyle: rec.ghiChu ? "normal" : "italic",
                        }}
                      >
                        {rec.ghiChu ?? "—"}
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

                return rec.moocs.map((mooc, mIdx) => (
                  <tr
                    key={`${rec.id}-${mIdx}`}
                    style={{ background: bg, borderTop: mIdx === 0 ? borderTop : undefined }}
                  >
                    {mIdx === 0 && (
                      <>
                        <TD
                          style={{ color: "#94a3b8" }}
                          rowSpan={rowSpan > 1 ? rowSpan : undefined}
                        >
                          {recIdx + 1}
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
                          style={{ fontFamily: "monospace", fontWeight: 600, verticalAlign: "top" }}
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
                          style={{ maxWidth: 180, color: "#6b7280", verticalAlign: "top" }}
                          rowSpan={rowSpan > 1 ? rowSpan : undefined}
                        >
                          {rec.ghiChu ?? <span style={{ fontStyle: "italic" }}>—</span>}
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
      </div>

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
    </div>
  );
}
