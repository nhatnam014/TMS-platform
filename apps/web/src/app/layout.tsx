import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "@/lib/toast-context";
import { Toaster } from "@/components/toaster";

export const metadata: Metadata = {
  title: "TMS Platform",
  description: "Transportation Management System",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>
        <ToastProvider>
          <Toaster />
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
