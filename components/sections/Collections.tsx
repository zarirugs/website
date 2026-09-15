"use client";

import { useEffect, useState } from "react";

import Container from "@/components/layout/Container";
import Section from "@/components/layout/Section";
import { FadeIn, Stagger } from "@/components/motion";
import { Heading, Text, Eyebrow } from "@/components/typography";
import CollectionCard from "./CollectionCard";
import { collections, type Collection } from "@/lib/data/collections";
import styles from "./Collections.module.css";

export default function Collections() {
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
    <Section id="collections" className={styles.section}>
      <Container>
        <FadeIn>
          <div className={styles.header}>
            <div className={styles.intro}>
              <Eyebrow className={styles.eyebrow}>The archives</Eyebrow>
              <Heading as="h2" size="xl" className={styles.title}>
                Signature Collections
              </Heading>
            </div>

            <Text size="md" className={styles.copy}>
              Designed for extraordinary residences, luxury hotels, and iconic
              interiors. Each collection celebrates the artistry of Bhadohi in a
              quietly contemporary language.
            </Text>
          </div>
        </FadeIn>

        <Stagger className={styles.grid}>
          {catalog.map((collection) => (
            <CollectionCard key={collection.id} collection={collection} />
          ))}
        </Stagger>
      </Container>
    </Section>
  );
}
