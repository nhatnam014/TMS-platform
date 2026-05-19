import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.API_BASE_URL ?? "http://localhost:4000/api/v1";

async function proxyRequest(request: NextRequest, path: string[]): Promise<NextResponse> {
  const token = request.cookies.get("tms_token")?.value;
  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const targetPath = path.join("/");
  const search = request.nextUrl.search;
  const url = `${API_BASE}/${targetPath}${search}`;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  };

  const contentType = request.headers.get("content-type");
  if (contentType) headers["Content-Type"] = contentType;

  const body = ["GET", "HEAD"].includes(request.method) ? undefined : await request.text();

  const apiRes = await fetch(url, {
    method: request.method,
    headers,
    body,
  });

  const responseBody = await apiRes.text();
  const responseContentType = apiRes.headers.get("content-type") ?? "application/json";

  return new NextResponse(responseBody, {
    status: apiRes.status,
    headers: { "Content-Type": responseContentType },
  });
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  return proxyRequest(request, path);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  return proxyRequest(request, path);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  return proxyRequest(request, path);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  return proxyRequest(request, path);
}
