import Container from "@/components/layout/Container";
import Section from "@/components/layout/Section";

import { FadeIn, Stagger } from "@/components/motion";

import Heading from "@/components/typography/Heading";
import Text from "@/components/typography/Text";

import { philosophy } from "@/lib/data/philosophy";

export default function Philosophy() {
  return (
    <Section id="craftsmanship">
      <Container>
        <FadeIn>
          <div className="max-w-3xl">
            <Heading
              as="h2"
              size="hero"
            >
              {philosophy.title}
            </Heading>

            <Text
              size="lg"
              className="mt-8"
            >
              {philosophy.description}
            </Text>
          </div>
        </FadeIn>

        <Stagger
          className="
            mt-20
            grid
            gap-12
            md:grid-cols-3
          "
        >
          {philosophy.values.map((value) => (
            <div
              key={value.title}
              className="
                border-t
                border-neutral-200
                pt-8
              "
            >
              <Heading
                as="h3"
                size="lg"
              >
                {value.title}
              </Heading>

              <Text className="mt-4">
                {value.description}
              </Text>
            </div>
          ))}
        </Stagger>
      </Container>
    </Section>
  );
}