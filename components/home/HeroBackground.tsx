"use client";
import { useEffect, useState } from "react";
import { previewMedia } from "@/lib/store/media";
import styles from "./HeroBackground.module.css";
import type { SiteMedia } from "@/lib/server/site-media";

const defaultHero: Pick<SiteMedia, "imageUrl" | "backgroundColor" | "mediaKind" | "sourceType"> = {
  imageUrl: "/api/media/media-default-hero-video",
  backgroundColor: "#171717",
  mediaKind: "video",
  sourceType: "upload",
};
const heroPoster = "/api/media/media-default-hero";

export default function HeroBackground({ media = defaultHero }: { media?: SiteMedia | typeof defaultHero }) {
  const [motionAllowed, setMotionAllowed] = useState(false);
  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setMotionAllowed(!preference.matches && !(navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData);
    update(); preference.addEventListener("change", update);
    return () => preference.removeEventListener("change", update);
  }, []);
  const imageWidths = [640, 750, 828, 1080, 1200, 1920];
  const uploadedImageSrcSet = media.mediaKind === "image" && media.imageUrl && media.sourceType === "upload"
    ? imageWidths.map((width) => `${media.imageUrl}?w=${width} ${width}w`).join(", ")
    : undefined;

  return (
    <>
      <div className={styles.media} style={{ backgroundColor: media.backgroundColor ?? "#171717" }} aria-hidden="true">
        {media.mediaKind === "video" && media.imageUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className={styles.image} src={previewMedia(`${heroPoster}?w=1920`)} srcSet={imageWidths.map((width) => `${previewMedia(heroPoster)}?w=${width} ${width}w`).join(", ")} sizes="100vw" alt="" fetchPriority="high" />
            {motionAllowed && <video
              key={media.imageUrl}
              className={styles.video}
              autoPlay
              loop
              muted
              playsInline
              poster={previewMedia(heroPoster)}
              preload="metadata"
              tabIndex={-1}
            >
              <source src={previewMedia(media.imageUrl)} type="video/mp4" />
            </video>}
          </>
        ) : media.imageUrl ? (
          // Admin-managed images use the native element so external URLs remain supported.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={uploadedImageSrcSet ? `${media.imageUrl}?w=1920` : media.imageUrl}
            srcSet={uploadedImageSrcSet}
            sizes={uploadedImageSrcSet ? "100vw" : undefined}
            alt=""
            className={styles.image}
            fetchPriority="high"
            decoding="async"
          />
        ) : null}
      </div>

      <div className="absolute inset-0 bg-black/35" />

      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
    </>
  );
}
