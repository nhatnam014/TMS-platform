"use client";

import { useState } from "react";
import { useToast } from "@/lib/toast-context";

interface DownloadButtonProps {
  label: string;
  endpoint: string;
  filename: string;
  extraInputs?: React.ReactNode;
  buildUrl?: () => string;
  /** Shown instead of the generic success toast when the response's X-Export-Row-Count is 0. The file still downloads either way. */
  emptyResultMessage?: string;
}

export function DownloadButton({
  label,
  endpoint,
  filename,
  extraInputs,
  buildUrl,
  emptyResultMessage,
}: DownloadButtonProps) {
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
      const rowCountHeader = res.headers.get("X-Export-Row-Count");
      const rowCount = rowCountHeader !== null ? Number(rowCountHeader) : null;
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      URL.revokeObjectURL(a.href);
      if (rowCount === 0) {
        toast.error(emptyResultMessage ?? "Không có bản ghi nào phù hợp bộ lọc đã chọn.");
      } else {
        toast.success("Tải xuống thành công");
      }
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
