import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const token = request.cookies.get("tms_token")?.value;
  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString());
    return NextResponse.json({ id: payload.sub, username: payload.username, role: payload.role });
  } catch {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
}
