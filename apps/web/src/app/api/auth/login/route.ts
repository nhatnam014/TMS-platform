import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_MAX_AGE, AUTH_COOKIE_NAME, authCookieOptions } from "@/lib/auth-cookie";

const API_BASE = process.env.API_BASE_URL ?? "http://localhost:4000/api/v1";

export async function POST(request: NextRequest) {
  const body = await request.json();

  let apiRes: Response;
  try {
    apiRes = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
  } catch (err) {
    console.error("[auth/login] upstream fetch failed:", err);
    return NextResponse.json({ message: "Service unavailable" }, { status: 502 });
  }

  if (!apiRes.ok) {
    return NextResponse.json(
      { message: apiRes.status === 401 ? "Invalid credentials" : "Login service error" },
      { status: apiRes.status },
    );
  }

  const { access_token } = (await apiRes.json()) as { access_token: string };

  const response = NextResponse.json({ success: true });
  response.cookies.set(AUTH_COOKIE_NAME, access_token, {
    ...authCookieOptions(request),
    maxAge: AUTH_COOKIE_MAX_AGE,
  });

  return response;
}
