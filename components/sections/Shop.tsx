"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
  const destination = collection.slug === "heritage" ? "/shop?category=heritage" : collection.slug ? `/collections/${collection.slug}` : "#order";

  return (
    <article className={styles.card} data-shop-card>
      <Link
        href={destination}
        aria-label={`Shop ${collection.title}`}
        className={styles.cardLink}
      >
        <div className={styles.visual}>
          <CollectionVisual collection={collection} className={styles.image} />
          <div className={styles.nameShade} aria-hidden="true" />
          <h3 className={styles.name}>{collection.title}</h3>
        </div>
      </Link>
    </article>
  );
}

function CarouselShop({ headingAs: Heading = "h2", headingLink = false }: ShopProps) {
  const { collections: catalog } = useCatalog();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [hasUserNavigated, setHasUserNavigated] = useState(false);
  const orderedCollections = catalog.map((_, index) => catalog[(activeIndex + index) % catalog.length]);

  function move(direction: "previous" | "next", isManual = true) {
    if (catalog.length < 2) return;
    if (isManual) setHasUserNavigated(true);
    setActiveIndex((current) => (current + (direction === "next" ? 1 : -1) + catalog.length) % catalog.length);
  }

  useEffect(() => {
    if (hasUserNavigated || isPaused || catalog.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const timer = window.setTimeout(() => setActiveIndex((current) => (current + 1) % catalog.length), 4000);

    return () => window.clearTimeout(timer);
  }, [activeIndex, catalog.length, hasUserNavigated, isPaused]);

  return (
    <Section id="shop" className={styles.section}>
      <Container className={styles.shopContainer}>
        <FadeIn>
          <header className={styles.header}>
            {headingLink ? (
              <Link href="/shop" className={styles.titleLink} aria-label="Open shop">
                <Heading className={styles.title}>Shop</Heading>
              </Link>
            ) : (
              <Heading className={styles.title}>Shop</Heading>
            )}
          </header>
        </FadeIn>
        <FadeIn>
          <div className={styles.carousel}>
            <button type="button" className={`${styles.control} ${styles.previousControl}`} aria-label="Show previous shop pieces" disabled={catalog.length < 2} onClick={() => move("previous")}>
              <ChevronLeft aria-hidden="true" size={24} strokeWidth={1.5} />
            </button>
            <div className={styles.viewport} onMouseEnter={() => setIsPaused(true)} onMouseLeave={() => setIsPaused(false)} onFocusCapture={() => setIsPaused(true)} onBlurCapture={() => setIsPaused(false)}>
              <div className={styles.track}>
                {orderedCollections.map((collection) => <ShopCard key={collection.id} collection={collection} />)}
              </div>
            </div>
            <button type="button" className={`${styles.control} ${styles.nextControl}`} aria-label="Show next shop pieces" disabled={catalog.length < 2} onClick={() => move("next")}>
              <ChevronRight aria-hidden="true" size={24} strokeWidth={1.5} />
            </button>
          </div>
        </FadeIn>
      </Container>
    </Section>
  );
}

export default function Shop(props: ShopProps) {
  return props.variant === "catalogue" ? <Suspense fallback={<p role="status">Loading rugs…</p>}><ShopCatalogue /></Suspense> : <CarouselShop {...props} />;
}
