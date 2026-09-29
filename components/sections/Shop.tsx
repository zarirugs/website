"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Suspense, useEffect, useState } from "react";

import Container from "@/components/layout/Container";
import Section from "@/components/layout/Section";
import { FadeIn } from "@/components/motion";
import { type Collection } from "@/lib/data/collections";
import styles from "./Shop.module.css";
import ShopCatalogue from "@/components/store/ShopCatalogue";
import { useCatalog } from "@/lib/store/use-catalog";

type ShopProps = {
  headingAs?: "h1" | "h2";
  headingLink?: boolean;
  variant?: "carousel" | "catalogue";
};

type VisualAsset = Pick<Collection, "image" | "backgroundColor" | "imageFit" | "slug"> & {
  categorySlug?: string;
  previewPosition?: "lead" | "detail-one" | "detail-two" | "detail-three" | "detail-four";
};

function CollectionVisual({ collection, className }: { collection: VisualAsset; className: string }) {
  const [imageReady, setImageReady] = useState(false);

  useEffect(() => {
    if (!collection.image) {
      return;
    }

    let active = true;
    const image = new Image();
    image.onload = () => {
      if (active) setImageReady(true);
    };
    image.onerror = () => {
      if (active) setImageReady(false);
    };
    image.src = collection.image;

    return () => {
      active = false;
    };
  }, [collection.image]);

  return (
    <div
      className={`${styles.collectionVisual} ${className}`}
      aria-hidden="true"
      style={{ backgroundColor: collection.backgroundColor ?? undefined }}
      data-fit={collection.imageFit ?? "contain"}
      data-collection={collection.categorySlug ?? collection.slug ?? "default"}
      data-preview={collection.previewPosition}
      data-fallback={!imageReady}
    >
      <span className={styles.collectionTexture} />
      {imageReady && collection.image ? (
        // The catalog accepts administrator-provided remote image URLs, so Next's fixed image host allowlist is intentionally bypassed here.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          alt=""
          src={collection.image}
          className={styles.collectionVisualImage}
          data-fit={collection.imageFit ?? "contain"}
          onError={() => setImageReady(false)}
        />
      ) : null}
    </div>
  );
}

function ShopCard({ collection }: { collection: Collection }) {
  const destination = collection.slug ? `/shop?category=${encodeURIComponent(collection.slug)}` : "#order";

  return (
    <article className={styles.card} data-shop-card>
      <Link
        href={destination}
        aria-label={`Shop ${collection.title}`}
        className={styles.cardLink}
      >
        <div className={styles.visual}>
          <CollectionVisual collection={collection} className={styles.image} />
          <span className={styles.imageAction} aria-hidden="true">
            <ArrowUpRight size={18} strokeWidth={1.35} />
          </span>
        </div>
        <div className={styles.cardCopy}>
          <div>
            <p className={styles.cardEyebrow}>Collection</p>
            <h3 className={styles.name}>{collection.title}</h3>
          </div>
          <p className={styles.subtitle}>{collection.subtitle}</p>
        </div>
      </Link>
    </article>
  );
}

function CollectionGallery({ headingAs: Heading = "h2", headingLink = false }: ShopProps) {
  const { collections: catalog } = useCatalog();

  return (
    <Section id="shop" className={styles.section}>
      <Container className={styles.shopContainer}>
        <FadeIn>
          <header className={styles.header}>
            <div className={styles.headingGroup}>
              <p className={styles.eyebrow}>The collections</p>
              <Heading className={styles.title}>Made to live with you.</Heading>
            </div>
            <div className={styles.intro}>
              <p>
                From quiet contemporary forms to storied motifs, discover rugs
                shaped by hand, material and time.
              </p>
              {headingLink && (
                <Link href="/shop" className={styles.titleLink} aria-label="View all rugs">
                  View all rugs <ArrowUpRight size={16} strokeWidth={1.4} />
                </Link>
              )}
            </div>
          </header>
        </FadeIn>
        <FadeIn>
          <div className={styles.gallery}>
            {catalog.map((collection) => <ShopCard key={collection.id} collection={collection} />)}
          </div>
        </FadeIn>
      </Container>
    </Section>
  );
}

export default function Shop(props: ShopProps) {
  return props.variant === "catalogue" ? <Suspense fallback={<p role="status">Loading rugs…</p>}><ShopCatalogue /></Suspense> : <CollectionGallery {...props} />;
}
