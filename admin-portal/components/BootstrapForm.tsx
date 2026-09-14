"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import styles from "./auth.module.css";

export default function BootstrapForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [bootstrapToken, setBootstrapToken] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    const response = await fetch("/api/auth/bootstrap", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName, email, password, bootstrapToken }),
    });
    const result = await response.json().catch(() => ({})) as { error?: string };
    setLoading(false);
    if (!response.ok) {
      setMessage(result.error ?? "Unable to create the owner account.");
      return;
    }
    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <main className={styles.page}>
      <section className={styles.panel} aria-labelledby="setup-title">
        <p className={styles.eyebrow}>ZARI · Private operations</p>
        <h1 id="setup-title" className={styles.title}>Set up the owner.</h1>
        <p className={styles.intro}>This can only be completed once. The setup token is never saved in this browser.</p>
        <form className={styles.form} onSubmit={submit}>
          <label>Full name<input value={fullName} onChange={(event) => setFullName(event.target.value)} autoComplete="name" required /></label>
          <label>Work email<input value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="email" required /></label>
          <label>Password
            <span className={styles.passwordControl}>
              <input value={password} onChange={(event) => setPassword(event.target.value)} type={showPassword ? "text" : "password"} minLength={12} autoComplete="new-password" required />
              <button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? "Hide" : "Show"}</button>
            </span>
          </label>
          <label>One-time setup token<input value={bootstrapToken} onChange={(event) => setBootstrapToken(event.target.value)} type="password" autoComplete="off" required /></label>
          {message && <p className={styles.message} role="alert">{message}</p>}
          <button className={styles.submit} disabled={loading}>{loading ? "Creating…" : "Create owner account"}</button>
        </form>
        <p className={styles.footer}><Link href="/login">Back to sign in</Link></p>
      </section>
    </main>
  );
}
