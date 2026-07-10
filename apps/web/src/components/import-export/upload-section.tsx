"use client";

import { useRef, useState } from "react";
import type { ImportResult } from "@tms/shared";
import { useToast } from "@/lib/toast-context";
import { ImportResultDisplay } from "./import-result-display";

interface UploadSectionProps {
  title: string;
  endpoint: string;
  description: string;
  /** Called after a successful import so the caller can refresh its list view. */
  onImported?: () => void;
}

export function UploadSection({ title, endpoint, description, onImported }: UploadSectionProps) {
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
      onImported?.();
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
