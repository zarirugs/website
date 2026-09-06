"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import styles from "./auth.module.css";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const result = await response.json().catch(() => ({})) as { error?: string };
    setLoading(false);
    if (!response.ok) {
      setMessage(result.error ?? "Unable to sign in.");
      return;
    }
    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <main className={styles.page}>
      <section className={styles.panel} aria-labelledby="login-title">
        <p className={styles.eyebrow}>ZARI · Private operations</p>
        <h1 id="login-title" className={styles.title}>Welcome back.</h1>
        <p className={styles.intro}>Sign in to manage the collection, inventory, and customer orders.</p>
        <form className={styles.form} onSubmit={submit}>
          <label>Email<input value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="email" required /></label>
          <label>Password
            <span className={styles.passwordControl}>
              <input value={password} onChange={(event) => setPassword(event.target.value)} type={showPassword ? "text" : "password"} autoComplete="current-password" required />
              <button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? "Hide" : "Show"}</button>
            </span>
          </label>
          {message && <p className={styles.message} role="alert">{message}</p>}
          <button className={styles.submit} disabled={loading}>{loading ? "Signing in…" : "Sign in"}</button>
        </form>
        <p className={styles.footer}>First-time setup? <Link href="/bootstrap">Create the owner account</Link></p>
      </section>
    </main>
  );
}
