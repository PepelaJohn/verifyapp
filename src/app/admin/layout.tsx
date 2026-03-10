import type { Metadata } from "next";

export const metadata: Metadata = { title: "License Admin" };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div style={{ minHeight: "100vh", background: "#f0f2f5" }}>{children}</div>;
}
