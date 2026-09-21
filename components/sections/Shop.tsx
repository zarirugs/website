"use client";

import Link from "next/link";
import { ArrowUpRight, Plus } from "lucide-react";
import { useState } from "react";

import Container from "@/components/layout/Container";
import Section from "@/components/layout/Section";
import { type Collection } from "@/lib/data/collections";
import { site } from "@/lib/data/site";
import ShopCatalogue from "@/components/store/ShopCatalogue";
import { useCatalog } from "@/lib/store/use-catalog";
import styles from "./Shop.module.css";

type ShopProps = {
  headingAs?: "h1" | "h2";
  headingLink?: boolean;
  variant?: "carousel" | "catalogue";
};

function CollectionPhoto({ collection }: { collection: Collection }) {
  const [failed, setFailed] = useState(false);
  const src = process.env.NODE_ENV === "development" && collection.image.startsWith("/api/media/media-default-")
    ? `${site.url}${collection.image}` : collection.image;

  return <div className={styles.visual} style={{ backgroundColor: collection.backgroundColor ?? undefined }}>
    {src && !failed ? (
      // Collection photographs can be hosted on an administrator's own media host.
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={`${collection.title} rug collection`} loading="lazy" decoding="async" style={{ objectFit: collection.imageFit ?? "cover" }} onError={() => setFailed(true)} />
    ) : <span className={styles.placeholder}>Photograph coming soon</span>}
  </div>;
}

function HomeShop({ headingAs: Heading = "h2" }: ShopProps) {
  const { collections } = useCatalog();
  const [visibleCount, setVisibleCount] = useState(6);
  const remaining = Math.max(0, collections.length - visibleCount);

  return (
    <Section id="shop" className={styles.section}>
      <Container>
        <header className={styles.header}>
          <Heading className={styles.title}>The collections</Heading>
          <Link href="/shop" className={styles.allRugs}>View all rugs <ArrowUpRight size={18} strokeWidth={1.25} /></Link>
        </header>

        <div className={styles.collections} id="home-collections" data-remainder={Math.min(visibleCount, collections.length) % 3}>
          {collections.slice(0, visibleCount).map((collection) => (
            <article key={collection.id} className={styles.card}>
              <Link href={collection.slug ? `/collections/${collection.slug}` : "/shop"} className={styles.cardLink}>
                <CollectionPhoto key={collection.image} collection={collection} />
                <div className={styles.caption}><h3>{collection.title}</h3><ArrowUpRight size={20} strokeWidth={1.15} aria-hidden="true" /></div>
              </Link>
            </article>
          ))}
        </div>

        {remaining > 0 && <div className={styles.moreCollections}>
          <button type="button" aria-controls="home-collections" onClick={() => setVisibleCount((count) => count + 6)}>Explore more collections ({remaining}) <Plus size={16} strokeWidth={1.25} /></button>
        </div>}
        <p className="sr-only" aria-live="polite">Showing {Math.min(visibleCount, collections.length)} of {collections.length} collections</p>


      </Container>
    </Section>
  );
}

export default function Shop(props: ShopProps) {
  return props.variant === "catalogue" ? <ShopCatalogue /> : <HomeShop {...props} />;
}
