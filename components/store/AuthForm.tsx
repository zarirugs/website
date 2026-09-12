"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { useStore } from "./StoreProvider";
import styles from "./AuthForm.module.css";

export default function AuthForm({ mode }: { mode: "login" | "register" }) {
  const isRegistering = mode === "register";
  const router = useRouter();
  const { refresh } = useStore();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    const fields = new FormData(event.currentTarget);
    const response = await fetch(`/api/auth/${mode === "login" ? "login" : "register"}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: fields.get("fullName"),
        email: fields.get("email"),
        password: fields.get("password"),
      }),
    });
    const result = await response.json().catch(() => ({})) as { error?: string };
    setSubmitting(false);

    if (!response.ok) {
      setError(result.error ?? "We could not complete your request.");
      return;
    }

    await refresh();
    router.push("/");
    router.refresh();
  }

  return (
    <main className={styles.page}>
      <div className={styles.panel}>
        <section className={styles.intro}>
          <Link href="/" className={styles.brand}>ZARI</Link>
          <div className={styles.introContent}>
            <p className={styles.eyebrow}>Private account</p>
            <h1 className={styles.title}>{isRegistering ? "Create your archive" : "Welcome back"}</h1>
            <p className={styles.introCopy}>Save your selected pieces, return to your cart across devices, and receive a more considered order experience.</p>
          </div>
        </section>
        <section className={styles.formSide}>
          <div className={styles.formInner}>
            <p className={styles.formEyebrow}>{isRegistering ? "New customer" : "Customer sign in"}</p>
            <h2 className={styles.formTitle}>{isRegistering ? "Your details" : "Sign in to your account"}</h2>
            <form onSubmit={submit} className={styles.form}>
              {isRegistering && (
                <label className={styles.field}>
                  Full name
                  <input required name="fullName" autoComplete="name" maxLength={120} className={styles.input} />
                </label>
              )}
              <label className={styles.field}>
                Email address
                <input required name="email" type="email" autoComplete="email" maxLength={254} className={styles.input} />
              </label>
              <label className={styles.field}>
                Password
                <span className={styles.passwordControl}>
                  <input required name="password" type={showPassword ? "text" : "password"} autoComplete={isRegistering ? "new-password" : "current-password"} minLength={10} maxLength={128} className={`${styles.input} ${styles.passwordInput}`} />
                  <button
                    type="button"
                    className={styles.passwordToggle}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    aria-pressed={showPassword}
                    onClick={() => setShowPassword((visible) => !visible)}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </span>
                {isRegistering && <span className={styles.helper}>Use at least 10 characters.</span>}
              </label>
              {error && <p role="alert" className={styles.error}>{error}</p>}
              <button disabled={submitting} className={styles.submit}>{submitting ? "Please wait…" : isRegistering ? "Create account" : "Sign in"}</button>
            </form>
            <p className={styles.switchPrompt}>
              {isRegistering ? "Already have an account?" : "New to ZARI?"}{" "}
              <Link href={isRegistering ? "/login" : "/register"} className={styles.switchLink}>{isRegistering ? "Sign in" : "Create an account"}</Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
