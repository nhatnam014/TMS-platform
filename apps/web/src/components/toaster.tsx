"use client";

import { useToasts } from "@/lib/toast-context";

export function Toaster() {
  const { toasts, removeToast } = useToasts();

  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 20,
        right: 20,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        pointerEvents: "none",
      }}
    >
      {toasts.map((toast) => {
        const isSuccess = toast.type === "success";
        return (
          <div
            key={toast.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "12px 16px",
              borderRadius: 8,
              boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
              background: isSuccess ? "#f0fdf4" : "#fef2f2",
              border: `1px solid ${isSuccess ? "#bbf7d0" : "#fecaca"}`,
              color: isSuccess ? "#166534" : "#991b1b",
              fontSize: 14,
              fontWeight: 500,
              minWidth: 280,
              maxWidth: 400,
              pointerEvents: "auto",
              animation: "toastIn 0.2s ease",
            }}
          >
            <span style={{ flexShrink: 0, fontSize: 16 }}>{isSuccess ? "✓" : "✕"}</span>
            <span style={{ flex: 1 }}>{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: 16,
                color: isSuccess ? "#166534" : "#991b1b",
                padding: "0 2px",
                flexShrink: 0,
                opacity: 0.7,
              }}
              aria-label="Đóng thông báo"
            >
              ×
            </button>
          </div>
        );
      })}
      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(20px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
