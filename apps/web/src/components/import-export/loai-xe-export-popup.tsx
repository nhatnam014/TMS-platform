"use client";

import { useState } from "react";

export function LoaiXeExportPopup({
  loaiXeList,
  onConfirm,
  onClose,
  downloading,
}: {
  loaiXeList: string[];
  onConfirm: (selected: string[]) => void;
  onClose: () => void;
  downloading: boolean;
}) {
  const [selected, setSelected] = useState<string[]>([...loaiXeList]);

  function toggleAll() {
    setSelected(selected.length === loaiXeList.length ? [] : [...loaiXeList]);
  }

  function toggle(unit: string) {
    setSelected((prev) =>
      prev.includes(unit) ? prev.filter((u) => u !== unit) : [...prev, unit],
    );
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60 }}>
      <div style={{ background: "#fff", borderRadius: 10, padding: 28, width: "min(95vw, 440px)", maxHeight: "80vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Chọn loại xe để xuất</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#6b7280" }}>×</button>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", padding: "8px 12px", border: "1px solid #a5b4fc", borderRadius: 8, background: selected.length === loaiXeList.length ? "#e0e7ff" : "#f8fafc", marginBottom: 8 }}>
            <input type="checkbox" checked={selected.length === loaiXeList.length} onChange={toggleAll} style={{ cursor: "pointer" }} />
            Tất cả ({loaiXeList.length} loại xe)
          </label>
          {loaiXeList.map((unit) => (
            <label key={unit} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 8, background: selected.includes(unit) ? "#f0fdf4" : "#fafafa", marginBottom: 6 }}>
              <input type="checkbox" checked={selected.includes(unit)} onChange={() => toggle(unit)} style={{ cursor: "pointer" }} />
              {unit}
            </label>
          ))}
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", borderTop: "1px solid #e5e7eb", paddingTop: 14 }}>
          <button type="button" onClick={onClose} style={{ padding: "8px 16px", border: "1px solid #d1d5db", borderRadius: 6, background: "#fff", fontSize: 14, cursor: "pointer" }}>Hủy</button>
          <button
            type="button"
            onClick={() => onConfirm(selected)}
            disabled={downloading || selected.length === 0}
            style={{ padding: "8px 18px", background: "#059669", color: "#fff", border: "none", borderRadius: 6, fontSize: 14, cursor: (downloading || selected.length === 0) ? "not-allowed" : "pointer", opacity: (downloading || selected.length === 0) ? 0.6 : 1, fontWeight: 500 }}
          >
            {downloading ? "Đang tải..." : `Xuất ${selected.length} loại xe`}
          </button>
        </div>
      </div>
    </div>
  );
}
