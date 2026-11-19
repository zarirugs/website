import { previewMedia } from "@/lib/store/media";
import { getSiteMedia } from "@/lib/server/site-media";
import styles from "./AtelierImage.module.css";
export default async function AtelierImage() {
  const media = (await getSiteMedia().catch(() => ({} as Awaited<ReturnType<typeof getSiteMedia>>))).atelier;
  const image = media?.imageUrl ?? "/api/media/media-default-atelier";
  return <section className={styles.section} aria-label="The ZARI atelier"><div className={styles.image} style={{ backgroundColor: media?.backgroundColor ?? "#111", backgroundImage: image ? `url(${previewMedia(image)})` : undefined }} /></section>;
}
