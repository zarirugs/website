"use client";

import { useEffect, useState } from "react";

import styles from "./AtelierImage.module.css";

type SiteMediaResponse = { media?: { atelier?: { imageUrl?: string | null; backgroundColor?: string | null } } };

export default function AtelierImage() {
  const [media, setMedia] = useState({ imageUrl: "/api/media/media-default-atelier", backgroundColor: "#111" });

  useEffect(() => {
    void fetch("/api/site-media", { cache: "no-store" })
      .then(async (response): Promise<SiteMediaResponse> => response.ok ? response.json() as Promise<SiteMediaResponse> : { media: {} })
      .then((result) => {
        const atelier = result.media?.atelier;
        if (atelier) setMedia({ imageUrl: atelier.imageUrl ?? "", backgroundColor: atelier.backgroundColor ?? "#111" });
      })
      .catch(() => undefined);
  }, []);

  return (
    <section className={styles.section} aria-label="The ZARI atelier">
      <div className={styles.image} style={{ backgroundColor: media.backgroundColor, backgroundImage: media.imageUrl ? `url(${media.imageUrl})` : undefined }} />
    </section>
  );
}
