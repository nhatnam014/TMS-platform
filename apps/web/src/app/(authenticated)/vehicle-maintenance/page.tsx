"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useToast } from "@/lib/toast-context";
import { formatDate } from "@/lib/date-utils";

interface KmRound {
  id: string;
  roundNumber: number;
  kmCon: string;
}

interface VehicleRecord {
  id: string;
  bienSo: string | null;
  tenTaiXe: string | null;
  sdt: string | null;
  loaiXe: string | null;
  donViSuaChua: string | null;
  ngayLam: string | null;
  kmHienTai: string | null;
  ghiChuBaoDuong: string | null;
  kmRounds: KmRound[];
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
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderTop: "1px solid #e2e8f0", background: "#f8fafc", borderRadius: "0 0 10px 10px" }}>
      <span style={{ fontSize: 13, color: "#6b7280" }}>Tổng: {total} bản ghi</span>
      <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
        <button onClick={() => onPage(page - 1)} disabled={page <= 1} style={{ padding: "4px 10px", fontSize: 13, border: "1px solid #d1d5db", borderRadius: 4, background: "#fff", cursor: page <= 1 ? "not-allowed" : "pointer", opacity: page <= 1 ? 0.4 : 1 }}>←</button>
        {pages.map((p, i) =>
          p === "..." ? (
            <span key={`e${i}`} style={{ padding: "0 4px", color: "#9ca3af", fontSize: 13 }}>…</span>
          ) : (
            <button key={p} onClick={() => onPage(p as number)} style={{ padding: "4px 10px", fontSize: 13, border: "1px solid", borderColor: p === page ? "#3b82f6" : "#d1d5db", borderRadius: 4, background: p === page ? "#3b82f6" : "#fff", color: p === page ? "#fff" : "#374151", fontWeight: p === page ? 700 : 400, cursor: "pointer" }}>{p}</button>
          ),
        )}
        <button onClick={() => onPage(page + 1)} disabled={page >= totalPages} style={{ padding: "4px 10px", fontSize: 13, border: "1px solid #d1d5db", borderRadius: 4, background: "#fff", cursor: page >= totalPages ? "not-allowed" : "pointer", opacity: page >= totalPages ? 0.4 : 1 }}>→</button>
      </div>
    </div>
  );
}

// ─── ActionMenu ────────────────────────────────────────────────────────────

function ActionMenu({ onEdit }: { onEdit: () => void }) {
  const [open, setOpen] = useState(false);
  const [dropPos, setDropPos] = useState<{ top: number; right: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (
        dropRef.current && !dropRef.current.contains(e.target as Node) &&
        btnRef.current && !btnRef.current.contains(e.target as Node)
      ) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function handleToggle() {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setDropPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
    }
    setOpen((v) => !v);
  }

  return (
    <>
      <button
        ref={btnRef}
        onClick={handleToggle}
        style={{ padding: "5px 14px", background: open ? "#c7d2fe" : "#e0e7ff", border: `1px solid ${open ? "#818cf8" : "#a5b4fc"}`, borderRadius: 6, fontSize: 18, fontWeight: 700, color: open ? "#3730a3" : "#4f46e5", cursor: "pointer", lineHeight: 1 }}
      >···</button>
      {open && dropPos && createPortal(
        <div
          ref={dropRef}
          style={{ position: "fixed", top: dropPos.top, right: dropPos.right, background: "#fff", borderRadius: 10, padding: 6, boxShadow: "0 8px 28px rgba(0,0,0,0.18)", minWidth: 140, display: "flex", flexDirection: "column", zIndex: 9999 }}
        >
          <button
            onClick={() => { setOpen(false); onEdit(); }}
            style={{ background: "#eff6ff", border: "1px solid #bfdbfe", color: "#2563eb", fontWeight: 600, fontSize: 13, padding: "9px 14px", borderRadius: 6, cursor: "pointer", textAlign: "left" }}
          >Sửa bảo dưỡng</button>
        </div>,
        document.body,
      )}
    </>
  );
}

// ─── Edit Modal ────────────────────────────────────────────────────────────

interface NewRound {
  roundNumber: number;
  kmCon: string;
}

function EditModal({
  record,
  onClose,
  onSaved,
}: {
  record: VehicleRecord;
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [donViSuaChua, setDonViSuaChua] = useState(record.donViSuaChua ?? "");
  const [ngayLam, setNgayLam] = useState(record.ngayLam ? record.ngayLam.slice(0, 10) : "");
  const [kmHienTai, setKmHienTai] = useState(record.kmHienTai ?? "");
  const [ghiChuBaoDuong, setGhiChuBaoDuong] = useState(record.ghiChuBaoDuong ?? "");
  const [existingRounds, setExistingRounds] = useState<KmRound[]>(record.kmRounds ?? []);
  const [editedKmCon, setEditedKmCon] = useState<Record<string, string>>(
    Object.fromEntries((record.kmRounds ?? []).map((r) => [r.id, r.kmCon])),
  );
  const [newRounds, setNewRounds] = useState<NewRound[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function nextRoundNumber(): number {
    const existing = existingRounds.map((r) => r.roundNumber);
    const adding = newRounds.map((r) => r.roundNumber);
    const all = [...existing, ...adding];
    let n = 1;
    while (all.includes(n)) n++;
    return n;
  }

  function addNewRoundRow() {
    setNewRounds((prev) => [...prev, { roundNumber: nextRoundNumber(), kmCon: "" }]);
  }

  function updateNewRound(idx: number, field: "roundNumber" | "kmCon", val: string) {
    setNewRounds((prev) => prev.map((r, i) => i === idx ? { ...r, [field]: field === "roundNumber" ? Number(val) : val } : r));
  }

  function removeNewRound(idx: number) {
    setNewRounds((prev) => prev.filter((_, i) => i !== idx));
  }

  async function deleteRound(roundNumber: number) {
    if (!confirm(`Xóa KM còn lần ${roundNumber}?`)) return;
    const res = await fetch(`/api/vehicle-maintenance/${record.id}/km-rounds/${roundNumber}`, { method: "DELETE" });
    if (res.ok) {
      setExistingRounds((prev) => prev.filter((r) => r.roundNumber !== roundNumber));
      toast.success(`Đã xóa lần ${roundNumber}`);
    } else {
      toast.error("Lỗi xóa km round");
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    // 1. PATCH maintenance fields
    const patchRes = await fetch(`/api/vehicle-maintenance/${record.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        donViSuaChua: donViSuaChua || null,
        ngayLam: ngayLam || null,
        kmHienTai: kmHienTai || null,
        ghiChuBaoDuong: ghiChuBaoDuong || null,
      }),
    });
    if (!patchRes.ok) {
      const body = await patchRes.json().catch(() => ({}));
      setError(body.message ?? "Lỗi cập nhật");
      setSaving(false);
      return;
    }

    // 2. Batch upsert edited existing + new km rounds
    const editedRounds = existingRounds.map((r) => ({
      roundNumber: r.roundNumber,
      kmCon: editedKmCon[r.id] ?? r.kmCon,
    }));
    const validNewRounds = newRounds
      .filter((r) => r.kmCon.trim() !== "")
      .map((r) => ({ roundNumber: r.roundNumber, kmCon: r.kmCon }));
    const allRounds = [...editedRounds, ...validNewRounds];
    if (allRounds.length > 0) {
      const putRes = await fetch(`/api/vehicle-maintenance/${record.id}/km-rounds`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rounds: allRounds }),
      });
      if (!putRes.ok) {
        const body = await putRes.json().catch(() => ({}));
        setError(body.message ?? "Lỗi cập nhật km rounds");
        setSaving(false);
        return;
      }
    }

    setSaving(false);
    toast.success("Đã cập nhật bảo dưỡng xe");
    onSaved();
    onClose();
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
      <div style={{ background: "#fff", borderRadius: 10, padding: 28, width: "min(95vw, 600px)", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>
            Sửa bảo dưỡng — {record.bienSo ?? record.tenTaiXe ?? "bản ghi"}
          </h2>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#6b7280" }}>×</button>
        </div>

        {error && <p style={{ color: "#dc2626", background: "#fef2f2", padding: "8px 12px", borderRadius: 6, fontSize: 13, marginBottom: 14 }}>{error}</p>}

        <form
          onSubmit={handleSave}
          onKeyDown={(e) => { const tag = (e.target as HTMLElement).tagName; if (e.key === "Enter" && tag !== "TEXTAREA" && tag !== "BUTTON") e.preventDefault(); }}
        >
          {/* Section A: Maintenance fields */}
          <div style={{ background: "#dcfce7", border: "1px solid #e2e8f0", borderRadius: 8, padding: "12px 14px", marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#16a34a", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Đơn vị sửa chữa</div>
            <div style={{ marginBottom: 10 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 500, marginBottom: 3, color: "#6b7280" }}>Đơn vị sửa chữa</label>
              <input
                type="text"
                value={donViSuaChua}
                onChange={(e) => setDonViSuaChua(e.target.value)}
                style={{ width: "100%", padding: "7px 10px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 13, boxSizing: "border-box" }}
              />
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 500, marginBottom: 3, color: "#6b7280" }}>Ngày làm</label>
              <input
                type="date"
                value={ngayLam}
                onChange={(e) => setNgayLam(e.target.value)}
                style={{ width: "100%", padding: "7px 10px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 13, boxSizing: "border-box" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 500, marginBottom: 3, color: "#6b7280" }}>Số KM hiện tại</label>
              <input
                type="text"
                value={kmHienTai}
                onChange={(e) => setKmHienTai(e.target.value)}
                placeholder="VD: 320.000 km"
                style={{ width: "100%", padding: "7px 10px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 13, boxSizing: "border-box" }}
              />
            </div>
          </div>

          {/* Section B: KM rounds */}
          <div style={{ background: "#fef9c3", border: "1px solid #e2e8f0", borderRadius: 8, padding: "12px 14px", marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#ca8a04", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Km còn các lần</div>

            {existingRounds.map((r) => (
              <div key={r.roundNumber} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 13, color: "#374151", minWidth: 60 }}>Lần {r.roundNumber}</span>
                <input
                  type="text"
                  value={editedKmCon[r.id] ?? r.kmCon}
                  onChange={(e) => setEditedKmCon((prev) => ({ ...prev, [r.id]: e.target.value }))}
                  placeholder="VD: 250.000 km"
                  style={{ flex: 1, padding: "6px 10px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 13, background: "#fff" }}
                />
                <button
                  type="button"
                  onClick={() => deleteRound(r.roundNumber)}
                  style={{ padding: "6px 12px", background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", borderRadius: 6, fontSize: 12, cursor: "pointer" }}
                >Xóa</button>
              </div>
            ))}

            {newRounds.map((r, idx) => (
              <div key={idx} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <div style={{ display: "flex", flexDirection: "column", minWidth: 80 }}>
                  <label style={{ fontSize: 11, color: "#6b7280", marginBottom: 2 }}>Lần</label>
                  <input
                    type="number"
                    value={r.roundNumber}
                    min={1}
                    onChange={(e) => updateNewRound(idx, "roundNumber", e.target.value)}
                    style={{ width: 60, padding: "6px 8px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 13 }}
                  />
                </div>
                <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                  <label style={{ fontSize: 11, color: "#6b7280", marginBottom: 2 }}>KM còn</label>
                  <input
                    type="text"
                    value={r.kmCon}
                    placeholder="VD: 250.000 km"
                    onChange={(e) => updateNewRound(idx, "kmCon", e.target.value)}
                    style={{ width: "100%", padding: "6px 10px", border: "1px solid #86efac", borderRadius: 6, fontSize: 13, background: "#f0fdf4", boxSizing: "border-box" }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeNewRound(idx)}
                  style={{ marginTop: 18, padding: "6px 10px", background: "#f3f4f6", border: "1px solid #d1d5db", color: "#6b7280", borderRadius: 6, fontSize: 12, cursor: "pointer" }}
                >✕</button>
              </div>
            ))}

            <button
              type="button"
              onClick={addNewRoundRow}
              style={{ marginTop: 6, padding: "7px 14px", background: "#fef3c7", border: "1px solid #fcd34d", color: "#92400e", borderRadius: 6, fontSize: 13, cursor: "pointer", fontWeight: 500 }}
            >+ Thêm lần</button>
          </div>

          {/* Section C: Ghi chú */}
          <div style={{ background: "#f3f4f6", border: "1px solid #e2e8f0", borderRadius: 8, padding: "12px 14px", marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#4b5563", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Ghi chú</div>
            <textarea
              value={ghiChuBaoDuong}
              onChange={(e) => setGhiChuBaoDuong(e.target.value)}
              rows={3}
              placeholder="Ghi chú bảo dưỡng..."
              style={{ width: "100%", padding: "7px 10px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 13, boxSizing: "border-box", resize: "vertical", fontFamily: "inherit" }}
            />
          </div>

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 16, borderTop: "1px solid #e5e7eb", paddingTop: 14 }}>
            <button type="button" onClick={onClose} style={{ padding: "8px 16px", border: "1px solid #d1d5db", borderRadius: 6, background: "#fff", fontSize: 14, cursor: "pointer" }}>Hủy</button>
            <button type="submit" disabled={saving} style={{ padding: "8px 16px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: 6, fontSize: 14, cursor: "pointer", opacity: saving ? 0.7 : 1 }}>
              {saving ? "Đang lưu..." : "Lưu"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Table helpers ─────────────────────────────────────────────────────────

const TH = ({ children, width, style }: { children?: React.ReactNode; width?: number; style?: React.CSSProperties }) => (
  <th style={{ padding: "9px 10px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em", whiteSpace: "nowrap", borderBottom: "2px solid #e2e8f0", width, ...style }}>
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

  const [records, setRecords] = useState<VehicleRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);
  const [colCount, setColCount] = useState(4);

  const [editTarget, setEditTarget] = useState<VehicleRecord | null>(null);

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
          const data: VehicleRecord[] = res.data ?? [];
          setRecords(data);
          setTotal(res.meta?.total ?? 0);
          setTotalPages(res.meta?.totalPages ?? 1);
          setFetchError(null);

          // Compute dynamic column count from this batch
          const maxRound = data.reduce((max, rec) => {
            const n = rec.kmRounds?.reduce((m, r) => Math.max(m, r.roundNumber), 0) ?? 0;
            return n > max ? n : max;
          }, 0);
          setColCount(Math.max(4, maxRound));
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

  const kmHeaders = Array.from({ length: colCount }, (_, i) => `KM CÒN DƯỠNG LẦN ${i + 1}`);
  const totalCols = 10 + colCount; // STT + 6 base cols + KM hiện tại + km cols + ghi chú + action

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>Bảo dưỡng xe</h1>
      </div>

      <div style={{ background: "#fff", borderRadius: 10, boxShadow: "0 1px 4px rgba(0,0,0,0.07)", padding: "14px 16px", marginBottom: 14 }}>
        <input
          type="text"
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Tìm biển số, tài xế, loại xe, đơn vị sửa chữa..."
          style={{ width: "100%", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 13, boxSizing: "border-box", color: "#111827" }}
        />
      </div>

      {fetchError && (
        <p style={{ color: "#dc2626", background: "#fef2f2", padding: "10px 14px", borderRadius: 6, marginBottom: 16, fontSize: 13 }}>{fetchError}</p>
      )}

      <div style={{ background: "#fff", borderRadius: 10, boxShadow: "0 1px 4px rgba(0,0,0,0.07)", overflow: "auto" }}>
        <table style={{ tableLayout: "fixed", borderCollapse: "separate", borderSpacing: 0, width: `${764 + 140 + colCount * 150 + 180 + 84}px` }}>
          <thead>
            <tr style={{ background: "#f8fafc" }}>
              <TH width={44}  style={{ position: "sticky", left: 0,   zIndex: 3, background: "#f8fafc" }}>STT</TH>
              <TH width={110} style={{ position: "sticky", left: 44,  zIndex: 3, background: "#f8fafc" }}>Số xe</TH>
              <TH width={130} style={{ position: "sticky", left: 154, zIndex: 3, background: "#f8fafc" }}>Tài xế</TH>
              <TH width={110} style={{ position: "sticky", left: 284, zIndex: 3, background: "#f8fafc" }}>SĐT</TH>
              <TH width={100} style={{ position: "sticky", left: 394, zIndex: 3, background: "#f8fafc" }}>Ngày làm</TH>
              <TH width={110} style={{ position: "sticky", left: 494, zIndex: 3, background: "#f8fafc" }}>Loại xe</TH>
              <TH width={160} style={{ position: "sticky", left: 604, zIndex: 3, background: "#f8fafc", boxShadow: "2px 0 5px -2px rgba(0,0,0,0.14)" }}>Đơn vị sửa chữa</TH>
              <TH width={140}>Số KM hiện tại</TH>
              {kmHeaders.map((h) => (
                <TH key={h} width={150} style={{ background: "#fef9c3" }}>{h}</TH>
              ))}
              <TH width={180}>Ghi chú</TH>
              <TH width={84} style={{ position: "sticky", right: 0, zIndex: 3, background: "#f8fafc", boxShadow: "-2px 0 5px -2px rgba(0,0,0,0.14)" }}></TH>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={totalCols} style={{ padding: 32, textAlign: "center", color: "#94a3b8" }}>Đang tải...</td></tr>
            ) : records.length === 0 ? (
              <tr><td colSpan={totalCols} style={{ padding: 32, textAlign: "center", color: "#94a3b8" }}>Chưa có dữ liệu</td></tr>
            ) : (
              records.map((rec, idx) => {
                const recNum = (page - 1) * PAGE_SIZE + idx + 1;
                const bg = idx % 2 === 0 ? "#fff" : "#fafafa";
                // Build km lookup
                const kmMap: Record<number, string> = {};
                for (const r of (rec.kmRounds ?? [])) {
                  kmMap[r.roundNumber] = r.kmCon;
                }

                return (
                  <tr key={rec.id} style={{ background: bg }}>
                    <TD style={{ color: "#94a3b8", position: "sticky", left: 0,   zIndex: 1, background: bg }}>{recNum}</TD>
                    <TD style={{ fontFamily: "monospace", fontWeight: 600, position: "sticky", left: 44,  zIndex: 1, background: bg }}>{rec.bienSo ?? <span style={{ color: "#94a3b8" }}>—</span>}</TD>
                    <TD style={{ position: "sticky", left: 154, zIndex: 1, background: bg }}>{rec.tenTaiXe ?? <span style={{ color: "#94a3b8" }}>—</span>}</TD>
                    <TD style={{ fontFamily: "monospace", position: "sticky", left: 284, zIndex: 1, background: bg }}>{rec.sdt ?? <span style={{ color: "#94a3b8" }}>—</span>}</TD>
                    <TD style={{ position: "sticky", left: 394, zIndex: 1, background: bg }}>{formatDate(rec.ngayLam) || <span style={{ color: "#94a3b8" }}>—</span>}</TD>
                    <TD style={{ position: "sticky", left: 494, zIndex: 1, background: bg }}>{rec.loaiXe ?? <span style={{ color: "#94a3b8" }}>—</span>}</TD>
                    <TD style={{ position: "sticky", left: 604, zIndex: 1, background: bg, boxShadow: "2px 0 5px -2px rgba(0,0,0,0.14)" }}>{rec.donViSuaChua ?? <span style={{ color: "#94a3b8" }}>—</span>}</TD>
                    <TD style={{ fontFamily: "monospace" }}>{rec.kmHienTai ?? <span style={{ color: "#94a3b8" }}>—</span>}</TD>
                    {Array.from({ length: colCount }, (_, i) => {
                      const rn = i + 1;
                      const val = kmMap[rn];
                      return (
                        <TD key={rn} style={{ fontFamily: "monospace", background: "#fefce8" }}>
                          {val !== undefined ? val : <span style={{ color: "#94a3b8" }}>—</span>}
                        </TD>
                      );
                    })}
                    <TD>{rec.ghiChuBaoDuong ?? <span style={{ color: "#94a3b8" }}>—</span>}</TD>
                    <TD style={{ position: "sticky", right: 0, zIndex: 1, background: bg, boxShadow: "-2px 0 5px -2px rgba(0,0,0,0.14)", textAlign: "center" }}>
                      <ActionMenu onEdit={() => setEditTarget(rec)} />
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

      {editTarget && (
        <EditModal
          record={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={() => { setRefresh((r) => r + 1); toast.success("Đã cập nhật"); }}
        />
      )}
    </div>
  );
}
