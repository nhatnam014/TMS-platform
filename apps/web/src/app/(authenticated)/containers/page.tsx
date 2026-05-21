"use client";

import { useEffect, useState } from "react";

type ContainerStatus =
  | "EMPTY_AVAILABLE"
  | "EMPTY_IN_TRANSIT"
  | "EMPTY_AT_YARD"
  | "BEING_LOADED"
  | "LOADED_READY"
  | "LOADED_IN_TRANSIT"
  | "DELIVERED";

interface ContainerRow {
  id: string;
  containerNumber: string;
  sizeType: string;
  status: ContainerStatus;
  factoryZone: string | null;
  currentLocation: { id: string; code: string; name: string } | null;
}

const STATUS_LABELS: Record<ContainerStatus, string> = {
  EMPTY_AVAILABLE: "Rỗng - Sẵn sàng",
  EMPTY_IN_TRANSIT: "Rỗng - Đang vận chuyển",
  EMPTY_AT_YARD: "Rỗng - Tại bãi",
  BEING_LOADED: "Đang đóng hàng",
  LOADED_READY: "Đã đóng - Sẵn sàng",
  LOADED_IN_TRANSIT: "Có hàng - Đang vận chuyển",
  DELIVERED: "Đã giao",
};

const STATUS_COLORS: Record<ContainerStatus, { bg: string; color: string }> = {
  EMPTY_AVAILABLE: { bg: "#f1f5f9", color: "#64748b" },
  EMPTY_IN_TRANSIT: { bg: "#e2e8f0", color: "#475569" },
  EMPTY_AT_YARD: { bg: "#fef9c3", color: "#854d0e" },
  BEING_LOADED: { bg: "#ffedd5", color: "#c2410c" },
  LOADED_READY: { bg: "#dcfce7", color: "#166534" },
  LOADED_IN_TRANSIT: { bg: "#dbeafe", color: "#1d4ed8" },
  DELIVERED: { bg: "#f8fafc", color: "#94a3b8" },
};

const ALL_STATUSES: ContainerStatus[] = [
  "EMPTY_AVAILABLE",
  "EMPTY_IN_TRANSIT",
  "EMPTY_AT_YARD",
  "BEING_LOADED",
  "LOADED_READY",
  "LOADED_IN_TRANSIT",
  "DELIVERED",
];

function StatusBadge({ status }: { status: ContainerStatus }) {
  const { bg, color } = STATUS_COLORS[status] ?? { bg: "#f1f5f9", color: "#64748b" };
  return (
    <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 4, background: bg, color, whiteSpace: "nowrap" }}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

export default function ContainersPage() {
  const [containers, setContainers] = useState<ContainerRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<ContainerStatus | "">("");

  function fetchContainers(status: ContainerStatus | "") {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ limit: "100" });
    if (status) params.set("status", status);
    fetch(`/api/containers?${params}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`API error ${res.status}`);
        const data: ContainerRow[] = await res.json();
        setContainers(data);
        setTotal(data.length);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Lỗi không xác định"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchContainers("");
  }, []);

  function handleStatusChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value as ContainerStatus | "";
    setStatusFilter(val);
    fetchContainers(val);
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>Container</h1>
        <span style={{ fontSize: 13, color: "#64748b" }}>{total} container</span>
      </div>

      {/* Filter bar */}
      <div style={{ marginBottom: 16, display: "flex", gap: 12, alignItems: "center" }}>
        <label style={{ fontSize: 13, color: "#64748b" }}>Trạng thái:</label>
        <select
          value={statusFilter}
          onChange={handleStatusChange}
          style={{ fontSize: 13, padding: "6px 10px", borderRadius: 6, border: "1px solid #e2e8f0", background: "#fff", color: "#0f172a" }}
        >
          <option value="">Tất cả</option>
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>
      </div>

      {error && (
        <p style={{ color: "#dc2626", background: "#fef2f2", padding: "12px 16px", borderRadius: 8, marginBottom: 16 }}>{error}</p>
      )}

      <div style={{ background: "#fff", borderRadius: 10, boxShadow: "0 1px 4px rgba(0,0,0,0.07)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
              {["Số Container", "Loại", "Trạng thái", "Vị trí hiện tại", "Khu vực"].map((h) => (
                <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ padding: 32, textAlign: "center", color: "#94a3b8" }}>Đang tải...</td></tr>
            ) : containers.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: 32, textAlign: "center", color: "#94a3b8" }}>Không có dữ liệu</td></tr>
            ) : (
              containers.map((c, i) => (
                <tr key={c.id} style={{ borderBottom: "1px solid #f1f5f9", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                  <td style={{ padding: "10px 14px", fontSize: 13, fontWeight: 600, fontFamily: "monospace" }}>{c.containerNumber}</td>
                  <td style={{ padding: "10px 14px", fontSize: 12, color: "#64748b" }}>{c.sizeType}</td>
                  <td style={{ padding: "10px 14px" }}><StatusBadge status={c.status} /></td>
                  <td style={{ padding: "10px 14px", fontSize: 13 }}>{c.currentLocation?.name ?? "—"}</td>
                  <td style={{ padding: "10px 14px", fontSize: 12, color: "#64748b", fontFamily: "monospace" }}>{c.factoryZone ?? "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
