"use client";

import { useAuth } from "@/lib/auth-context";
import { useEffect, useRef, useState } from "react";
import type { ImportResult, ImportChangedRecord, ImportCreatedRecord } from "@tms/shared";
import { useToast } from "@/lib/toast-context";

// ── Generic upload section (used for trip-plans) ─────────────────────────────

interface UploadSectionProps {
  title: string;
  endpoint: string;
  description: string;
}

function UploadSection({ title, endpoint, description }: UploadSectionProps) {
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload() {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setError("Chưa chọn file");
      return;
    }

    setUploading(true);
    setResult(null);
    setError(null);

    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(endpoint, { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        const msg = data.message ?? `Lỗi ${res.status}`;
        setError(msg);
        toast.error(msg);
        return;
      }
      const imported = data as ImportResult;
      setResult(imported);
      const parts = [`${imported.imported} tạo mới`];
      if (imported.updated) parts.push(`${imported.updated} cập nhật`);
      toast.success(`Nhập thành công: ${parts.join(", ")}`);
      if (fileRef.current) fileRef.current.value = "";
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Lỗi không xác định";
      setError(msg);
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 10,
        boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
        padding: 24,
        marginBottom: 24,
      }}
    >
      <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{title}</h2>
      <p style={{ fontSize: 13, color: "#64748b", marginBottom: 16 }}>{description}</p>

      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xls"
          style={{
            fontSize: 13,
            border: "1px solid #d1d5db",
            borderRadius: 6,
            padding: "6px 10px",
          }}
        />
        <button
          onClick={handleUpload}
          disabled={uploading}
          style={{
            padding: "8px 18px",
            background: "#3b82f6",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            fontSize: 14,
            cursor: uploading ? "not-allowed" : "pointer",
            opacity: uploading ? 0.7 : 1,
            fontWeight: 500,
          }}
        >
          {uploading ? "Đang nhập..." : "Nhập dữ liệu"}
        </button>
      </div>

      <ImportResultDisplay result={result} error={error} />
    </div>
  );
}

// ── Import result display (shared) ────────────────────────────────────────────

function ImportResultDisplay({
  result,
  error,
}: {
  result: ImportResult | null;
  error: string | null;
}) {
  const [showChangedPopup, setShowChangedPopup] = useState(false);
  const [showCreatedPopup, setShowCreatedPopup] = useState(false);

  return (
    <>
      {error && (
        <div
          style={{
            marginTop: 14,
            padding: "10px 14px",
            background: "#fef2f2",
            borderRadius: 6,
            color: "#dc2626",
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}
      {result && (
        <div style={{ marginTop: 14 }}>
          <div
            style={{
              padding: "10px 14px",
              background: "#f0fdf4",
              borderRadius: 6,
              color: "#166534",
              fontSize: 13,
              fontWeight: 600,
              marginBottom: result.warnings.length || result.errors.length ? 10 : 0,
            }}
          >
            Nhập thành công: {result.imported} tạo mới
            {result.updated ? `, ${result.updated} cập nhật` : ""}
          </div>
          {result.warnings.length > 0 && (
            <details style={{ marginBottom: 8 }}>
              <summary
                style={{
                  fontSize: 13,
                  color: "#92400e",
                  cursor: "pointer",
                  padding: "8px 12px",
                  background: "#fffbeb",
                  borderRadius: 6,
                }}
              >
                {result.warnings.length} cảnh báo (bấm để xem)
              </summary>
              <ul style={{ margin: "6px 0 0 0", paddingLeft: 20 }}>
                {result.warnings.map((w, i) => (
                  <li key={i} style={{ fontSize: 12, color: "#78350f", marginBottom: 3 }}>
                    {w}
                  </li>
                ))}
              </ul>
            </details>
          )}
          {result.errors.length > 0 && (
            <details style={{ marginBottom: result.changedRecords?.length ? 8 : 0 }}>
              <summary
                style={{
                  fontSize: 13,
                  color: "#991b1b",
                  cursor: "pointer",
                  padding: "8px 12px",
                  background: "#fef2f2",
                  borderRadius: 6,
                }}
              >
                {result.errors.length} lỗi bỏ qua (bấm để xem)
              </summary>
              <ul style={{ margin: "6px 0 0 0", paddingLeft: 20 }}>
                {result.errors.map((e, i) => (
                  <li key={i} style={{ fontSize: 12, color: "#7f1d1d", marginBottom: 3 }}>
                    {e}
                  </li>
                ))}
              </ul>
            </details>
          )}
          {result.createdRecords && result.createdRecords.length > 0 && (
            <button
              type="button"
              onClick={() => setShowCreatedPopup(true)}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                fontSize: 13,
                color: "#166534",
                cursor: "pointer",
                padding: "8px 12px",
                background: "#f0fdf4",
                borderRadius: 6,
                border: "none",
                marginBottom: result.changedRecords?.length ? 8 : 0,
              }}
            >
              {result.createdRecords.length} bản ghi mới tạo (bấm để xem)
            </button>
          )}
          {result.changedRecords && result.changedRecords.length > 0 && (
            <button
              type="button"
              onClick={() => setShowChangedPopup(true)}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                fontSize: 13,
                color: "#1d4ed8",
                cursor: "pointer",
                padding: "8px 12px",
                background: "#eff6ff",
                borderRadius: 6,
                border: "none",
              }}
            >
              {result.changedRecords.length} bản ghi đã thay đổi (bấm để xem)
            </button>
          )}
        </div>
      )}
      {result?.changedRecords && result.changedRecords.length > 0 && showChangedPopup && (
        <ChangedRecordsPopup
          changedRecords={result.changedRecords}
          onClose={() => setShowChangedPopup(false)}
        />
      )}
      {result?.createdRecords && result.createdRecords.length > 0 && showCreatedPopup && (
        <CreatedRecordsPopup
          createdRecords={result.createdRecords}
          onClose={() => setShowCreatedPopup(false)}
        />
      )}
    </>
  );
}

// ── ChangedRecordsPopup ───────────────────────────────────────────────────────

function ChangedRecordsPopup({
  changedRecords,
  onClose,
}: {
  changedRecords: ImportChangedRecord[];
  onClose: () => void;
}) {
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
          padding: 24,
          width: "min(95vw, 720px)",
          maxHeight: "80vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>
            {changedRecords.length} bản ghi đã thay đổi
          </h3>
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

        <div style={{ overflowY: "auto", flex: 1 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr>
                <th
                  style={{
                    textAlign: "left",
                    padding: "8px 10px",
                    borderBottom: "2px solid #e5e7eb",
                    background: "#f8fafc",
                    width: "30%",
                  }}
                >
                  Bản ghi
                </th>
                <th
                  style={{
                    textAlign: "left",
                    padding: "8px 10px",
                    borderBottom: "2px solid #e5e7eb",
                    background: "#f8fafc",
                  }}
                >
                  Thay đổi
                </th>
              </tr>
            </thead>
            <tbody>
              {changedRecords.map((rec, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #e5e7eb" }}>
                  <td style={{ padding: "8px 10px", verticalAlign: "top", fontWeight: 600 }}>
                    {rec.identifier}
                  </td>
                  <td style={{ padding: "8px 10px", verticalAlign: "top" }}>
                    {rec.changes.map((c, j) => (
                      <div key={j} style={{ marginBottom: 2 }}>
                        <strong>{c.field}</strong>: {String(c.oldValue ?? "—")} →{" "}
                        {String(c.newValue ?? "—")}
                      </div>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            borderTop: "1px solid #e5e7eb",
            paddingTop: 14,
            marginTop: 14,
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
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

// ── CreatedRecordsPopup ───────────────────────────────────────────────────────

function CreatedRecordsPopup({
  createdRecords,
  onClose,
}: {
  createdRecords: ImportCreatedRecord[];
  onClose: () => void;
}) {
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
          padding: 24,
          width: "min(95vw, 560px)",
          maxHeight: "80vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>
            {createdRecords.length} bản ghi mới tạo
          </h3>
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

        <div style={{ overflowY: "auto", flex: 1 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr>
                <th
                  style={{
                    textAlign: "left",
                    padding: "8px 10px",
                    borderBottom: "2px solid #e5e7eb",
                    background: "#f8fafc",
                    width: "20%",
                  }}
                >
                  Hàng
                </th>
                <th
                  style={{
                    textAlign: "left",
                    padding: "8px 10px",
                    borderBottom: "2px solid #e5e7eb",
                    background: "#f8fafc",
                  }}
                >
                  Bản ghi
                </th>
              </tr>
            </thead>
            <tbody>
              {createdRecords.map((rec, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #e5e7eb" }}>
                  <td style={{ padding: "8px 10px", verticalAlign: "top", color: "#94a3b8" }}>
                    {rec.rowNum}
                  </td>
                  <td style={{ padding: "8px 10px", verticalAlign: "top", fontWeight: 600 }}>
                    {rec.identifier}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            borderTop: "1px solid #e5e7eb",
            paddingTop: 14,
            marginTop: 14,
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
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Download button ───────────────────────────────────────────────────────────

interface DownloadButtonProps {
  label: string;
  endpoint: string;
  filename: string;
  extraInputs?: React.ReactNode;
  buildUrl?: () => string;
}

function DownloadButton({ label, endpoint, filename, extraInputs, buildUrl }: DownloadButtonProps) {
  const toast = useToast();
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDownload() {
    setDownloading(true);
    setError(null);
    try {
      const url = buildUrl ? buildUrl() : endpoint;
      const res = await fetch(url);
      if (!res.ok) {
        const msg = `Lỗi ${res.status}`;
        setError(msg);
        toast.error(msg);
        return;
      }
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      URL.revokeObjectURL(a.href);
      toast.success("Tải xuống thành công");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Lỗi không xác định";
      setError(msg);
      toast.error(msg);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div style={{ display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap" }}>
      {extraInputs}
      <button
        onClick={handleDownload}
        disabled={downloading}
        style={{
          padding: "8px 18px",
          background: "#059669",
          color: "#fff",
          border: "none",
          borderRadius: 6,
          fontSize: 14,
          cursor: downloading ? "not-allowed" : "pointer",
          opacity: downloading ? 0.7 : 1,
          fontWeight: 500,
        }}
      >
        {downloading ? "Đang tải..." : label}
      </button>
      {error && <span style={{ fontSize: 12, color: "#dc2626" }}>{error}</span>}
    </div>
  );
}

// ── LoaiXeExportPopup ─────────────────────────────────────────────────────────

function LoaiXeExportPopup({
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
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
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

// ── Maintenance export section ────────────────────────────────────────────────

function MaintenanceExportSection() {
  const toast = useToast();
  const [loaiXeList, setLoaiXeList] = useState<string[]>([]);
  const [showPopup, setShowPopup] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/vehicle-records/distinct-loai-xe")
      .then((r) => r.json())
      .then((data: string[]) => setLoaiXeList(data))
      .catch(() => {});
  }, []);

  async function handleConfirmExport(selected: string[]) {
    setDownloading(true);
    setError(null);
    try {
      const params = selected.length > 0 ? `?units=${selected.join(",")}` : "";
      const res = await fetch(`/api/export/vehicle-maintenance${params}`);
      if (!res.ok) {
        const msg = `Lỗi ${res.status}`;
        setError(msg);
        toast.error(msg);
        return;
      }
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "bao-duong-xe.xlsx";
      a.click();
      URL.revokeObjectURL(a.href);
      toast.success("Tải xuống thành công");
      setShowPopup(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Lỗi không xác định";
      setError(msg);
      toast.error(msg);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div style={{ background: "#fff", borderRadius: 10, boxShadow: "0 1px 4px rgba(0,0,0,0.07)", padding: 24, marginBottom: 24 }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Xuất bảo dưỡng xe</h2>
      <p style={{ fontSize: 13, color: "#64748b", marginBottom: 16 }}>
        Xuất bảo dưỡng xe ra file Excel nhiều sheet. Mỗi sheet tương ứng với một loại xe từ quản lý xe.
      </p>

      {loaiXeList.length === 0 && (
        <p style={{ fontSize: 13, color: "#94a3b8", marginBottom: 16 }}>Chưa có loại xe nào trong hệ thống.</p>
      )}

      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <button
          onClick={() => setShowPopup(true)}
          disabled={loaiXeList.length === 0}
          style={{ padding: "8px 18px", background: "#059669", color: "#fff", border: "none", borderRadius: 6, fontSize: 14, cursor: loaiXeList.length === 0 ? "not-allowed" : "pointer", opacity: loaiXeList.length === 0 ? 0.6 : 1, fontWeight: 500 }}
        >
          Xuất Excel bảo dưỡng xe
        </button>
        {error && <span style={{ fontSize: 12, color: "#dc2626" }}>{error}</span>}
      </div>

      {showPopup && (
        <LoaiXeExportPopup
          loaiXeList={loaiXeList}
          onConfirm={handleConfirmExport}
          onClose={() => setShowPopup(false)}
          downloading={downloading}
        />
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ImportExportPage() {
  const { role } = useAuth();
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  if (role && role !== "ADMIN") {
    return (
      <div style={{ padding: 32, color: "#dc2626" }}>
        Chỉ ADMIN mới có quyền truy cập trang này.
      </div>
    );
  }

  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24 }}>Nhập / Xuất Excel</h1>

      <h2
        style={{
          fontSize: 15,
          fontWeight: 600,
          color: "#374151",
          marginBottom: 14,
          borderBottom: "1px solid #e2e8f0",
          paddingBottom: 8,
        }}
      >
        Nhập dữ liệu từ Excel
      </h2>

      <UploadSection
        title="Nhập danh sách xe — Quản lý xe"
        endpoint="/api/import/vehicles?confirm=true"
        description="Tải lên sheet 'quản lý xe' — mỗi lần nhập sẽ tạo thêm bản ghi mới vào danh sách quản lý xe."
      />

      <UploadSection
        title="Nhập kế hoạch chuyến — Kế hoạch xe"
        endpoint="/api/import/trip-plans"
        description="Tải lên sheet 'kế hoạch xe' — mỗi lần nhập sẽ tạo thêm bản ghi mới. Khách hàng, hãng xe, địa điểm chưa có sẽ được tự tạo."
      />

      <UploadSection
        title="Nhập bảo dưỡng xe"
        endpoint="/api/import/vehicle-maintenance"
        description="Tải lên file Excel nhiều sheet (mỗi sheet là một loại xe). Hàng có ID → cập nhật; hàng không có ID → tạo mới."
      />

      <UploadSection
        title="Nhập tiến độ vận tải"
        endpoint="/api/import/yard-moves?confirm=true"
        description="Tải lên sheet 'tiến độ vận tải'. Hàng có ID → cập nhật; hàng không có ID → tạo mới."
      />

      <h2
        style={{
          fontSize: 15,
          fontWeight: 600,
          color: "#374151",
          marginBottom: 14,
          borderBottom: "1px solid #e2e8f0",
          paddingBottom: 8,
          marginTop: 8,
        }}
      >
        Xuất dữ liệu ra Excel
      </h2>

      <div
        style={{
          background: "#fff",
          borderRadius: 10,
          boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
          padding: 24,
          marginBottom: 24,
        }}
      >
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Xuất kế hoạch chuyến</h2>
        <p style={{ fontSize: 13, color: "#64748b", marginBottom: 16 }}>
          Xuất danh sách chuyến ra file Excel với tiêu đề tiếng Việt. Lọc theo ngày (tùy chọn).
        </p>
        <DownloadButton
          label="Tải xuống ke-hoach-xe.xlsx"
          endpoint="/api/export/trip-plans"
          filename="ke-hoach-xe.xlsx"
          buildUrl={() => {
            const params = new URLSearchParams();
            if (fromDate) params.set("from", fromDate);
            if (toDate) params.set("to", toDate);
            const qs = params.toString();
            return `/api/export/trip-plans${qs ? `?${qs}` : ""}`;
          }}
          extraInputs={
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <div>
                <label
                  style={{ display: "block", fontSize: 12, color: "#64748b", marginBottom: 4 }}
                >
                  Từ ngày
                </label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  style={{
                    padding: "6px 10px",
                    border: "1px solid #d1d5db",
                    borderRadius: 6,
                    fontSize: 13,
                  }}
                />
              </div>
              <div>
                <label
                  style={{ display: "block", fontSize: 12, color: "#64748b", marginBottom: 4 }}
                >
                  Đến ngày
                </label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  style={{
                    padding: "6px 10px",
                    border: "1px solid #d1d5db",
                    borderRadius: 6,
                    fontSize: 13,
                  }}
                />
              </div>
            </div>
          }
        />
      </div>

      <div
        style={{
          background: "#fff",
          borderRadius: 10,
          boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
          padding: 24,
          marginBottom: 24,
        }}
      >
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>
          Xuất danh sách quản lý xe
        </h2>
        <p style={{ fontSize: 13, color: "#64748b", marginBottom: 16 }}>
          Xuất danh sách xe, tài xế và rơ moóc kèm hạn đăng kiểm / bảo hiểm.
        </p>
        <DownloadButton
          label="Tải xuống quan-ly-xe.xlsx"
          endpoint="/api/export/vehicles"
          filename="quan-ly-xe.xlsx"
        />
      </div>

      <MaintenanceExportSection />

      <div
        style={{
          background: "#fff",
          borderRadius: 10,
          boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
          padding: 24,
          marginBottom: 24,
        }}
      >
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Xuất tiến độ vận tải</h2>
        <p style={{ fontSize: 13, color: "#64748b", marginBottom: 16 }}>
          Xuất danh sách tiến độ vận tải ra file Excel.
        </p>
        <DownloadButton
          label="Tải xuống tien-do-van-tai.xlsx"
          endpoint="/api/export/yard-moves"
          filename="tien-do-van-tai.xlsx"
        />
      </div>
    </div>
  );
}
