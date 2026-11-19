"use client";
import { useState } from "react";
import { site } from "@/lib/data/site";
import { mediaWidth, mediaSrcSet } from "@/lib/store/media";
export default function RugImage({ src, alt, eager = false, fit = "cover", sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" }: { src: string; alt: string; eager?: boolean; fit?: "cover" | "contain"; sizes?: string }) {
  const [failed, setFailed] = useState(false);
  const prefix = process.env.NODE_ENV === "development" && src.startsWith("/api/media/media-default-") ? site.url : "";
  if (!src || failed) return <div role="img" aria-label={alt} className="grid h-full min-h-48 w-full place-items-center bg-neutral-100 text-xs text-neutral-500">Photograph coming soon</div>;
  // Administrator-managed external images remain supported without an arbitrary host allowlist.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={prefix + mediaWidth(src, 1200)} srcSet={mediaSrcSet(src)?.split(", ").map((entry) => prefix + entry).join(", ")} sizes={mediaSrcSet(src) ? sizes : undefined} alt={alt} loading={eager ? "eager" : "lazy"} decoding="async" width={1200} height={1200} style={{ objectFit: fit, width: "100%", height: "100%" }} onError={() => setFailed(true)} />;
}
