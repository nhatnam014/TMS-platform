import { serverFetch } from "@/lib/server-fetch";

interface VehicleRow {
  id: string;
  licensePlate: string;
  vehicleType: string;
  status: string;
  inspectionExpiry: string | null;
  insuranceExpiry: string | null;
  registrationExpiry: string | null;
  driver: { fullName: string } | null;
}

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Hoạt động",
  MAINTENANCE: "Bảo dưỡng",
  DECOMMISSIONED: "Ngừng hoạt động",
  WAITING_DRIVER: "Chờ tài",
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "#10b981",
  MAINTENANCE: "#f59e0b",
  DECOMMISSIONED: "#94a3b8",
  WAITING_DRIVER: "#6366f1",
};

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("vi-VN");
}

function isExpiringSoon(d: string | null, days = 30) {
  if (!d) return false;
  const diff = new Date(d).getTime() - Date.now();
  return diff > 0 && diff < days * 86400 * 1000;
}

export default async function VehiclesPage() {
  let vehicles: VehicleRow[];

  try {
    vehicles = await serverFetch<VehicleRow[]>("/vehicles");
  } catch (err) {
    return (
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24 }}>Phương tiện</h1>
        <p style={{ color: "#dc2626", background: "#fef2f2", padding: "12px 16px", borderRadius: 8 }}>
          Không thể tải dữ liệu: {err instanceof Error ? err.message : "Lỗi không xác định"}
        </p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>Phương tiện</h1>
        <span style={{ fontSize: 13, color: "#64748b" }}>{vehicles.length} xe</span>
      </div>

      <div style={{ background: "#fff", borderRadius: 10, boxShadow: "0 1px 4px rgba(0,0,0,0.07)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
              {["Biển số", "Loại xe", "Tài xế", "Trạng thái", "Hạn đăng kiểm", "Hạn bảo hiểm", "Hạn cà vẹt"].map((h) => (
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
            {vehicles.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: 32, textAlign: "center", color: "#94a3b8" }}>
                  Không có dữ liệu
                </td>
              </tr>
            ) : (
              vehicles.map((v, i) => (
                <tr
                  key={v.id}
                  style={{
                    borderBottom: "1px solid #f1f5f9",
                    background: i % 2 === 0 ? "#fff" : "#fafafa",
                  }}
                >
                  <td style={{ padding: "10px 16px", fontFamily: "monospace", fontSize: 13, fontWeight: 600 }}>
                    {v.licensePlate}
                  </td>
                  <td style={{ padding: "10px 16px", fontSize: 13 }}>{v.vehicleType}</td>
                  <td style={{ padding: "10px 16px", fontSize: 13 }}>
                    {v.driver?.fullName ?? <span style={{ color: "#94a3b8" }}>Chưa có tài</span>}
                  </td>
                  <td style={{ padding: "10px 16px" }}>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "2px 10px",
                        borderRadius: 12,
                        fontSize: 12,
                        fontWeight: 500,
                        background: `${STATUS_COLORS[v.status] ?? "#94a3b8"}18`,
                        color: STATUS_COLORS[v.status] ?? "#94a3b8",
                      }}
                    >
                      {STATUS_LABELS[v.status] ?? v.status}
                    </span>
                  </td>
                  {[v.inspectionExpiry, v.insuranceExpiry, v.registrationExpiry].map((d, idx) => (
                    <td
                      key={idx}
                      style={{
                        padding: "10px 16px",
                        fontSize: 13,
                        color: isExpiringSoon(d) ? "#f59e0b" : "#374151",
                        fontWeight: isExpiringSoon(d) ? 600 : 400,
                      }}
                    >
                      {formatDate(d)}
                      {isExpiringSoon(d) && (
                        <span style={{ marginLeft: 4, fontSize: 11 }}>⚠️</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
