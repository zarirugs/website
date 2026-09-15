"use client";

import Link from "next/link";
import { type CSSProperties, useCallback, useEffect, useRef, useState } from "react";

import Container from "@/components/layout/Container";
import Section from "@/components/layout/Section";
import { FadeIn } from "@/components/motion";
import { collections, type Collection } from "@/lib/data/collections";
import styles from "./Shop.module.css";

type ShopProps = {
  headingAs?: "h1" | "h2";
  headingLink?: boolean;
};

function ShopCard({ collection }: { collection: Collection }) {
  const destination = collection.slug ? `/collections/${collection.slug}` : "#order";
  const imageStyle = collection.image
    ? { backgroundImage: `url(${collection.image})`, backgroundColor: collection.backgroundColor ?? undefined }
    : { backgroundColor: collection.backgroundColor ?? "#f4f1eb" };

  return (
    <article className={styles.card} data-shop-card>
      <Link
        href={destination}
        aria-label={`Shop ${collection.title}`}
        className={styles.cardLink}
      >
        <div className={styles.visual}>
          <div
            className={styles.image}
            aria-hidden="true"
            style={imageStyle}
            data-fit={collection.imageFit ?? "contain"}
          />
          <div className={styles.nameShade} aria-hidden="true" />
          <h3 className={styles.name}>{collection.title}</h3>
        </div>
      </Link>
    </article>
  );
}

export default function Shop({ headingAs: Heading = "h2", headingLink = false }: ShopProps) {
  const [catalog, setCatalog] = useState<Collection[]>(collections);
  const [canMovePrevious, setCanMovePrevious] = useState(false);
  const [canMoveNext, setCanMoveNext] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [hasUserNavigated, setHasUserNavigated] = useState(false);
  const [autoStep, setAutoStep] = useState(0);
  const [cardWidth, setCardWidth] = useState(0);
  const viewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadCatalog() {
      const response = await fetch("/api/catalog", { cache: "no-store" });
      if (!response.ok) return;

      const result = await response.json().catch(() => ({ collections: [] })) as { collections?: Collection[] };
      if (result.collections?.length) setCatalog(result.collections);
    }

    void loadCatalog();
  }, []);

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
            <button
              type="button"
              className={`${styles.control} ${styles.previousControl}`}
              aria-label="Show previous shop pieces"
              disabled={!canMovePrevious}
              onClick={() => move("previous")}
            >
              <span aria-hidden="true">&lt;</span>
            </button>
            <div
              className={styles.viewport}
              ref={viewportRef}
              onScroll={updateNavigation}
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
              onFocusCapture={() => setIsPaused(true)}
              onBlurCapture={() => setIsPaused(false)}
            >
              <div className={styles.track} data-shop-track style={{ "--card-width": `${cardWidth}px` } as CSSProperties}>
                {catalog.map((collection) => (
                  <ShopCard key={collection.id} collection={collection} />
                ))}
              </div>
            </div>
            <button
              type="button"
              className={`${styles.control} ${styles.nextControl}`}
              aria-label="Show next shop pieces"
              disabled={!canMoveNext}
              onClick={() => move("next")}
            >
              <span aria-hidden="true">&gt;</span>
            </button>
          </div>
        </FadeIn>
      </Container>
    </Section>
  );
}
