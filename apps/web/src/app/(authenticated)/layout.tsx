import { AuthProvider } from "@/lib/auth-context";
import { NavSidebar } from "@/components/nav-sidebar";

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <NavSidebar />
        <main style={{ flex: 1, padding: 32, overflow: "auto" }}>{children}</main>
      </div>
    </AuthProvider>
  );
}
