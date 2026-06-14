import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { jwtVerify } from "jose";
import { AuthProvider } from "@/lib/auth-context";
import { NavSidebar } from "@/components/nav-sidebar";

export default async function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get("tms_token")?.value;

  if (!token) {
    redirect("/login");
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? "change-me-in-production");
    await jwtVerify(token, secret);
  } catch {
    redirect("/api/auth/logout-redirect");
  }

  return (
    <AuthProvider>
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <NavSidebar />
        <main style={{ flex: 1, padding: 32, overflow: "auto" }}>{children}</main>
      </div>
    </AuthProvider>
  );
}
