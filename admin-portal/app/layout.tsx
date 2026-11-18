import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const display = localFont({
  src: "./fonts/cormorantgaramond-latin.woff2",
  variable: "--font-display",
  weight: "300 700",
  display: "swap",
});
const body = localFont({
  src: "./fonts/inter-latin.woff2",
  variable: "--font-body",
  weight: "100 900",
  display: "swap",
});
const wordmark = localFont({
  src: "./fonts/prata-latin.woff2",
  variable: "--font-wordmark",
  weight: "400",
  display: "swap",
});

export const runtime = "nodejs";

export const metadata: Metadata = {
  title: "ZARI Operations",
  description: "Private operations portal for ZARI Rugs.",
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} ${wordmark.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
