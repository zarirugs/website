"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { AuthenticatedAdmin } from "@/lib/server/auth";
import { requestJson } from "@/lib/client/api";
import { Feedback, useFeedback } from "./Feedback";
import styles from "./shell.module.css";

export type WorkspaceView = "overview" | "categories" | "media" | "orders";
const navigation = [
  ["overview", "Overview", "01"],
  ["categories", "Collections", "02"],
  ["media", "Media library", "03"],
  ["orders", "Order desk", "04"],
] as const;

export default function AdminShell({
  admin,
  active,
  children,
}: {
  admin: AuthenticatedAdmin;
  active: WorkspaceView;
  children: ReactNode;
}) {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);
  const { feedback, failure } = useFeedback();
  async function signOut() {
    setSigningOut(true);
    try {
      await requestJson("/api/auth/logout", { method: "POST" });
      router.replace("/login");
      router.refresh();
    } catch (error) {
      failure(error);
      setSigningOut(false);
    }
  }
  return (
    <div className={styles.shell}>
      <a className={styles.skipLink} href="#workspace">
        Skip to workspace
      </a>
      <aside className={styles.sidebar}>
        <Link
          className={styles.brand}
          href="/dashboard"
          aria-label="ZARI operations home"
        >
          ZARI<span>Private operations</span>
        </Link>
        <p className={styles.navLabel}>The atelier</p>
        <nav className={styles.nav} aria-label="Operations navigation">
          {navigation.map(([view, label, number]) => (
            <Link
              key={view}
              href={
                view === "overview" ? "/dashboard" : `/dashboard?view=${view}`
              }
              className={active === view ? styles.current : undefined}
              aria-current={active === view ? "page" : undefined}
            >
              <span>{number}</span>
              {label}
            </Link>
          ))}
        </nav>
        <div className={styles.sidebarFoot}>
          <a
            href="https://zarirugs.com"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.storefront}
          >
            View storefront <span aria-hidden="true">↗</span>
          </a>
          <div className={styles.identity}>
            <span className={styles.avatar} aria-hidden="true">
              {admin.fullName.trim().slice(0, 1).toUpperCase()}
            </span>
            <p>
              {admin.fullName}
              <span>{admin.role}</span>
            </p>
          </div>
          <button
            className={styles.signOut}
            onClick={() => void signOut()}
            disabled={signingOut}
          >
            {signingOut ? "Signing out…" : "Sign out"}
          </button>
        </div>
      </aside>
      <main id="workspace" tabIndex={-1} className={styles.workspace}>
        <Feedback value={feedback} />
        {children}
        <footer className={styles.footer}>
          ZARI · Woven with care. Managed with intention.
        </footer>
      </main>
    </div>
  );
}
