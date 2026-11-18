"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import AuthFrame from "./AuthFrame";
import { requestJson } from "@/lib/client/api";
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
    try {
      await requestJson("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: email.trim(), password }),
      });
      router.replace("/dashboard");
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to connect. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthFrame
      title="Welcome back."
      intro="Sign in to manage your collections, inventory and customer orders."
    >
      <form className={styles.form} onSubmit={submit} aria-busy={loading}>
        <fieldset disabled={loading} className={styles.fields}>
          <label>
            Email
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              autoComplete="email"
              maxLength={254}
              autoCapitalize="none"
              spellCheck={false}
              required
            />
          </label>
          <label>
            Password
            <span className={styles.passwordControl}>
              <input
                aria-label="Password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                aria-pressed={showPassword}
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </span>
          </label>
        </fieldset>
        {message && (
          <p className={styles.message} role="alert">
            {message}
          </p>
        )}
        <button className={styles.submit} disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <p className={styles.footer}>
        First-time setup?{" "}
        <Link href="/bootstrap">Create the owner account</Link>
      </p>
    </AuthFrame>
  );
}
