"use client";

import { useToast } from "@/lib/toast-context";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const toast = useToast();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const username = form.get("username") as string;
    const password = form.get("password") as string;

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        const msg =
          res.status === 401
            ? "Tên đăng nhập hoặc mật khẩu không đúng"
            : "Không thể kết nối máy chủ. Vui lòng thử lại.";
        setError(msg);
        toast.error(msg);
        return;
      }

      toast.success("Đăng nhập thành công");
      router.replace("/dashboard");
    } catch (err) {
      const msg = "Không thể kết nối máy chủ. Vui lòng thử lại.";
      console.error("Login error: ", err);
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f1f5f9",
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          padding: 40,
          width: 360,
          boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
        }}
      >
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8, color: "#0f172a" }}>
          Anh Khôi Logistic
        </h1>
        <p style={{ color: "#64748b", marginBottom: 28, fontSize: 14 }}>Hệ thống quản lý vận tải</p>

        <form onSubmit={handleSubmit}>
          <label style={{ display: "block", marginBottom: 16 }}>
            <span
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: "#374151",
                display: "block",
                marginBottom: 6,
              }}
            >
              Tên đăng nhập
            </span>
            <input
              name="username"
              type="text"
              required
              autoComplete="username"
              style={{
                width: "100%",
                padding: "9px 12px",
                border: "1px solid #d1d5db",
                borderRadius: 8,
                fontSize: 14,
                outline: "none",
              }}
            />
          </label>

          <label style={{ display: "block", marginBottom: 24 }}>
            <span
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: "#374151",
                display: "block",
                marginBottom: 6,
              }}
            >
              Mật khẩu
            </span>
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              style={{
                width: "100%",
                padding: "9px 12px",
                border: "1px solid #d1d5db",
                borderRadius: 8,
                fontSize: 14,
                outline: "none",
              }}
            />
          </label>

          {error && (
            <p
              style={{
                color: "#dc2626",
                fontSize: 13,
                marginBottom: 16,
                padding: "8px 12px",
                background: "#fef2f2",
                borderRadius: 6,
              }}
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "10px",
              background: loading ? "#93c5fd" : "#2563eb",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              transition: "background 0.15s",
            }}
          >
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
        </form>
      </div>
    </div>
  );
}
