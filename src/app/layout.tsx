import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "License Admin",
  description: "Chatbot License Management",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
