import type { Metadata } from "next";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next"
export const metadata: Metadata = {
  title: "License Admin",
  description: "Chatbot License Management",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <>
        {children}
        <Analytics/>
        </>
        </body>
        
    </html>
  );
}
