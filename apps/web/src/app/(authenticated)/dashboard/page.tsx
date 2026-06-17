"use client";

import { useState, useEffect, useCallback } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis as XAxisH,
  YAxis as YAxisH,
} from "recharts";
import type { DashboardStats, TripsTrendItem } from "@tms/shared";

// ── Helpers ────────────────────────────────────────────────────────────────

function toIso(d: Date) {
  return d.toISOString().slice(0, 10);
}
function todayIso() {
  return toIso(new Date());
}
function plusDaysIso(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return toIso(d);
}
function formatDate(iso: string) {
  const [y, m, day] = iso.split("-");
  return `${day}/${m}/${y}`;
}
function formatDatetime(d: Date) {
  return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getFullYear()} ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

// ── Status config (Pie) ────────────────────────────────────────────────────

const STATUS_CONFIG = [
  { key: "WAITING", label: "Chờ điều xe", color: "#3b82f6" },
  { key: "IN_TRANSIT", label: "Đang vận chuyển", color: "#f59e0b" },
  { key: "COMPLETED", label: "Hoàn thành", color: "#22c55e" },
  { key: "CANCELLED", label: "Huỷ", color: "#94a3b8" },
];

// ── Sub-components ─────────────────────────────────────────────────────────

function StatCard({
  icon,
  iconBg,
  label,
  value,
  valueColor,
}: {
  icon: string;
  iconBg: string;
  label: string;
  value: number;
  valueColor?: string;
}) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 12,
        padding: "18px 20px",
        boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
        flex: "1 1 180px",
        minWidth: 160,
        display: "flex",
        alignItems: "center",
        gap: 16,
      }}
    >
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: 12,
          background: iconBg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 24,
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div>
        <p
          style={{
            fontSize: 11,
            color: "#64748b",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            marginBottom: 4,
          }}
        >
          {label}
        </p>
        <p style={{ fontSize: 32, fontWeight: 700, color: valueColor ?? "#0f172a", lineHeight: 1 }}>
          {value}
        </p>
      </div>
    </div>
  );
}

function ExpiryCard({ label, value }: { label: string; value: number }) {
  const bad = value > 0;
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 12,
        padding: "18px 20px",
        boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
        flex: "1 1 160px",
        minWidth: 140,
      }}
    >
      <p
        style={{
          fontSize: 11,
          color: "#64748b",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          marginBottom: 10,
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontSize: 36,
          fontWeight: 700,
          color: bad ? "#dc2626" : "#0f172a",
          marginBottom: 12,
        }}
      >
        {value}
      </p>
      <span
        style={{
          display: "inline-block",
          padding: "3px 10px",
          borderRadius: 6,
          fontSize: 12,
          fontWeight: 600,
          background: bad ? "#fee2e2" : "#dcfce7",
          color: bad ? "#dc2626" : "#16a34a",
        }}
      >
        {bad ? "Cần xử lý" : "Tốt"}
      </span>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [fromInput, setFromInput] = useState(plusDaysIso(-30));
  const [toInput, setToInput] = useState(todayIso());
  const [appliedFrom, setAppliedFrom] = useState(plusDaysIso(-30));
  const [appliedTo, setAppliedTo] = useState(todayIso());
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [trend, setTrend] = useState<TripsTrendItem[]>([]);

  const fetchAll = useCallback(async () => {
    const p = new URLSearchParams({
      tripFrom: appliedFrom,
      tripTo: appliedTo,
      expiryFrom: appliedFrom,
      expiryTo: appliedTo,
    });
    const [sRes, tRes] = await Promise.all([
      fetch(`/api/dashboard/stats?${p}`),
      fetch(`/api/dashboard/trips-trend?from=${appliedFrom}&to=${appliedTo}`),
    ]);
    if (sRes.ok) setStats(await sRes.json());
    if (tRes.ok) setTrend(await tRes.json());
    setLastUpdated(new Date());
  }, [appliedFrom, appliedTo]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const applyFilter = () => {
    setAppliedFrom(fromInput);
    setAppliedTo(toInput);
  };

  // Derived data
  const total = stats?.totalTrips ?? 0;
  const pieRows = STATUS_CONFIG.map((s) => ({
    ...s,
    value:
      s.key === "WAITING"
        ? (stats?.tripsWaiting ?? 0)
        : s.key === "IN_TRANSIT"
          ? (stats?.tripsInTransit ?? 0)
          : s.key === "COMPLETED"
            ? (stats?.tripsCompleted ?? 0)
            : (stats?.tripsCancelled ?? 0),
  }));
  const pieActive = pieRows.filter((d) => d.value > 0);

  const barData = [
    { name: "Đăng kiểm xe", value: stats?.expiringDangKiemXe ?? 0 },
    { name: "Đăng kiểm mooc", value: stats?.expiringDangKiemMooc ?? 0 },
    { name: "Cà vẹt xe", value: stats?.expiringCaVetXe ?? 0 },
    { name: "Cà vẹt mooc", value: stats?.expiringCaVetMooc ?? 0 },
  ];

  // Dominant status label for pie footer
  const dominant = pieRows.reduce((a, b) => (b.value > a.value ? b : a), pieRows[0]);
  const dominantPct = total > 0 ? Math.round((dominant.value / total) * 100) : 0;

  const inputStyle: React.CSSProperties = {
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    padding: "7px 12px",
    fontSize: 13,
    color: "#0f172a",
    background: "#fff",
  };
  const box: React.CSSProperties = {
    background: "#fff",
    borderRadius: 12,
    padding: "20px 24px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
  };
  const sectionTitle = (text: string) => (
    <h2
      style={{
        fontSize: 13,
        fontWeight: 700,
        color: "#475569",
        marginBottom: 14,
        textTransform: "uppercase",
        letterSpacing: "0.07em",
      }}
    >
      {text}
    </h2>
  );
  const emptyMsg = (
    <p style={{ color: "#94a3b8", fontSize: 13, textAlign: "center", padding: "40px 0" }}>
      Không có dữ liệu trong khoảng thời gian này
    </p>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* ── Page header ─────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0f172a" }}>Dashboard</h1>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 12, color: "#94a3b8" }}>
            Cập nhật: {formatDatetime(lastUpdated)}
          </span>
          <button
            onClick={fetchAll}
            title="Làm mới"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#64748b",
              fontSize: 18,
              padding: 4,
            }}
          >
            ↺
          </button>
        </div>
      </div>

      {/* ── Unified date filter ──────────────────────────────────────── */}
      <div style={{ ...box, padding: "14px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <span style={{ fontSize: 14 }}>📅</span>
          <span style={{ fontSize: 13, color: "#475569", fontWeight: 500 }}>Từ</span>
          <input
            type="date"
            value={fromInput}
            onChange={(e) => setFromInput(e.target.value)}
            style={inputStyle}
          />
          <span style={{ fontSize: 13, color: "#475569", fontWeight: 500 }}>Đến</span>
          <input
            type="date"
            value={toInput}
            onChange={(e) => setToInput(e.target.value)}
            style={inputStyle}
          />
          <button
            onClick={applyFilter}
            style={{
              marginLeft: "auto",
              padding: "7px 18px",
              borderRadius: 8,
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              color: "#475569",
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            ⚙ Bộ lọc
          </button>
        </div>
      </div>

      {/* ── TỔNG QUAN VẬN HÀNH ──────────────────────────────────────── */}
      <div>
        {sectionTitle("Tổng quan vận hành")}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          <StatCard
            icon="👥"
            iconBg="#eff6ff"
            label="Tổng chuyến"
            value={stats?.totalTrips ?? 0}
            valueColor="#0f172a"
          />
          <StatCard
            icon="⏰"
            iconBg="#fff7ed"
            label="Xe đang chờ"
            value={stats?.tripsWaiting ?? 0}
            valueColor="#ea580c"
          />
          <StatCard
            icon="🚛"
            iconBg="#eff6ff"
            label="Đang vận chuyển"
            value={stats?.tripsInTransit ?? 0}
            valueColor="#2563eb"
          />
          <StatCard
            icon="🚌"
            iconBg="#f0fdf4"
            label="Xe đang hoạt động"
            value={stats?.vehiclesActive ?? 0}
            valueColor="#16a34a"
          />
        </div>
      </div>

      {/* ── CẦN XỬ LÝ HÔM NAY ──────────────────────────────────────── */}
      <div
        style={{
          background: "#fffbeb",
          border: "1px solid #fde68a",
          borderRadius: 12,
          padding: "18px 24px",
        }}
      >
        {sectionTitle("Cần xử lý hôm nay")}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: "#fee2e2",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
              }}
            >
              ⚠️
            </div>
            <div>
              <p style={{ fontSize: 28, fontWeight: 700, color: "#dc2626", lineHeight: 1 }}>
                {stats?.expiringDangKiemXe ?? 0}
              </p>
              <p style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>Xe hết hạn đăng kiểm</p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: "#fef3c7",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
              }}
            >
              ⚠️
            </div>
            <div>
              <p style={{ fontSize: 28, fontWeight: 700, color: "#d97706", lineHeight: 1 }}>
                {stats?.expiringDangKiemMooc ?? 0}
              </p>
              <p style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>Mooc hết hạn đăng kiểm</p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: "#eff6ff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
              }}
            >
              🚛
            </div>
            <div>
              <p style={{ fontSize: 28, fontWeight: 700, color: "#2563eb", lineHeight: 1 }}>
                {stats?.tripsWaiting ?? 0}
              </p>
              <p style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                Chuyến đang chờ điều xe
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── CẢNH BÁO HỒ SƠ ─────────────────────────────────────────── */}
      <div>
        {sectionTitle("Cảnh báo hồ sơ (sắp hết hạn)")}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          <ExpiryCard label="Hết hạn ĐK xe" value={stats?.expiringDangKiemXe ?? 0} />
          <ExpiryCard label="Hết hạn Cà vẹt xe" value={stats?.expiringCaVetXe ?? 0} />
          <ExpiryCard label="Hết hạn ĐK mooc" value={stats?.expiringDangKiemMooc ?? 0} />
          <ExpiryCard label="Hết hạn Cà vẹt mooc" value={stats?.expiringCaVetMooc ?? 0} />
        </div>
      </div>

      {/* ── XU HƯỚNG CHUYẾN XE (Line chart, full width) ─────────────── */}
      <div style={box}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 14,
          }}
        >
          {sectionTitle("Xu hướng chuyến xe")}
          <span
            style={{
              fontSize: 12,
              color: "#64748b",
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: 6,
              padding: "4px 10px",
            }}
          >
            Theo ngày ▾
          </span>
        </div>
        {trend.length === 0 ? (
          emptyMsg
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip
                formatter={(v) => [`${v} chuyến`, "Số chuyến"]}
                labelFormatter={(l) => formatDate(l)}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Bottom: Horizontal Bar + Donut ──────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Horizontal Bar — expiry breakdown */}
        <div style={box}>
          {sectionTitle("Sắp hết hạn theo loại")}
          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              layout="vertical"
              data={barData}
              margin={{ top: 4, right: 40, left: 8, bottom: 4 }}
            >
              <XAxisH type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
              <YAxisH type="category" dataKey="name" tick={{ fontSize: 12 }} width={110} />
              <Tooltip formatter={(v) => [`${v} xe/mooc`, "Số lượng"]} />
              <Bar
                dataKey="value"
                fill="#ef4444"
                radius={[0, 4, 4, 0]}
                label={{ position: "right", fontSize: 12, fill: "#475569" }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Donut — trip status */}
        <div style={box}>
          {sectionTitle("Phân bố trạng thái")}
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {/* Donut with center text */}
            <div style={{ position: "relative", flex: "0 0 200px" }}>
              <ResponsiveContainer width={200} height={200}>
                <PieChart>
                  {pieActive.length === 0 ? (
                    <Pie
                      data={[{ value: 1 }]}
                      innerRadius={65}
                      outerRadius={90}
                      dataKey="value"
                      startAngle={90}
                      endAngle={-270}
                    >
                      <Cell fill="#e2e8f0" />
                    </Pie>
                  ) : (
                    <Pie
                      data={pieActive}
                      innerRadius={65}
                      outerRadius={90}
                      dataKey="value"
                      startAngle={90}
                      endAngle={-270}
                    >
                      {pieActive.map((e) => (
                        <Cell key={e.key} fill={e.color} />
                      ))}
                    </Pie>
                  )}
                </PieChart>
              </ResponsiveContainer>
              {/* Center overlay */}
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  textAlign: "center",
                  pointerEvents: "none",
                }}
              >
                <p
                  style={{
                    fontSize: 28,
                    fontWeight: 700,
                    color: "#0f172a",
                    margin: 0,
                    lineHeight: 1,
                  }}
                >
                  {total}
                </p>
                <p
                  style={{
                    fontSize: 11,
                    color: "#64748b",
                    margin: "4px 0 0",
                    whiteSpace: "nowrap",
                  }}
                >
                  Tổng chuyến
                </p>
              </div>
            </div>

            {/* Custom legend */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
              {pieRows.map((s) => {
                const pct = total > 0 ? Math.round((s.value / total) * 100) : 0;
                return (
                  <div
                    key={s.key}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 8,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          background: s.color,
                          display: "inline-block",
                          flexShrink: 0,
                        }}
                      />
                      <span style={{ fontSize: 13, color: "#475569" }}>{s.label}</span>
                    </div>
                    <span
                      style={{
                        fontSize: 13,
                        color: "#0f172a",
                        fontWeight: 500,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {s.value} ({pct}%)
                    </span>
                  </div>
                );
              })}
              {dominantPct > 0 && (
                <div
                  style={{
                    marginTop: 8,
                    background: "#eff6ff",
                    borderRadius: 6,
                    padding: "6px 10px",
                    fontSize: 12,
                    color: "#1d4ed8",
                    fontWeight: 500,
                  }}
                >
                  {dominantPct}% chuyến {dominant.label.toLowerCase()}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Footer note ─────────────────────────────────────────────── */}
      <div
        style={{
          background: "#eff6ff",
          borderRadius: 8,
          padding: "10px 16px",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span style={{ fontSize: 14 }}>ℹ️</span>
        <span style={{ fontSize: 13, color: "#1d4ed8" }}>
          Số liệu được thống kê trong khoảng thời gian đã chọn.
        </span>
      </div>
    </div>
  );
}
