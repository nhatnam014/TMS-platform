"use client";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Dashboard</h1>
      <div
        style={{
          background: "#fef2f2",
          border: "1px solid #fca5a5",
          borderRadius: 8,
          padding: "16px 20px",
          color: "#dc2626",
          marginBottom: 16,
        }}
      >
        <p style={{ fontWeight: 600, marginBottom: 4 }}>Lỗi tải dữ liệu</p>
        <p style={{ fontSize: 13 }}>{error.message}</p>
      </div>
      <button
        onClick={reset}
        style={{
          padding: "8px 16px",
          background: "#2563eb",
          color: "#fff",
          border: "none",
          borderRadius: 6,
          fontSize: 14,
          cursor: "pointer",
        }}
      >
        Thử lại
      </button>
    </div>
  );
}
