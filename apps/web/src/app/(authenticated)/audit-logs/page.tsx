"use client";

import { useEffect, useState } from "react";
import type { PaginatedResponse } from "@tms/shared";
import { formatDateTime } from "@/lib/date-utils";

interface AuditLogRow {
  id: string;
  createdAt: string;
  actorUsername: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  summary: string;
}

const PAGE_SIZE_AL = 10;

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    const params = new URLSearchParams();
    params.set("limit", String(PAGE_SIZE_AL));
    params.set("page", String(page));
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    fetch(`/api/audit-logs?${params.toString()}`)
      .then(async (res) => {
        if (res.status === 403) {
          setForbidden(true);
          return;
        }
        if (!res.ok) throw new Error(`API error ${res.status}`);
        const data: PaginatedResponse<AuditLogRow> = await res.json();
        setLogs(data.data);
        setTotal(data.meta.total);
        setTotalPages(data.meta.totalPages);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Lỗi không xác định"))
      .finally(() => setLoading(false));
  }, [page, dateFrom, dateTo]);

  if (loading)
    return (
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24 }}>Nhật ký kiểm tra</h1>
        <p style={{ color: "#64748b" }}>Đang tải...</p>
      </div>
    );

  if (forbidden)
    return (
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24 }}>Nhật ký kiểm tra</h1>
        <p
          style={{ color: "#dc2626", background: "#fef2f2", padding: "12px 16px", borderRadius: 8 }}
        >
          Bạn không có quyền truy cập trang này. Chỉ quản trị viên (Admin) mới được xem nhật ký kiểm
          tra.
        </p>
      </div>
    );

  if (error)
    return (
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24 }}>Nhật ký kiểm tra</h1>
        <p
          style={{ color: "#dc2626", background: "#fef2f2", padding: "12px 16px", borderRadius: 8 }}
        >
          {error}
        </p>
      </div>
    );

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 24,
        }}
      >
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>Nhật ký kiểm tra</h1>
        <span style={{ fontSize: 13, color: "#64748b" }}>
          {total === 0
            ? "0 bản ghi"
            : `${(page - 1) * PAGE_SIZE_AL + 1}–${Math.min(page * PAGE_SIZE_AL, total)} / ${total}`}
        </span>
      </div>

      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 16,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <span style={{ fontSize: 13, color: "#64748b", whiteSpace: "nowrap" }}>Từ ngày</span>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => {
            setDateFrom(e.target.value);
            setPage(1);
          }}
          style={{
            padding: "7px 10px",
            border: "1px solid #e2e8f0",
            borderRadius: 6,
            fontSize: 13,
          }}
        />
        <span style={{ fontSize: 13, color: "#64748b", whiteSpace: "nowrap" }}>Đến ngày</span>
        <input
          type="date"
          value={dateTo}
          onChange={(e) => {
            setDateTo(e.target.value);
            setPage(1);
          }}
          style={{
            padding: "7px 10px",
            border: "1px solid #e2e8f0",
            borderRadius: 6,
            fontSize: 13,
          }}
        />
      </div>

      <div
        style={{
          background: "#fff",
          borderRadius: 10,
          boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
          overflow: "hidden",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
              {[
                "Thời gian",
                "Người dùng",
                "Hành động",
                "Loại đối tượng",
                "ID đối tượng",
                "Mô tả",
              ].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: "10px 14px",
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
            {logs.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: 32, textAlign: "center", color: "#94a3b8" }}>
                  Không có dữ liệu
                </td>
              </tr>
            ) : (
              logs.map((log, i) => (
                <tr
                  key={log.id}
                  style={{
                    borderBottom: "1px solid #f1f5f9",
                    background: i % 2 === 0 ? "#fff" : "#fafafa",
                  }}
                >
                  <td
                    style={{
                      padding: "10px 14px",
                      fontSize: 12,
                      color: "#64748b",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {formatDateTime(log.createdAt)}
                  </td>
                  <td style={{ padding: "10px 14px", fontSize: 13, fontWeight: 500 }}>
                    {log.actorUsername ?? "—"}
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        padding: "2px 8px",
                        borderRadius: 4,
                        background: "#f1f5f9",
                        color: "#475569",
                        fontFamily: "monospace",
                      }}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td style={{ padding: "10px 14px", fontSize: 12, color: "#64748b" }}>
                    {log.entityType}
                  </td>
                  <td
                    style={{
                      padding: "10px 14px",
                      fontSize: 11,
                      fontFamily: "monospace",
                      color: "#94a3b8",
                      maxWidth: 120,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {log.entityId ?? "—"}
                  </td>
                  <td style={{ padding: "10px 14px", fontSize: 13 }}>{log.summary}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {totalPages > 1 && (
          <div
            style={{ padding: "10px 14px", display: "flex", justifyContent: "flex-end", gap: 4 }}
          >
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{
                padding: "4px 10px",
                border: "1px solid #d1d5db",
                borderRadius: 5,
                background: page === 1 ? "#f1f5f9" : "#fff",
                cursor: page === 1 ? "default" : "pointer",
                fontSize: 13,
              }}
            >
              ‹
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
              .reduce<(number | "…")[]>((acc, p, i, arr) => {
                if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("…");
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                p === "…" ? (
                  <span
                    key={`e${i}`}
                    style={{ padding: "4px 6px", fontSize: 13, color: "#94a3b8" }}
                  >
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p as number)}
                    style={{
                      padding: "4px 10px",
                      border: "1px solid #d1d5db",
                      borderRadius: 5,
                      background: p === page ? "#3b82f6" : "#fff",
                      color: p === page ? "#fff" : "#374151",
                      cursor: "pointer",
                      fontSize: 13,
                    }}
                  >
                    {p}
                  </button>
                ),
              )}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              style={{
                padding: "4px 10px",
                border: "1px solid #d1d5db",
                borderRadius: 5,
                background: page === totalPages ? "#f1f5f9" : "#fff",
                cursor: page === totalPages ? "default" : "pointer",
                fontSize: 13,
              }}
            >
              ›
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
