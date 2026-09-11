import { Container } from "@/components/layout";
import Link from "next/link";
import {
  Heading,
  Text,
} from "@/components/typography";
import styles from "./HeroContent.module.css";

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
        <div className="max-w-2xl text-white">
          <Heading
            as="h1"
            size="hero"
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

          <div className={styles.copy}>
            <Text className="text-white/80 leading-8">
              Hand-knotted masterpieces from Bhadohi,
              crafted by master artisans using the finest
              natural fibres to create rugs that last for
              generations.
            </Text>
          </div>

          <Link href="#collections" className={styles.cta}>
            Explore Collection <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </Container>
  );
}
