import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AuthProvider } from "@/lib/auth-context";
import { AUTH_COOKIE_NAME } from "@/lib/auth-cookie";
import { NavSidebar } from "@/components/nav-sidebar";

export default async function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    redirect("/login");
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
