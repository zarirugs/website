import type { Metadata } from "next";
import { Cormorant_Garamond, Inter, Prata } from "next/font/google";
import { StoreProvider } from "@/components/store";
import "./globals.css";

export const runtime = "nodejs";

const display = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["300", "400", "500", "600", "700"],
});

const body = Inter({
  subsets: ["latin"],
  variable: "--font-body",
});

const wordmark = Prata({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-wordmark",
});

export const metadata: Metadata = {
  title: {
    default: "Zari Rugs | India",
    template: "%s | ZARI",
  },
  description:
    "Luxury hand-knotted rugs from Bhadohi. Crafted by generations of master artisans using the world's finest natural fibres.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} ${wordmark.variable}`}
    >
      <body><StoreProvider>{children}</StoreProvider></body>
    </html>
  );
}
