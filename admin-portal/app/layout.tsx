import type { Metadata } from "next";
import "./globals.css";

export const runtime = "nodejs";

export const metadata: Metadata = {
  title: "ZARI Operations",
  description: "Private operations portal for ZARI Rugs.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
