import Container from "@/components/layout/Container";
import Section from "@/components/layout/Section";
import { FadeIn, Stagger } from "@/components/motion";
import { Heading, Text, Eyebrow } from "@/components/typography";
import CollectionCard from "./CollectionCard";
import { collections } from "@/lib/data/collections";

export default function Collections() {
  return (
    <Section id="collections">
      <Container>
        <FadeIn>
          <div className="max-w-3xl">
            <Eyebrow className="mb-6">The Archives</Eyebrow>
            <Heading as="h2" size="xl">
              Signature Collections
            </Heading>

            <Text size="lg" className="mt-8">
              Designed for extraordinary residences, luxury hotels, and iconic interiors around the world. Every collection celebrates the centuries-old artistry of Bhadohi while embracing contemporary design.
            </Text>
          </div>
        </FadeIn>

        <Stagger className="mt-24 grid gap-16 md:grid-cols-2 xl:grid-cols-3">
          {collections.map((collection) => (
            <CollectionCard key={collection.id} collection={collection} />
          ))}
        </Stagger>
      </Container>
    </Section>
  );
}
