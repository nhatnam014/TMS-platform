"use client";

import { useAuth } from "@/lib/auth-context";
import { useRef, useState } from "react";
import type { ImportResult } from "@tms/shared";
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
      toast.success(`Nhập thành công ${imported.imported} bản ghi`);
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
            Nhập thành công {result.imported} bản ghi
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
            <details>
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
        </div>
      )}
    </>
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
    </div>
  );
}
