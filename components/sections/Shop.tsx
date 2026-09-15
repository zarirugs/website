"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import Container from "@/components/layout/Container";
import Section from "@/components/layout/Section";
import { FadeIn } from "@/components/motion";
import { collections, type Collection } from "@/lib/data/collections";
import styles from "./Shop.module.css";

function ShopCard({ collection, duplicate = false }: { collection: Collection; duplicate?: boolean }) {
  const destination = collection.slug ? `/collections/${collection.slug}` : "#order";
  const imageStyle = collection.image
    ? { backgroundImage: `url(${collection.image})`, backgroundColor: collection.backgroundColor ?? undefined }
    : { backgroundColor: collection.backgroundColor ?? "#f4f1eb" };

  return (
    <article className={styles.card} aria-hidden={duplicate || undefined}>
      <Link
        href={destination}
        tabIndex={duplicate ? -1 : undefined}
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
          <p className={styles.category}>The Zari atelier</p>
          <h3 className={styles.name}>{collection.title}</h3>
          <span className={styles.view}>View piece <span aria-hidden="true">→</span></span>
        </div>
      </Link>
    </article>
  );
}

export default function Shop() {
  const [catalog, setCatalog] = useState<Collection[]>(collections);

  useEffect(() => {
    async function loadCatalog() {
      const response = await fetch("/api/catalog", { cache: "no-store" });
      if (!response.ok) return;

      const result = await response.json().catch(() => ({ collections: [] })) as { collections?: Collection[] };
      if (result.collections?.length) setCatalog(result.collections);
    }

    void loadCatalog();
  }, []);

  return (
    <Section id="shop" className={styles.section}>
      <Container>
        <FadeIn>
          <header className={styles.header}>
            <h2 className={styles.title}>Shop</h2>
          </header>
        </FadeIn>
      </Container>

      <FadeIn>
        <div className={styles.viewport}>
          <div className={styles.track}>
            {[false, true].map((duplicate) => (
              <div className={styles.group} key={String(duplicate)}>
                {catalog.map((collection) => (
                  <ShopCard
                    key={`${duplicate ? "duplicate" : "primary"}-${collection.id}`}
                    collection={collection}
                    duplicate={duplicate}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </FadeIn>
    </Section>
  );
}
