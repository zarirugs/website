"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import Container from "@/components/layout/Container";
import { useStore } from "./StoreProvider";
import styles from "./AccountPage.module.css";

export default function AccountPage() {
  const router = useRouter();
  const { ready, signOut, user } = useStore();

  async function logout() {
    await signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <main className={styles.page}>
      <Container>
        <div className={styles.content}>
          <header className={styles.intro}>
            <p className={styles.eyebrow}>Your ZARI account</p>
            <h1 className={styles.title}>Account</h1>
            <p className={styles.description}>Manage your saved selections and continue your order with the atelier.</p>
          </header>

          {!ready ? (
            <p className={styles.loading}>Loading your account…</p>
          ) : !user ? (
            <section className={styles.card}>
              <p className={styles.cardEyebrow}>Private account</p>
              <h2 className={styles.cardTitle}>Sign in to continue</h2>
              <p className={styles.cardCopy}>View your saved selections and shopping bag from one considered place.</p>
              <Link href="/login" className={styles.primaryAction}>Sign in</Link>
            </section>
          ) : (
            <section className={styles.card}>
              <div className={styles.profile}>
                <div>
                  <p className={styles.cardEyebrow}>Signed in as</p>
                  <h2 className={styles.cardTitle}>{user.fullName}</h2>
                  <p className={styles.email}>{user.email}</p>
                </div>
                <span className={styles.monogram} aria-hidden="true">{user.fullName.charAt(0).toUpperCase()}</span>
              </div>

              <div className={styles.actions}>
                <Link href="/cart" className={styles.primaryAction}>View shopping bag</Link>
                <button onClick={() => void logout()} className={styles.secondaryAction}>Sign out</button>
              </div>
            </section>
          )}
        </div>
      </Container>
    </main>
  );
}
