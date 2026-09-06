import { Container } from "@/components/layout";
import {
  Heading,
  Text,
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
          {/* Changed size from "display" to "xl" to reduce bulkiness */}
          <Heading
            as="h1"
            size="xl"
            className="
              mt-8
              text-white
              max-w-2xl
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
            <Button href="#collections">
              Explore Collection
            </Button>
          </div>
        </div>
      </div>
    </Container>
  );
}
