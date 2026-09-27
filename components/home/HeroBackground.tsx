"use client";

import { useEffect, useState } from "react";

import styles from "./HeroBackground.module.css";

type HeroMedia = {
  imageUrl?: string | null;
  backgroundColor?: string | null;
  mediaKind?: "image" | "video";
};
type SiteMediaResponse = { media?: { hero?: HeroMedia } };

const defaultHero: HeroMedia = {
  imageUrl: "/videos/hero-rug-making.mp4",
  backgroundColor: "#171717",
  mediaKind: "video",
};

export default function HeroBackground() {
  const [media, setMedia] = useState<HeroMedia>(defaultHero);

  useEffect(() => {
    void fetch("/api/site-media", { cache: "no-store" })
      .then(async (response): Promise<SiteMediaResponse> => response.ok ? response.json() as Promise<SiteMediaResponse> : { media: {} })
      .then((result) => result.media?.hero && setMedia(result.media.hero))
      .catch(() => undefined);
  }, []);

  return (
    <>
      <div className={styles.media} style={{ backgroundColor: media.backgroundColor ?? "#171717" }} aria-hidden="true">
        {media.mediaKind === "video" && media.imageUrl ? (
          <video
            key={media.imageUrl}
            className={styles.video}
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            tabIndex={-1}
          >
            <source src={media.imageUrl} type="video/mp4" />
          </video>
        ) : media.imageUrl ? (
          <div className={styles.image} style={{ backgroundImage: `url(${media.imageUrl})` }} />
        ) : null}
      </div>

      <div className="absolute inset-0 bg-black/35" />

      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
    </>
  );
}
