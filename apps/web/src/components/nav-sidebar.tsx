"use client";

import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import { usePathname } from "next/navigation";

const BASE_NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/trip-plans", label: "Kế hoạch chuyến" },
  { href: "/vehicles", label: "Phương tiện" },
  { href: "/vehicle-records", label: "Quản lý xe" },
  { href: "/drivers", label: "Tài xế" },
  { href: "/yard-moves", label: "Lệnh bãi" },
  { href: "/customers", label: "Khách hàng" },
  { href: "/carriers", label: "VENDOR" },
  { href: "/locations", label: "Địa điểm" },
  { href: "/service-types", label: "Loại dịch vụ" },
  { href: "/container-sizes", label: "Size cont" },
  { href: "/cost-templates", label: "Danh mục chi phí" },
];

export function NavSidebar() {
  const pathname = usePathname();
  const { role } = useAuth();

  const navItems = [
    ...BASE_NAV_ITEMS,
    ...(role === "ADMIN"
      ? [
          { href: "/audit-logs", label: "Nhật ký kiểm tra" },
          { href: "/users", label: "Người dùng" },
          { href: "/import-export", label: "Nhập / Xuất Excel" },
        ]
      : []),
  ];

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <aside
      style={{
        width: 220,
        minHeight: "100vh",
        background: "#1e293b",
        color: "#e2e8f0",
        display: "flex",
        flexDirection: "column",
        padding: "24px 0",
        flexShrink: 0,
      }}
    >
      <div style={{ padding: "0 20px 24px", fontSize: 16, fontWeight: 700, color: "#fff" }}>
        TMS Platform
      </div>

      <nav style={{ flex: 1 }}>
        {navItems.map(({ href, label }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: "block",
                padding: "10px 20px",
                background: active ? "#334155" : "transparent",
                color: active ? "#fff" : "#94a3b8",
                borderLeft: active ? "3px solid #3b82f6" : "3px solid transparent",
                transition: "background 0.15s",
              }}
            >
              {label}
            </Link>
          );
        })}
      </nav>

      <button
        onClick={handleLogout}
        style={{
          margin: "0 20px",
          padding: "8px 12px",
          background: "transparent",
          border: "1px solid #475569",
          borderRadius: 6,
          color: "#94a3b8",
          fontSize: 13,
        }}
      >
        Đăng xuất
      </button>
    </aside>
  );
}
