import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME } from "@/lib/auth-cookie";

const API_BASE = process.env.API_BASE_URL ?? "http://localhost:4000/api/v1";

export async function GET(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const apiRes = await fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    if (!apiRes.ok) {
      return NextResponse.json({ message: "Unauthorized" }, { status: apiRes.status });
    }

    return NextResponse.json(await apiRes.json());
  } catch (err) {
    console.error("[auth/me] upstream fetch failed:", err);
    return NextResponse.json({ message: "Service unavailable" }, { status: 502 });
  }
}
