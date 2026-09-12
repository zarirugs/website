import Image from "next/image";

import styles from "./AtelierImage.module.css";

export default function AtelierImage() {
  return (
    <section className={styles.section} aria-label="The ZARI atelier">
      <Image
        src="/images/atelier-weaving.jpg"
        alt="Artisans weaving by hand at a loom"
        fill
        sizes="100vw"
        className={styles.image}
      />
    </section>
  );
}
