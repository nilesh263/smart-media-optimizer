import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Smart Media Optimizer AI",
  description: "AI-powered compression for images, videos, PDFs and GIFs",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, background: "#08090F" }}>
        {children}
      </body>
    </html>
  );
}
