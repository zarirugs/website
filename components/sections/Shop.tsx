"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import Container from "@/components/layout/Container";
import Section from "@/components/layout/Section";
import { FadeIn } from "@/components/motion";
import { collections, type Collection } from "@/lib/data/collections";
import styles from "./Shop.module.css";

function ShopCard({ collection }: { collection: Collection }) {
  const destination = collection.slug ? `/collections/${collection.slug}` : "#order";
  const imageStyle = collection.image
    ? { backgroundImage: `url(${collection.image})`, backgroundColor: collection.backgroundColor ?? undefined }
    : { backgroundColor: collection.backgroundColor ?? "#f4f1eb" };

  return (
    <article className={styles.card}>
      <Link
        href={destination}
        aria-label={`Shop ${collection.title}`}
        className={styles.cardLink}
      >
        <div
          className={styles.image}
          role="img"
          aria-label={collection.title}
          style={imageStyle}
          data-fit={collection.imageFit ?? "contain"}
        />
        <div className={styles.details}>
          <h3 className={styles.name}>{collection.title}</h3>
          <span className={styles.view}>View collection <span aria-hidden="true">→</span></span>
        </div>
      </Link>
    </article>
  );
}

export default function Shop() {
  const [catalog, setCatalog] = useState<Collection[]>(collections);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isSliding, setIsSliding] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [canAutoAdvance, setCanAutoAdvance] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    async function loadCatalog() {
      const response = await fetch("/api/catalog", { cache: "no-store" });
      if (!response.ok) return;

      const result = await response.json().catch(() => ({ collections: [] })) as { collections?: Collection[] };
      if (result.collections?.length) setCatalog(result.collections);
    }

    void loadCatalog();
  }, []);

  useEffect(() => {
    const mobileQuery = window.matchMedia("(max-width: 47.99rem)");
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setCanAutoAdvance(mobileQuery.matches && !motionQuery.matches);

    updatePreference();
    mobileQuery.addEventListener("change", updatePreference);
    motionQuery.addEventListener("change", updatePreference);

    return () => {
      mobileQuery.removeEventListener("change", updatePreference);
      motionQuery.removeEventListener("change", updatePreference);
    };
  }, []);

  useEffect(() => {
    if (!canAutoAdvance || isPaused || catalog.length < 3) return;

    let timer: number;
    let resetFrame: number;
    const advance = () => {
      timer = window.setTimeout(() => {
        setIsSliding(true);
        timer = window.setTimeout(() => {
          setActiveIndex((current) => (current + 1) % catalog.length);
          setIsSliding(false);
          setIsResetting(true);
          resetFrame = window.requestAnimationFrame(() => {
            setIsResetting(false);
            advance();
          });
        }, 650);
      }, 4000);
    };

    advance();
    return () => {
      window.clearTimeout(timer);
      window.cancelAnimationFrame(resetFrame);
    };
  }, [canAutoAdvance, catalog.length, isPaused]);

  const visibleCatalog = [
    ...catalog.slice(activeIndex),
    ...catalog.slice(0, activeIndex),
  ];

  return (
    <Section id="shop" className={styles.section}>
      <Container>
        <FadeIn>
          <header className={styles.header}>
            <h2 className={styles.title}>Shop</h2>
          </header>
        </FadeIn>
        <FadeIn>
          <div
            className={styles.viewport}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onFocusCapture={() => setIsPaused(true)}
            onBlurCapture={() => setIsPaused(false)}
          >
            <div className={`${styles.track} ${isSliding ? styles.isSliding : ""} ${isResetting ? styles.isResetting : ""}`}>
              {visibleCatalog.map((collection) => (
                <ShopCard key={collection.id} collection={collection} />
              ))}
            </div>
          </div>
        </FadeIn>
      </Container>
    </Section>
  );
}
