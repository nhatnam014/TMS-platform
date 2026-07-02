import { useState } from "react";

interface ConfirmDialogProps {
  title: string;
  message: string;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  danger?: boolean;
  confirmLabel?: string;
  cancelLabel?: string;
}

export function ConfirmDialog({
  title,
  message,
  onConfirm,
  onCancel,
  danger = false,
  confirmLabel = "Xoá",
  cancelLabel = "Hủy",
}: ConfirmDialogProps) {
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    setLoading(true);
    await onConfirm();
    setLoading(false);
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
      }}
    >
      <div style={{ background: "#fff", borderRadius: 10, padding: 28, width: 380 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>{title}</h2>
        <p style={{ fontSize: 14, color: "#374151", marginBottom: 20, whiteSpace: "pre-line" }}>
          {message}
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            style={{
              padding: "8px 16px",
              border: "1px solid #d1d5db",
              borderRadius: 6,
              background: "#fff",
              fontSize: 14,
              cursor: loading ? "default" : "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            style={{
              padding: "8px 16px",
              background: danger ? "#ef4444" : "#3b82f6",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              fontSize: 14,
              cursor: loading ? "default" : "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Đang xoá..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
