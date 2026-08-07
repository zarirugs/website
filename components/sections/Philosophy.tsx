import Container from "@/components/layout/Container";
import Section from "@/components/layout/Section";
import { FadeIn, Stagger } from "@/components/motion";
import { Heading, Text, Eyebrow } from "@/components/typography";
import { philosophy } from "@/lib/data/philosophy";

export default function Philosophy() {
  return (
    <Section id="craftsmanship" className="bg-[#f8f6f1]">
      <Container>
        <FadeIn>
          <div className="max-w-xl">
            <Eyebrow className="mb-6">Our Ethos</Eyebrow>
            <Heading as="h2" size="xl">
              {philosophy.title}
            </Heading>

            <Text size="lg" className="mt-10 text-neutral-500 leading-loose">
              {philosophy.description}
            </Text>
          </div>
        </FadeIn>

        <Stagger 
          className="grid gap-12 lg:gap-16 md:grid-cols-3"
          style={{ marginTop: '80px' }}
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
