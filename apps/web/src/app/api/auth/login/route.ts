import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.API_BASE_URL ?? "http://localhost:4000/api/v1";

export async function POST(request: NextRequest) {
  const body = await request.json();

  const apiRes = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!apiRes.ok) {
    return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
  }

  const { access_token } = (await apiRes.json()) as { access_token: string };

  const response = NextResponse.json({ success: true });
  response.cookies.set("tms_token", access_token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: false,
    maxAge: 604800,
  });

  return response;
}
