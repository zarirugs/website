import Container from "@/components/layout/Container";
import Section from "@/components/layout/Section";
import { FadeIn, Stagger } from "@/components/motion";
import { Heading, Text, Eyebrow } from "@/components/typography";
import { philosophy } from "@/lib/data/philosophy";
import styles from "./Philosophy.module.css";

export default function Philosophy() {
  return (
    <Section id="craftsmanship" className={styles.section}>
      <Container>
        <FadeIn>
          <div className={styles.header}>
            <div className={styles.intro}>
              <Eyebrow className="mb-6">Our Ethos</Eyebrow>
              <Heading as="h2" size="wide" className={styles.title}>
                {philosophy.title}
              </Heading>
            </div>

            <Text size="md" className={styles.copy}>
              {philosophy.description}
            </Text>
          </div>
        </FadeIn>

        <Stagger
          className="mt-16 grid gap-10 md:mt-20 md:grid-cols-3 lg:gap-14"
        >
          {philosophy.values.map((value) => (
            <div key={value.title} className="border-t border-neutral-300/60 pt-8">
              <Heading as="h3" size="md">
                {value.title}
              </Heading>
              <Text className="mt-5 text-[14px] leading-loose text-neutral-500">
                {value.description}
              </Text>
            </div>
          ))}
        </Stagger>
      </Container>
    </Section>
  );
}
