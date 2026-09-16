"use client";

import Link from "next/link";
import { ArrowRight, SlidersHorizontal, X } from "lucide-react";
import { type CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from "react";

import Container from "@/components/layout/Container";
import Section from "@/components/layout/Section";
import { FadeIn } from "@/components/motion";
import { collections, type Collection } from "@/lib/data/collections";
import { orderCatalog } from "@/lib/data/order-catalog";
import styles from "./Shop.module.css";

type ShopProps = {
  headingAs?: "h1" | "h2";
  headingLink?: boolean;
  variant?: "carousel" | "catalogue";
};

type ShopProduct = {
  sku: string;
  name: string;
  description: string | null;
  categorySlug: string;
  image: string;
  backgroundColor?: string | null;
  imageFit?: "contain" | "cover";
  pricePaise: number | null;
  stock: number;
};

type CatalogData = {
  collections: Collection[];
  products: ShopProduct[];
};

type VisualAsset = Pick<Collection, "image" | "backgroundColor" | "imageFit" | "slug"> & {
  categorySlug?: string;
  previewPosition?: "lead" | "detail-one" | "detail-two" | "detail-three" | "detail-four";
};

type PreviewProduct = ShopProduct & {
  displayCategory: string;
  displayLabel: string;
  previewPosition: NonNullable<VisualAsset["previewPosition"]>;
};

const previewRugImage = "/images/rug-preview-01.png";

const fallbackProducts: ShopProduct[] = collections.map((collection, index) => {
  const item = orderCatalog[index];

  return {
    sku: item?.sku ?? `ZAR-RUG-${index + 1}`,
    name: item?.name ?? `Rug ${index + 1}`,
    description: item?.description ?? "A hand-knotted rug from the ZARI atelier.",
    categorySlug: collection.slug ?? `category-${index + 1}`,
    image: collection.image,
    backgroundColor: collection.backgroundColor,
    imageFit: collection.imageFit ?? "cover",
    pricePaise: null,
    stock: item?.quantity ?? 0,
  };
});

function useCatalog() {
  const [catalog, setCatalog] = useState<CatalogData>({ collections, products: fallbackProducts });

  useEffect(() => {
    async function loadCatalog() {
      const response = await fetch("/api/catalog", { cache: "no-store" });
      if (!response.ok) return;

      const result = await response.json().catch(() => ({ collections: [], products: [] })) as Partial<CatalogData>;
      if (!result.collections?.length && !result.products?.length) return;

      setCatalog((current) => ({
        collections: result.collections?.length ? result.collections : current.collections,
        products: result.products?.length ? result.products : current.products,
      }));
    }

    void loadCatalog();
  }, []);

  return catalog;
}

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

function CatalogueShop({ headingAs: Heading = "h1" }: ShopProps) {
  const { collections: catalog, products } = useCatalog();
  const [activeSlug, setActiveSlug] = useState("all");
  const [sort, setSort] = useState<"featured" | "az">("featured");
  const [filterOpen, setFilterOpen] = useState(false);

  const visibleProducts = useMemo(() => {
    const filtered = activeSlug === "all" ? products : products.filter((product) => product.categorySlug === activeSlug);
    return sort === "az" ? [...filtered].sort((a, b) => a.sku.localeCompare(b.sku)) : filtered;
  }, [activeSlug, products, sort]);

  const featuredProduct = visibleProducts[0];

  const previewProducts = useMemo<PreviewProduct[]>(() => {
    const source = visibleProducts.length ? visibleProducts : fallbackProducts;
    const positions: PreviewProduct["previewPosition"][] = ["lead", "detail-one", "detail-two", "detail-three", "detail-four"];

    return positions.map((previewPosition, index) => {
      const product = source[index % source.length];
      const selectedCategoryIndex = catalog.findIndex((collection) => collection.slug === activeSlug);
      const activeCategory = activeSlug === "all"
        ? `Category ${(index % Math.max(catalog.length, 1)) + 1}`
        : `Category ${selectedCategoryIndex === -1 ? 1 : selectedCategoryIndex + 1}`;

      return {
        ...product,
        image: previewRugImage,
        imageFit: "cover",
        displayCategory: activeCategory,
        displayLabel: `Rug ${String(index + 1).padStart(2, "0")}`,
        previewPosition,
      };
    });
  }, [activeSlug, catalog, visibleProducts]);

  function selectCollection(slug: string) {
    setActiveSlug(slug);
    setFilterOpen(false);
  }

  return (
    <Section id="shop" className={`${styles.section} ${styles.catalogueSection}`}>
      <Container className={styles.catalogueContainer}>
        <header className={styles.catalogueHeader}>
          <p className={styles.kicker}>The Zari collection</p>
          <Heading className={styles.catalogueTitle}>Rugs</Heading>
          <p className={styles.catalogueIntro}>Hand-knotted rugs, made patiently in Bhadohi for rooms with a point of view.</p>
          <nav className={styles.categoryNav} aria-label="Shop by collection">
            <button type="button" className={`${styles.categoryButton} ${activeSlug === "all" ? styles.categoryActive : ""}`} onClick={() => selectCollection("all")} aria-pressed={activeSlug === "all"}>View all</button>
            {catalog.map((collection, index) => (
              <button key={collection.id} type="button" className={`${styles.categoryButton} ${activeSlug === collection.slug ? styles.categoryActive : ""}`} onClick={() => selectCollection(collection.slug ?? "")} aria-pressed={activeSlug === collection.slug}>Category {index + 1}</button>
            ))}
          </nav>
        </header>

        {featuredProduct ? (
          <section className={styles.productSection} aria-live="polite">
            <div className={styles.productSectionHeading}>
              <p>Selected rugs</p>
              <span>Preview gallery</span>
            </div>
            <div className={styles.productGrid}>
              <Link href={`/collections/${previewProducts[0].categorySlug}`} className={styles.featureProduct} aria-label={`View ${previewProducts[0].displayLabel}`}>
                <CollectionVisual collection={previewProducts[0]} className={styles.featureProductImage} />
                <div className={styles.featureProductContent}>
                  <p>{previewProducts[0].displayCategory}</p>
                  <h2>{previewProducts[0].displayLabel}</h2>
                  <span>Preview piece <ArrowRight size={16} strokeWidth={1.5} /></span>
                </div>
              </Link>
              {previewProducts.slice(1).map((product) => (
                <Link href={`/collections/${product.categorySlug}`} className={styles.productCard} key={product.previewPosition} aria-label={`View ${product.displayLabel}`}>
                  <CollectionVisual collection={product} className={styles.productImage} />
                  <div className={styles.productCardContent}>
                    <p>{product.displayCategory}</p>
                    <h3>{product.displayLabel}</h3>
                    <span>Preview piece</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </Container>

      <button type="button" className={styles.filterTrigger} onClick={() => setFilterOpen(true)} aria-haspopup="dialog">
        <SlidersHorizontal size={18} strokeWidth={1.5} />
        <span>Filter &amp; sort</span>
      </button>

      {filterOpen && (
        <div className={styles.filterOverlay} onClick={() => setFilterOpen(false)}>
          <aside className={styles.filterPanel} role="dialog" aria-modal="true" aria-labelledby="shop-filter-title" onClick={(event) => event.stopPropagation()}>
            <div className={styles.filterPanelHeader}>
              <div><p>Refine your view</p><h2 id="shop-filter-title">Filter &amp; sort</h2></div>
              <button type="button" onClick={() => setFilterOpen(false)} aria-label="Close filters"><X size={20} strokeWidth={1.5} /></button>
            </div>
            <fieldset className={styles.filterGroup}>
              <legend>Collection</legend>
              <button type="button" className={activeSlug === "all" ? styles.filterChoiceActive : ""} onClick={() => selectCollection("all")}>All rugs</button>
              {catalog.map((collection, index) => <button type="button" key={collection.id} className={activeSlug === collection.slug ? styles.filterChoiceActive : ""} onClick={() => selectCollection(collection.slug ?? "")}>Category {index + 1}</button>)}
            </fieldset>
            <fieldset className={styles.filterGroup}>
              <legend>Sort by</legend>
              <button type="button" className={sort === "featured" ? styles.filterChoiceActive : ""} onClick={() => setSort("featured")}>Featured</button>
              <button type="button" className={sort === "az" ? styles.filterChoiceActive : ""} onClick={() => setSort("az")}>Alphabetical, A–Z</button>
            </fieldset>
            <button type="button" className={styles.applyButton} onClick={() => setFilterOpen(false)}>Show {visibleProducts.length} {visibleProducts.length === 1 ? "rug" : "rugs"}</button>
          </aside>
        </div>
      )}
    </Section>
  );
}

export default function Shop(props: ShopProps) {
  return props.variant === "catalogue" ? <CatalogueShop {...props} /> : <CarouselShop {...props} />;
}
