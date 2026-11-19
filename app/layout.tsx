import { site } from "@/lib/data/site";
import { jsonLd } from "@/lib/store/seo";
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
  metadataBase: new URL(site.url),
  openGraph: { type: "website", siteName: "ZARI", locale: "en_IN", title: "ZARI Rugs | Hand-knotted rugs from Bhadohi", description: site.description, images: [{ url: "/api/media/media-default-hero?w=1200", alt: "ZARI rugs" }] },
  twitter: { card: "summary_large_image" },
  title: {
    default: "ZARI Rugs | Hand-knotted rugs from Bhadohi",
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
      data-scroll-behavior="smooth"
      className={`${display.variable} ${body.variable} ${wordmark.variable}`}
    >
      <body><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd({ "@context": "https://schema.org", "@type": "Organization", name: site.name, url: site.url, email: site.email, sameAs: Object.values(site.social), address: { "@type": "PostalAddress", addressLocality: site.address.city, addressRegion: site.address.state, addressCountry: "IN" } }) }} /><StoreProvider>{children}</StoreProvider></body>
    </html>
  );
}
