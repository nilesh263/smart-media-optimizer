import type { Metadata } from "next";
import "./globals.css";
import AuthProvider from "./auth-provider";

export const metadata: Metadata = {
  title: "MediaOptimizer AI — Compress Without Quality Loss",
  description: "AI-powered media optimization for images, videos, PDFs and GIFs",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
