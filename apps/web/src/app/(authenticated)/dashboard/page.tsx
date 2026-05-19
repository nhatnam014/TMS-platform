import type { DashboardStats } from "@tms/shared";
import { serverFetch } from "@/lib/server-fetch";

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 10,
        padding: "20px 24px",
        boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
        minWidth: 160,
      }}
    >
      <p style={{ fontSize: 12, color: "#64748b", marginBottom: 8, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {label}
      </p>
      <p style={{ fontSize: 28, fontWeight: 700, color: "#0f172a" }}>{value}</p>
    </div>
  );
}

export default async function DashboardPage() {
  let stats: DashboardStats;

  try {
    stats = await serverFetch<DashboardStats>("/dashboard/stats");
  } catch (err) {
    return (
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24 }}>Dashboard</h1>
        <p style={{ color: "#dc2626", background: "#fef2f2", padding: "12px 16px", borderRadius: 8 }}>
          Không thể tải dữ liệu: {err instanceof Error ? err.message : "Lỗi không xác định"}
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24 }}>Dashboard</h1>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
        <StatCard label="Tổng chuyến hôm nay" value={stats.totalTripsToday} />
        <StatCard label="Đã hoàn thành" value={stats.tripsCompleted} />
        <StatCard label="Đang vận chuyển" value={stats.tripsInTransit} />
        <StatCard label="Xe đang hoạt động" value={stats.vehiclesActive} />
        <StatCard label="Xe bảo dưỡng" value={stats.vehiclesInMaintenance} />
        <StatCard label="Sắp hết hạn" value={stats.expiringCompliance} />
      </div>
    </div>
  );
}
