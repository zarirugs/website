"use client";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ShopProduct } from "@/lib/store/shop-catalog";
import RugImage from "./RugImage";
import styles from "./ShopCatalogue.module.css";
export default function ProductGallery({ product }: { product: ShopProduct }) {
  const photos = product.images?.length ? product.images : product.image ? [{ id: product.sku, url: product.image, alt: product.name }] : [];
  const [index, setIndex] = useState(0);
  const photo = photos[index];
  function move(direction: number) { setIndex((current) => (current + direction + photos.length) % photos.length); }
  return <div className={styles.productGallery} onKeyDown={(event) => {
    if (photos.length < 2) return;
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") { event.preventDefault(); move(event.key === "ArrowRight" ? 1 : -1); }
  }}>
    <div className={styles.dialogImage}><RugImage key={photo?.url ?? "none"} src={photo?.url ?? ""} alt={photo?.alt || product.name} eager fit={product.imageFit} /></div>
    {photos.length > 1 && <><div className={styles.galleryControls}><button aria-label="Previous product image" onClick={() => move(-1)}><ChevronLeft size={20} /></button><span aria-live="polite">{index + 1} / {photos.length}</span><button aria-label="Next product image" onClick={() => move(1)}><ChevronRight size={20} /></button></div><div className={styles.galleryThumbnails}>{photos.map((image, position) => <button key={image.id} aria-label={`Show product image ${position + 1}`} aria-pressed={index === position} onClick={() => setIndex(position)}><RugImage src={image.url} alt={image.alt || `${product.name}, image ${position + 1}`} /></button>)}</div></>}
  </div>;
}
