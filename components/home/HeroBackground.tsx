"use client";

import { useEffect, useState } from "react";

type HeroMedia = { imageUrl?: string | null; backgroundColor?: string | null };
type SiteMediaResponse = { media?: { hero?: HeroMedia } };

export default function HeroBackground() {
  const [media, setMedia] = useState<HeroMedia>({ imageUrl: "/images/hero.webp" });

  useEffect(() => {
    void fetch("/api/site-media", { cache: "no-store" })
      .then(async (response): Promise<SiteMediaResponse> => response.ok ? response.json() as Promise<SiteMediaResponse> : { media: {} })
      .then((result) => result.media?.hero && setMedia(result.media.hero))
      .catch(() => undefined);
  }, []);

  return (
    <>
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundColor: media.backgroundColor ?? "#171717", backgroundImage: media.imageUrl ? `url(${media.imageUrl})` : undefined }} />

      <div className="absolute inset-0 bg-black/35" />

      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
    </>
  );
}
