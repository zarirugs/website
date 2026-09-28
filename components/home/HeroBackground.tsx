import styles from "./HeroBackground.module.css";
import type { SiteMedia } from "@/lib/server/site-media";

const defaultHero: Pick<SiteMedia, "imageUrl" | "backgroundColor" | "mediaKind" | "sourceType"> = {
  imageUrl: "/api/media/media-default-hero-video",
  backgroundColor: "#171717",
  mediaKind: "video",
  sourceType: "upload",
};

export default function HeroBackground({ media = defaultHero }: { media?: SiteMedia | typeof defaultHero }) {
  const imageWidths = [640, 750, 828, 1080, 1200, 1920];
  const uploadedImageSrcSet = media.mediaKind === "image" && media.imageUrl && media.sourceType === "upload"
    ? imageWidths.map((width) => `${media.imageUrl}?w=${width} ${width}w`).join(", ")
    : undefined;

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
