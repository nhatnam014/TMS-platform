"use client";

import { useEffect, useRef, useState } from "react";
import { useToast } from "@/lib/toast-context";
import { formatDate } from "@/lib/date-utils";

interface MaintenanceRecord {
  id: string;
  bienSo: string | null;
  tenTaiXe: string | null;
  sdt: string | null;
  loaiXe: string | null;
  donViSuaChua: string | null;
  ngayLam: string | null;
  soKmBaoDuong: string | null;
  kiBaoDuongTiepTheo: string | null;
  soKmHienTai: string | null;
  ghiChu: string | null;
}

const EMPTY_FORM = {
  bienSo: "",
  tenTaiXe: "",
  sdt: "",
  loaiXe: "",
  donViSuaChua: "",
  ngayLam: "",
  soKmBaoDuong: "",
  kiBaoDuongTiepTheo: "",
  soKmHienTai: "",
  ghiChu: "",
};
type MaintenanceForm = typeof EMPTY_FORM;

const SECTION_BG = {
  vehicle: "#dbeafe",    // blue-100
  service: "#dcfce7",   // green-100
  km:      "#fef9c3",   // yellow-100
  note:    "#f1f5f9",   // slate-100
};

// ─── Computed helpers ──────────────────────────────────────────────────────

function toNum(v: string | null | undefined): number | null {
  if (!v) return null;
  const n = parseFloat(String(v).replace(/,/g, ""));
  return isNaN(n) ? null : n;
}

function kmDaChay(rec: MaintenanceRecord): number | null {
  const bd = toNum(rec.soKmBaoDuong);
  const ht = toNum(rec.soKmHienTai);
  return bd !== null && ht !== null ? ht - bd : null;
}

function kmCon(rec: MaintenanceRecord): number | null {
  const tiep = toNum(rec.kiBaoDuongTiepTheo);
  const ht = toNum(rec.soKmHienTai);
  return tiep !== null && ht !== null ? tiep - ht : null;
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
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
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
          style={{ padding: "4px 10px", fontSize: 13, border: "1px solid #d1d5db", borderRadius: 4, background: "#fff", cursor: page <= 1 ? "not-allowed" : "pointer", opacity: page <= 1 ? 0.4 : 1 }}
        >←</button>
        {pages.map((p, i) =>
          p === "..." ? (
            <span key={`e${i}`} style={{ padding: "0 4px", color: "#9ca3af", fontSize: 13 }}>…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPage(p as number)}
              style={{ padding: "4px 10px", fontSize: 13, border: "1px solid", borderColor: p === page ? "#3b82f6" : "#d1d5db", borderRadius: 4, background: p === page ? "#3b82f6" : "#fff", color: p === page ? "#fff" : "#374151", fontWeight: p === page ? 700 : 400, cursor: "pointer" }}
            >{p}</button>
          ),
        )}
        <button
          onClick={() => onPage(page + 1)}
          disabled={page >= totalPages}
          style={{ padding: "4px 10px", fontSize: 13, border: "1px solid #d1d5db", borderRadius: 4, background: "#fff", cursor: page >= totalPages ? "not-allowed" : "pointer", opacity: page >= totalPages ? 0.4 : 1 }}
        >→</button>
      </div>
    </div>
  );
}

// ─── ActionMenu ────────────────────────────────────────────────────────────

function ActionMenu({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          padding: "5px 22px",
          background: open ? "#c7d2fe" : "#e0e7ff",
          border: `1px solid ${open ? "#818cf8" : "#a5b4fc"}`,
          borderRadius: 6,
          fontSize: 18,
          fontWeight: 700,
          color: open ? "#3730a3" : "#4f46e5",
          cursor: "pointer",
          lineHeight: 1,
        }}
      >
        ···
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: "110%",
            background: "#fff",
            borderRadius: 10,
            padding: 6,
            gap: 4,
            boxShadow: "0 8px 28px rgba(0,0,0,0.18)",
            minWidth: 140,
            display: "flex",
            flexDirection: "column",
            zIndex: 100,
          }}
        >
          <button
            onClick={() => { setOpen(false); onEdit(); }}
            style={{ background: "#eff6ff", border: "1px solid #bfdbfe", color: "#2563eb", fontWeight: 600, fontSize: 13, padding: "9px 14px", borderRadius: 6, cursor: "pointer", textAlign: "left" }}
          >
            Sửa
          </button>
          <button
            onClick={() => { setOpen(false); onDelete(); }}
            style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", fontWeight: 600, fontSize: 13, padding: "9px 14px", borderRadius: 6, cursor: "pointer", textAlign: "left" }}
          >
            Xóa
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Modal ─────────────────────────────────────────────────────────────────

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
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
      <div style={{ background: "#fff", borderRadius: 10, padding: 28, width: "min(95vw, 700px)", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>{title}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#6b7280" }}>×</button>
        </div>
        {error && (
          <p style={{ color: "#dc2626", background: "#fef2f2", padding: "8px 12px", borderRadius: 6, fontSize: 13, marginBottom: 14 }}>{error}</p>
        )}
        <form onSubmit={handleSubmit}>
          {children}
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20, borderTop: "1px solid #e5e7eb", paddingTop: 16 }}>
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

// ─── Form fields ───────────────────────────────────────────────────────────

function TextField({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 500, marginBottom: 3, color: "#6b7280" }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ width: "100%", padding: "7px 10px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 13, boxSizing: "border-box", background: "#fff", color: "#111827" }}
      />
    </div>
  );
}

function SectionBox({ title, bg, children }: { title: string; bg: string; children: React.ReactNode }) {
  return (
    <div style={{ background: bg, border: "1px solid #e2e8f0", borderRadius: 8, padding: "12px 14px", marginBottom: 12 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#6366f1", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10, borderBottom: "1px solid #e0e7ff", paddingBottom: 4 }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function MaintenanceFormFields({ form, setForm }: { form: MaintenanceForm; setForm: (f: MaintenanceForm) => void }) {
  function set(key: keyof MaintenanceForm, val: string) {
    setForm({ ...form, [key]: val });
  }
  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <SectionBox title="Thông tin xe" bg={SECTION_BG.vehicle}>
          <TextField label="Biển số" value={form.bienSo} onChange={(v) => set("bienSo", v)} />
          <TextField label="Tên tài xế" value={form.tenTaiXe} onChange={(v) => set("tenTaiXe", v)} />
          <TextField label="SĐT" value={form.sdt} onChange={(v) => set("sdt", v)} />
        </SectionBox>
        <SectionBox title="Đơn vị sửa chữa" bg={SECTION_BG.service}>
          <TextField label="Loại xe (ĐV SC / Loại xe)" value={form.loaiXe} onChange={(v) => set("loaiXe", v)} />
          <TextField label="Đơn vị sửa chữa" value={form.donViSuaChua} onChange={(v) => set("donViSuaChua", v)} />
          <TextField label="Ngày làm" value={form.ngayLam} onChange={(v) => set("ngayLam", v)} type="date" />
        </SectionBox>
      </div>
      <SectionBox title="Thông số KM" bg={SECTION_BG.km}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0 12px" }}>
          <TextField label="SỐ KM bảo dưỡng" value={form.soKmBaoDuong} onChange={(v) => set("soKmBaoDuong", v)} type="number" />
          <TextField label="Kì bảo dưỡng tiếp theo" value={form.kiBaoDuongTiepTheo} onChange={(v) => set("kiBaoDuongTiepTheo", v)} type="number" />
          <TextField label="SỐ KM hiện tại" value={form.soKmHienTai} onChange={(v) => set("soKmHienTai", v)} type="number" />
        </div>
      </SectionBox>
      <SectionBox title="Ghi chú" bg={SECTION_BG.note}>
        <textarea
          value={form.ghiChu}
          onChange={(e) => set("ghiChu", e.target.value)}
          rows={2}
          style={{ width: "100%", padding: "7px 10px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 13, boxSizing: "border-box", resize: "vertical" }}
        />
      </SectionBox>
    </>
  );
}

function recordToForm(r: MaintenanceRecord): MaintenanceForm {
  return {
    bienSo: r.bienSo ?? "",
    tenTaiXe: r.tenTaiXe ?? "",
    sdt: r.sdt ?? "",
    loaiXe: r.loaiXe ?? "",
    donViSuaChua: r.donViSuaChua ?? "",
    ngayLam: r.ngayLam ? r.ngayLam.slice(0, 10) : "",
    soKmBaoDuong: r.soKmBaoDuong ?? "",
    kiBaoDuongTiepTheo: r.kiBaoDuongTiepTheo ?? "",
    soKmHienTai: r.soKmHienTai ?? "",
    ghiChu: r.ghiChu ?? "",
  };
}

function formToPayload(form: MaintenanceForm, isEdit = false) {
  const n = (v: string) => (v ? v : isEdit ? null : undefined);
  return {
    bienSo: n(form.bienSo),
    tenTaiXe: n(form.tenTaiXe),
    sdt: n(form.sdt),
    loaiXe: n(form.loaiXe),
    donViSuaChua: n(form.donViSuaChua),
    ngayLam: n(form.ngayLam),
    soKmBaoDuong: n(form.soKmBaoDuong),
    kiBaoDuongTiepTheo: n(form.kiBaoDuongTiepTheo),
    soKmHienTai: n(form.soKmHienTai),
    ghiChu: n(form.ghiChu),
  };
}

// ─── Table helpers ─────────────────────────────────────────────────────────

const TH = ({ children, width }: { children?: React.ReactNode; width?: number }) => (
  <th style={{ padding: "9px 10px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em", whiteSpace: "nowrap", width }}>
    {children}
  </th>
);

const TD = ({ children, style }: { children?: React.ReactNode; style?: React.CSSProperties }) => (
  <td style={{ padding: "8px 10px", fontSize: 12, color: "#374151", verticalAlign: "middle", ...style }}>
    {children}
  </td>
);

// ─── Main Page ─────────────────────────────────────────────────────────────

export default function VehicleMaintenancePage() {
  const toast = useToast();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const PAGE_SIZE = 15;

  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState<MaintenanceForm>(EMPTY_FORM);
  const [createError, setCreateError] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<MaintenanceRecord | null>(null);
  const [editForm, setEditForm] = useState<MaintenanceForm>(EMPTY_FORM);
  const [editError, setEditError] = useState<string | null>(null);

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleSearchChange(val: string) {
    setSearch(val);
    setPage(1);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setRefresh((r) => r + 1), 300);
  }

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", String(PAGE_SIZE));
    if (search.trim()) params.set("search", search.trim());

    fetch(`/api/vehicle-maintenance?${params.toString()}`)
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

    return () => { cancelled = true; };
  }, [page, refresh]);

  function openCreate() {
    setCreateForm(EMPTY_FORM);
    setCreateError(null);
    setShowCreate(true);
  }

  function openEdit(r: MaintenanceRecord) {
    setEditForm(recordToForm(r));
    setEditError(null);
    setEditTarget(r);
  }

  async function handleCreate() {
    setCreateError(null);
    const res = await fetch("/api/vehicle-maintenance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formToPayload(createForm)),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const msg = body.message ?? "Lỗi tạo bản ghi";
      setCreateError(msg);
      toast.error(msg);
      return;
    }
    setShowCreate(false);
    setRefresh((r) => r + 1);
    toast.success("Thêm bảo dưỡng xe thành công");
  }

  async function handleEdit() {
    if (!editTarget) return;
    setEditError(null);
    const res = await fetch(`/api/vehicle-maintenance/${editTarget.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formToPayload(editForm, true)),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const msg = body.message ?? "Lỗi cập nhật bản ghi";
      setEditError(msg);
      toast.error(msg);
      return;
    }
    setEditTarget(null);
    setRefresh((r) => r + 1);
    toast.success("Cập nhật bảo dưỡng xe thành công");
  }

  async function handleDelete(r: MaintenanceRecord) {
    const label = r.bienSo ?? r.tenTaiXe ?? "bản ghi này";
    if (!confirm(`Xóa bảo dưỡng xe "${label}"? Thao tác không thể hoàn tác.`)) return;
    const res = await fetch(`/api/vehicle-maintenance/${r.id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Đã xóa bản ghi");
    } else {
      toast.error("Lỗi xóa bản ghi");
    }
    setRefresh((n) => n + 1);
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>Bảo dưỡng xe</h1>
        <button
          onClick={openCreate}
          style={{ padding: "8px 16px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: 6, fontSize: 14, cursor: "pointer" }}
        >
          + Thêm bảo dưỡng
        </button>
      </div>

      <div style={{ background: "#fff", borderRadius: 10, boxShadow: "0 1px 4px rgba(0,0,0,0.07)", padding: "14px 16px", marginBottom: 14 }}>
        <input
          type="text"
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Tìm biển số, tài xế, loại xe, đơn vị SC..."
          style={{ width: "100%", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 13, boxSizing: "border-box", color: "#111827" }}
        />
      </div>

      {fetchError && (
        <p style={{ color: "#dc2626", background: "#fef2f2", padding: "10px 14px", borderRadius: 6, marginBottom: 16, fontSize: 13 }}>{fetchError}</p>
      )}

      <div style={{ background: "#fff", borderRadius: 10, boxShadow: "0 1px 4px rgba(0,0,0,0.07)", overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1200 }}>
          <thead>
            <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
              <TH width={36}>STT</TH>
              <TH>Số xe</TH>
              <TH>Tài xế</TH>
              <TH>SĐT</TH>
              <TH>Loại xe</TH>
              <TH>Đơn vị SC</TH>
              <TH>Ngày làm</TH>
              <TH>Km BD</TH>
              <TH>Kì tiếp</TH>
              <TH>Km HT</TH>
              <TH>Km đã chạy</TH>
              <TH>Km còn</TH>
              <TH>Ghi chú</TH>
              <TH></TH>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={14} style={{ padding: 32, textAlign: "center", color: "#94a3b8" }}>Đang tải...</td></tr>
            ) : records.length === 0 ? (
              <tr><td colSpan={14} style={{ padding: 32, textAlign: "center", color: "#94a3b8" }}>Chưa có dữ liệu</td></tr>
            ) : (
              records.map((rec, idx) => {
                const da = kmDaChay(rec);
                const con = kmCon(rec);
                const conColor = con !== null && con <= 0 ? "#dc2626" : "#374151";
                const conWeight = con !== null && con <= 0 ? 700 : 400;
                const recNum = (page - 1) * PAGE_SIZE + idx + 1;
                const bg = idx % 2 === 0 ? "#fff" : "#fafafa";
                return (
                  <tr key={rec.id} style={{ background: bg }}>
                    <TD style={{ color: "#94a3b8" }}>{recNum}</TD>
                    <TD style={{ fontFamily: "monospace", fontWeight: 600 }}>{rec.bienSo ?? <span style={{ color: "#94a3b8" }}>—</span>}</TD>
                    <TD>{rec.tenTaiXe ?? <span style={{ color: "#94a3b8" }}>—</span>}</TD>
                    <TD style={{ fontFamily: "monospace" }}>{rec.sdt ?? <span style={{ color: "#94a3b8" }}>—</span>}</TD>
                    <TD>{rec.loaiXe ?? <span style={{ color: "#94a3b8" }}>—</span>}</TD>
                    <TD>{rec.donViSuaChua ?? <span style={{ color: "#94a3b8" }}>—</span>}</TD>
                    <TD>{formatDate(rec.ngayLam) || <span style={{ color: "#94a3b8" }}>—</span>}</TD>
                    <TD style={{ fontFamily: "monospace" }}>{rec.soKmBaoDuong ?? <span style={{ color: "#94a3b8" }}>—</span>}</TD>
                    <TD style={{ fontFamily: "monospace" }}>{rec.kiBaoDuongTiepTheo ?? <span style={{ color: "#94a3b8" }}>—</span>}</TD>
                    <TD style={{ fontFamily: "monospace" }}>{rec.soKmHienTai ?? <span style={{ color: "#94a3b8" }}>—</span>}</TD>
                    <TD style={{ fontFamily: "monospace" }}>{da !== null ? da : <span style={{ color: "#94a3b8" }}>—</span>}</TD>
                    <TD style={{ fontFamily: "monospace", color: conColor, fontWeight: conWeight }}>
                      {con !== null ? con : <span style={{ color: "#94a3b8", fontWeight: 400 }}>—</span>}
                    </TD>
                    <TD style={{ maxWidth: 160, color: "#6b7280" }}>{rec.ghiChu ?? "—"}</TD>
                    <TD>
                      <ActionMenu onEdit={() => openEdit(rec)} onDelete={() => handleDelete(rec)} />
                    </TD>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {!loading && (
          <Pagination page={page} totalPages={totalPages || 1} total={total} onPage={(p) => setPage(p)} />
        )}
      </div>

      {showCreate && (
        <Modal title="Thêm bảo dưỡng xe" onClose={() => setShowCreate(false)} onSubmit={handleCreate} error={createError}>
          <MaintenanceFormFields form={createForm} setForm={setCreateForm} />
        </Modal>
      )}

      {editTarget && (
        <Modal
          title={`Sửa — ${editTarget.bienSo ?? editTarget.tenTaiXe ?? "bản ghi"}`}
          onClose={() => setEditTarget(null)}
          onSubmit={handleEdit}
          error={editError}
        >
          <MaintenanceFormFields form={editForm} setForm={setEditForm} />
        </Modal>
      )}
    </div>
  );
}
