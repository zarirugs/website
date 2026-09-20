"use client";

import Link from "next/link";
import { type CSSProperties, useCallback, useEffect, useRef, useState } from "react";

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
  const destination = collection.slug ? `/collections/${collection.slug}` : "#order";

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
  const [canMovePrevious, setCanMovePrevious] = useState(false);
  const [canMoveNext, setCanMoveNext] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [hasUserNavigated, setHasUserNavigated] = useState(false);
  const [autoStep, setAutoStep] = useState(0);
  const [cardWidth, setCardWidth] = useState(0);
  const viewportRef = useRef<HTMLDivElement>(null);

  const updateNavigation = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const maxScroll = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
    setCanMovePrevious(viewport.scrollLeft > 2);
    setCanMoveNext(viewport.scrollLeft < maxScroll - 2);
  }, []);

  const updateCardWidth = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const visibleCards = window.matchMedia("(min-width: 48rem)").matches ? 3 : 2;
    const track = viewport.querySelector<HTMLElement>("[data-shop-track]");
    const gap = track ? Number.parseFloat(window.getComputedStyle(track).gap) || 0 : 0;
    setCardWidth((viewport.clientWidth - gap * (visibleCards - 1)) / visibleCards);
  }, []);

  const cardStep = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport || !cardWidth) return 0;

    const track = viewport.querySelector<HTMLElement>("[data-shop-track]");
    const gap = track ? Number.parseFloat(window.getComputedStyle(track).gap) || 0 : 0;
    return cardWidth + gap;
  }, [cardWidth]);

  const move = useCallback((direction: "previous" | "next", isManual = true) => {
    const viewport = viewportRef.current;
    const step = cardStep();
    if (!viewport || !step) return;

    if (isManual) setHasUserNavigated(true);

    const maxScroll = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
    const target = Math.min(
      maxScroll,
      Math.max(0, viewport.scrollLeft + (direction === "next" ? step : -step)),
    );
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    viewport.scrollTo({ left: target, behavior: reducedMotion ? "auto" : "smooth" });
  }, [cardStep]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(updateCardWidth);
    window.addEventListener("resize", updateCardWidth);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", updateCardWidth);
    };
  }, [catalog.length, updateCardWidth]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(updateNavigation);
    return () => window.cancelAnimationFrame(frame);
  }, [cardWidth, catalog.length, updateNavigation]);

  useEffect(() => {
    if (hasUserNavigated || isPaused || !canMoveNext) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const timer = window.setTimeout(() => {
      move("next", false);
      setAutoStep((current) => current + 1);
    }, 4000);

    return () => window.clearTimeout(timer);
  }, [autoStep, canMoveNext, hasUserNavigated, isPaused, move]);

  return (
    <Section id="shop" className={styles.section}>
      <Container>
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
            <button type="button" className={`${styles.control} ${styles.previousControl}`} aria-label="Show previous shop pieces" disabled={!canMovePrevious} onClick={() => move("previous")}>
              <span aria-hidden="true">&lt;</span>
            </button>
            <div className={styles.viewport} ref={viewportRef} onScroll={updateNavigation} onMouseEnter={() => setIsPaused(true)} onMouseLeave={() => setIsPaused(false)} onFocusCapture={() => setIsPaused(true)} onBlurCapture={() => setIsPaused(false)}>
              <div className={styles.track} data-shop-track style={{ "--card-width": `${cardWidth}px` } as CSSProperties}>
                {catalog.map((collection) => <ShopCard key={collection.id} collection={collection} />)}
              </div>
            </div>
            <button type="button" className={`${styles.control} ${styles.nextControl}`} aria-label="Show next shop pieces" disabled={!canMoveNext} onClick={() => move("next")}>
              <span aria-hidden="true">&gt;</span>
            </button>
          </div>
        </FadeIn>
      </Container>
    </Section>
  );
}

export default function Shop(props: ShopProps) {
  return props.variant === "catalogue" ? <ShopCatalogue /> : <CarouselShop {...props} />;
}
