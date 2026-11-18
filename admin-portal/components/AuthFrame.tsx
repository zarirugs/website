import type { ReactNode } from "react";
import styles from "./auth.module.css";

export default function AuthFrame({
  title,
  intro,
  children,
}: {
  title: string;
  intro: string;
  children: ReactNode;
}) {
  return (
    <main className={styles.page}>
      <div className={styles.brandPanel}>
        <a
          href="https://zarirugs.com"
          className={styles.wordmark}
          aria-label="Visit the ZARI storefront"
        >
          ZARI
        </a>
        <div className={styles.brandStory}>
          <p className={styles.eyebrow}>The private atelier</p>
          <h2>
            Care in every
            <br />
            detail.
          </h2>
          <p>
            A home for the collections we curate, the stories we share, and the
            people we serve.
          </p>
        </div>
        <p className={styles.brandFoot}>Bhadohi, India · The house of ZARI</p>
      </div>
      <section className={styles.panel} aria-labelledby="auth-title">
        <p className={styles.eyebrow}>ZARI · Private operations</p>
        <h1 id="auth-title" className={styles.title}>
          {title}
        </h1>
        <p className={styles.intro}>{intro}</p>
        {children}
      </section>
    </main>
  );
}
