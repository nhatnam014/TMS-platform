import type { PaginatedResponse, TripStatus } from "@tms/shared";
import { SERVICE_TYPE_LABELS } from "@tms/shared";
import { serverFetch } from "@/lib/server-fetch";

interface TripPlanRow {
  id: string;
  tripDate: string;
  tripNumber: number | null;
  serviceType: string;
  status: TripStatus;
  vehicle: { licensePlate: string };
  customer: { name: string };
}

const STATUS_LABELS: Record<TripStatus, string> = {
  PLANNED: "Kế hoạch",
  DISPATCHED: "Đã điều xe",
  IN_TRANSIT: "Đang vận chuyển",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Hủy",
};

const STATUS_COLORS: Record<TripStatus, string> = {
  PLANNED: "#6366f1",
  DISPATCHED: "#f59e0b",
  IN_TRANSIT: "#3b82f6",
  COMPLETED: "#10b981",
  CANCELLED: "#ef4444",
};

export default async function TripPlansPage() {
  let result: PaginatedResponse<TripPlanRow>;

  try {
    result = await serverFetch<PaginatedResponse<TripPlanRow>>("/trip-plans?limit=50");
  } catch (err) {
    return (
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24 }}>Kế hoạch chuyến</h1>
        <p style={{ color: "#dc2626", background: "#fef2f2", padding: "12px 16px", borderRadius: 8 }}>
          Không thể tải dữ liệu: {err instanceof Error ? err.message : "Lỗi không xác định"}
        </p>
      </div>
    );
  }

  const trips = result.data;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>Kế hoạch chuyến</h1>
        <span style={{ fontSize: 13, color: "#64748b" }}>
          {result.meta.total} chuyến
        </span>
      </div>

      <div style={{ background: "#fff", borderRadius: 10, boxShadow: "0 1px 4px rgba(0,0,0,0.07)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
              {["Ngày", "STT", "Loại dịch vụ", "Xe", "Khách hàng", "Trạng thái"].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: "10px 16px",
                    textAlign: "left",
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#64748b",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {trips.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: 32, textAlign: "center", color: "#94a3b8" }}>
                  Không có dữ liệu
                </td>
              </tr>
            ) : (
              trips.map((trip, i) => (
                <tr
                  key={trip.id}
                  style={{
                    borderBottom: "1px solid #f1f5f9",
                    background: i % 2 === 0 ? "#fff" : "#fafafa",
                  }}
                >
                  <td style={{ padding: "10px 16px", fontSize: 13 }}>
                    {new Date(trip.tripDate).toLocaleDateString("vi-VN")}
                  </td>
                  <td style={{ padding: "10px 16px", fontSize: 13, color: "#64748b" }}>
                    {trip.tripNumber ?? "—"}
                  </td>
                  <td style={{ padding: "10px 16px", fontSize: 13 }}>
                    {SERVICE_TYPE_LABELS[trip.serviceType as keyof typeof SERVICE_TYPE_LABELS] ?? trip.serviceType}
                  </td>
                  <td style={{ padding: "10px 16px", fontSize: 13, fontFamily: "monospace" }}>
                    {trip.vehicle?.licensePlate ?? "—"}
                  </td>
                  <td style={{ padding: "10px 16px", fontSize: 13 }}>
                    {trip.customer?.name ?? "—"}
                  </td>
                  <td style={{ padding: "10px 16px" }}>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "2px 10px",
                        borderRadius: 12,
                        fontSize: 12,
                        fontWeight: 500,
                        background: `${STATUS_COLORS[trip.status]}18`,
                        color: STATUS_COLORS[trip.status],
                      }}
                    >
                      {STATUS_LABELS[trip.status]}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
