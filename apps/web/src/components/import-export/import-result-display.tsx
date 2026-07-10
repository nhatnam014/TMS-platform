"use client";

import { useState } from "react";
import type { ImportResult, ImportChangedRecord, ImportCreatedRecord } from "@tms/shared";

export function ImportResultDisplay({
  result,
  error,
}: {
  result: ImportResult | null;
  error: string | null;
}) {
  const [showChangedPopup, setShowChangedPopup] = useState(false);
  const [showCreatedPopup, setShowCreatedPopup] = useState(false);

  return (
    <>
      {error && (
        <div
          style={{
            marginTop: 14,
            padding: "10px 14px",
            background: "#fef2f2",
            borderRadius: 6,
            color: "#dc2626",
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}
      {result && (
        <div style={{ marginTop: 14 }}>
          <div
            style={{
              padding: "10px 14px",
              background: "#f0fdf4",
              borderRadius: 6,
              color: "#166534",
              fontSize: 13,
              fontWeight: 600,
              marginBottom: result.warnings.length || result.errors.length ? 10 : 0,
            }}
          >
            Nhập thành công: {result.imported} tạo mới
            {result.updated ? `, ${result.updated} cập nhật` : ""}
          </div>
          {result.warnings.length > 0 && (
            <details style={{ marginBottom: 8 }}>
              <summary
                style={{
                  fontSize: 13,
                  color: "#92400e",
                  cursor: "pointer",
                  padding: "8px 12px",
                  background: "#fffbeb",
                  borderRadius: 6,
                }}
              >
                {result.warnings.length} cảnh báo (bấm để xem)
              </summary>
              <ul style={{ margin: "6px 0 0 0", paddingLeft: 20 }}>
                {result.warnings.map((w, i) => (
                  <li key={i} style={{ fontSize: 12, color: "#78350f", marginBottom: 3 }}>
                    {w}
                  </li>
                ))}
              </ul>
            </details>
          )}
          {result.errors.length > 0 && (
            <details style={{ marginBottom: result.changedRecords?.length ? 8 : 0 }}>
              <summary
                style={{
                  fontSize: 13,
                  color: "#991b1b",
                  cursor: "pointer",
                  padding: "8px 12px",
                  background: "#fef2f2",
                  borderRadius: 6,
                }}
              >
                {result.errors.length} lỗi bỏ qua (bấm để xem)
              </summary>
              <ul style={{ margin: "6px 0 0 0", paddingLeft: 20 }}>
                {result.errors.map((e, i) => (
                  <li key={i} style={{ fontSize: 12, color: "#7f1d1d", marginBottom: 3 }}>
                    {e}
                  </li>
                ))}
              </ul>
            </details>
          )}
          {result.createdRecords && result.createdRecords.length > 0 && (
            <button
              type="button"
              onClick={() => setShowCreatedPopup(true)}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                fontSize: 13,
                color: "#166534",
                cursor: "pointer",
                padding: "8px 12px",
                background: "#f0fdf4",
                borderRadius: 6,
                border: "none",
                marginBottom: result.changedRecords?.length ? 8 : 0,
              }}
            >
              {result.createdRecords.length} bản ghi mới tạo (bấm để xem)
            </button>
          )}
          {result.changedRecords && result.changedRecords.length > 0 && (
            <button
              type="button"
              onClick={() => setShowChangedPopup(true)}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                fontSize: 13,
                color: "#1d4ed8",
                cursor: "pointer",
                padding: "8px 12px",
                background: "#eff6ff",
                borderRadius: 6,
                border: "none",
              }}
            >
              {result.changedRecords.length} bản ghi đã thay đổi (bấm để xem)
            </button>
          )}
        </div>
      )}
      {result?.changedRecords && result.changedRecords.length > 0 && showChangedPopup && (
        <ChangedRecordsPopup
          changedRecords={result.changedRecords}
          onClose={() => setShowChangedPopup(false)}
        />
      )}
      {result?.createdRecords && result.createdRecords.length > 0 && showCreatedPopup && (
        <CreatedRecordsPopup
          createdRecords={result.createdRecords}
          onClose={() => setShowCreatedPopup(false)}
        />
      )}
    </>
  );
}

// ── ChangedRecordsPopup ───────────────────────────────────────────────────────

function ChangedRecordsPopup({
  changedRecords,
  onClose,
}: {
  changedRecords: ImportChangedRecord[];
  onClose: () => void;
}) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 60,
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 10,
          padding: 24,
          width: "min(95vw, 720px)",
          maxHeight: "80vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>
            {changedRecords.length} bản ghi đã thay đổi
          </h3>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: 22,
              cursor: "pointer",
              color: "#6b7280",
            }}
          >
            ×
          </button>
        </div>

        <div style={{ overflowY: "auto", flex: 1 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr>
                <th
                  style={{
                    textAlign: "left",
                    padding: "8px 10px",
                    borderBottom: "2px solid #e5e7eb",
                    background: "#f8fafc",
                    width: "30%",
                  }}
                >
                  Bản ghi
                </th>
                <th
                  style={{
                    textAlign: "left",
                    padding: "8px 10px",
                    borderBottom: "2px solid #e5e7eb",
                    background: "#f8fafc",
                  }}
                >
                  Thay đổi
                </th>
              </tr>
            </thead>
            <tbody>
              {changedRecords.map((rec, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #e5e7eb" }}>
                  <td style={{ padding: "8px 10px", verticalAlign: "top", fontWeight: 600 }}>
                    {rec.identifier}
                  </td>
                  <td style={{ padding: "8px 10px", verticalAlign: "top" }}>
                    {rec.changes.map((c, j) => (
                      <div key={j} style={{ marginBottom: 2 }}>
                        <strong>{c.field}</strong>: {String(c.oldValue ?? "—")} →{" "}
                        {String(c.newValue ?? "—")}
                      </div>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            borderTop: "1px solid #e5e7eb",
            paddingTop: 14,
            marginTop: 14,
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "8px 16px",
              border: "1px solid #d1d5db",
              borderRadius: 6,
              background: "#fff",
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

// ── CreatedRecordsPopup ───────────────────────────────────────────────────────

function CreatedRecordsPopup({
  createdRecords,
  onClose,
}: {
  createdRecords: ImportCreatedRecord[];
  onClose: () => void;
}) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 60,
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 10,
          padding: 24,
          width: "min(95vw, 560px)",
          maxHeight: "80vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>
            {createdRecords.length} bản ghi mới tạo
          </h3>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: 22,
              cursor: "pointer",
              color: "#6b7280",
            }}
          >
            ×
          </button>
        </div>

        <div style={{ overflowY: "auto", flex: 1 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr>
                <th
                  style={{
                    textAlign: "left",
                    padding: "8px 10px",
                    borderBottom: "2px solid #e5e7eb",
                    background: "#f8fafc",
                    width: "20%",
                  }}
                >
                  Hàng
                </th>
                <th
                  style={{
                    textAlign: "left",
                    padding: "8px 10px",
                    borderBottom: "2px solid #e5e7eb",
                    background: "#f8fafc",
                  }}
                >
                  Bản ghi
                </th>
              </tr>
            </thead>
            <tbody>
              {createdRecords.map((rec, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #e5e7eb" }}>
                  <td style={{ padding: "8px 10px", verticalAlign: "top", color: "#94a3b8" }}>
                    {rec.rowNum}
                  </td>
                  <td style={{ padding: "8px 10px", verticalAlign: "top", fontWeight: 600 }}>
                    {rec.identifier}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            borderTop: "1px solid #e5e7eb",
            paddingTop: 14,
            marginTop: 14,
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "8px 16px",
              border: "1px solid #d1d5db",
              borderRadius: 6,
              background: "#fff",
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
