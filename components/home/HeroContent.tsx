import { Container } from "@/components/layout";
import {
  Heading,
  Text,
  Eyebrow,
} from "@/components/typography";

import { Button } from "@/components/buttons";

export default function HeroContent() {
  return (
    <Container>
      <div
        className="
          flex
          h-screen
          items-center
        "
      >
        <div className="max-w-2xl">
          <Eyebrow className="text-white/80">
            THE HOUSE OF ZARI
          </Eyebrow>

          <Heading
            as="h1"
            size="display"
            className="
              mt-8
              text-white
              max-w-4xl
            "
          >
            Rugs Crafted
            <br />
            For Timeless Homes
          </Heading>

          <Text
            className="
              mt-8
              max-w-xl
              text-white/80
              leading-8
            "
          >
            Hand-knotted masterpieces from Bhadohi,
            crafted by master artisans using the finest
            natural fibres to create rugs that last for
            generations.
          </Text>

          <div className="mt-12">
            <Button>
              Explore Collection
            </Button>
          </div>
        </div>
      </div>
    </Container>
  );
}