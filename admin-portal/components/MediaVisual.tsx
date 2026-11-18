"use client";

import { useState } from "react";
import Image from "next/image";
import styles from "./media-visual.module.css";

export default function MediaVisual({
  imageUrl,
  backgroundColor,
  label,
  className,
  contain = false,
}: {
  imageUrl?: string | null;
  backgroundColor?: string | null;
  label: string;
  className?: string;
  contain?: boolean;
}) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const showImage = imageUrl && failedUrl !== imageUrl;
  return (
    <div
      className={`${styles.visual} ${className ?? ""}`}
      style={{ backgroundColor: backgroundColor ?? "var(--subtle)" }}
      role="img"
      aria-label={label}
    >
      {showImage ? (
        <Image
          src={imageUrl}
          alt=""
          fill
          unoptimized
          sizes="(max-width: 760px) 100vw, 50vw"
          style={{ objectFit: contain ? "contain" : "cover" }}
          onError={() => setFailedUrl(imageUrl)}
        />
      ) : (
        (imageUrl || !backgroundColor) && (
          <span className={styles.fallback} aria-hidden="true">
            {imageUrl ? "Image unavailable" : "No image selected"}
          </span>
        )
      )}
    </div>
  );
}
