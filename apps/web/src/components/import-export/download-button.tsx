"use client";

import { useState } from "react";
import { useToast } from "@/lib/toast-context";

interface DownloadButtonProps {
  label: string;
  endpoint: string;
  filename: string;
  extraInputs?: React.ReactNode;
  buildUrl?: () => string;
}

export function DownloadButton({ label, endpoint, filename, extraInputs, buildUrl }: DownloadButtonProps) {
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
