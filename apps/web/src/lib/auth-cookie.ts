import type { NextRequest } from "next/server";

export const AUTH_COOKIE_NAME = "tms_token";
export const AUTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

function getConfiguredSecureCookie() {
  const value = process.env.AUTH_COOKIE_SECURE?.toLowerCase();

  if (value === "true") return true;
  if (value === "false") return false;
  return null;
}

export function isSecureRequest(request: NextRequest) {
  const configuredSecureCookie = getConfiguredSecureCookie();
  if (configuredSecureCookie !== null) return configuredSecureCookie;

  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  return forwardedProto === "https" || request.nextUrl.protocol === "https:";
}

export function authCookieOptions(request: NextRequest) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    secure: isSecureRequest(request),
  };
}
