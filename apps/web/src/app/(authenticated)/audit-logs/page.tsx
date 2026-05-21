"use client";

import { useEffect, useState } from "react";
import type { PaginatedResponse } from "@tms/shared";

interface AuditLogRow {
  id: string;
  createdAt: string;
  actorUsername: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  summary: string;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/audit-logs?limit=50")
      .then(async (res) => {
        if (res.status === 403) { setForbidden(true); return; }
        if (!res.ok) throw new Error(`API error ${res.status}`);
        const data: PaginatedResponse<AuditLogRow> = await res.json();
        setLogs(data.data);
        setTotal(data.meta.total);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Lỗi không xác định"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div><h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24 }}>Nhật ký kiểm tra</h1><p style={{ color: "#64748b" }}>Đang tải...</p></div>;

  if (forbidden) return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24 }}>Nhật ký kiểm tra</h1>
      <p style={{ color: "#dc2626", background: "#fef2f2", padding: "12px 16px", borderRadius: 8 }}>
        Bạn không có quyền truy cập trang này. Chỉ quản trị viên (Admin) mới được xem nhật ký kiểm tra.
      </p>
    </div>
  );

  if (error) return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24 }}>Nhật ký kiểm tra</h1>
      <p style={{ color: "#dc2626", background: "#fef2f2", padding: "12px 16px", borderRadius: 8 }}>{error}</p>
    </div>
  );

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>Nhật ký kiểm tra</h1>
        <span style={{ fontSize: 13, color: "#64748b" }}>{total} bản ghi</span>
      </div>

      <div style={{ background: "#fff", borderRadius: 10, boxShadow: "0 1px 4px rgba(0,0,0,0.07)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
              {["Thời gian", "Người dùng", "Hành động", "Loại đối tượng", "ID đối tượng", "Mô tả"].map((h) => (
                <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: 32, textAlign: "center", color: "#94a3b8" }}>Không có dữ liệu</td></tr>
            ) : (
              logs.map((log, i) => (
                <tr key={log.id} style={{ borderBottom: "1px solid #f1f5f9", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                  <td style={{ padding: "10px 14px", fontSize: 12, color: "#64748b", whiteSpace: "nowrap" }}>
                    {new Date(log.createdAt).toLocaleString("vi-VN")}
                  </td>
                  <td style={{ padding: "10px 14px", fontSize: 13, fontWeight: 500 }}>{log.actorUsername ?? "—"}</td>
                  <td style={{ padding: "10px 14px" }}>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 4, background: "#f1f5f9", color: "#475569", fontFamily: "monospace" }}>
                      {log.action}
                    </span>
                  </td>
                  <td style={{ padding: "10px 14px", fontSize: 12, color: "#64748b" }}>{log.entityType}</td>
                  <td style={{ padding: "10px 14px", fontSize: 11, fontFamily: "monospace", color: "#94a3b8", maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis" }}>
                    {log.entityId ?? "—"}
                  </td>
                  <td style={{ padding: "10px 14px", fontSize: 13 }}>{log.summary}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
