"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import AuthFrame from "./AuthFrame";
import { requestJson } from "@/lib/client/api";
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
    try {
      await requestJson("/api/auth/bootstrap", {
        method: "POST",
        body: JSON.stringify({
          fullName,
          email: email.trim(),
          password,
          bootstrapToken,
        }),
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
      title="Set up the owner."
      intro="Create the first administrator account. You will need your one-time setup token."
    >
      <form className={styles.form} onSubmit={submit} aria-busy={loading}>
        <fieldset disabled={loading} className={styles.fields}>
          <label>
            Full name
            <input
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              autoComplete="name"
              required
            />
          </label>
          <label>
            Work email
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
                minLength={12}
                maxLength={128}
                autoComplete="new-password"
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
          <label>
            One-time setup token
            <input
              value={bootstrapToken}
              onChange={(event) => setBootstrapToken(event.target.value)}
              type="password"
              autoComplete="off"
              required
            />
          </label>
        </fieldset>
        {message && (
          <p className={styles.message} role="alert">
            {message}
          </p>
        )}
        <button className={styles.submit} disabled={loading}>
          {loading ? "Creating…" : "Create owner account"}
        </button>
      </form>
      <p className={styles.footer}>
        <Link href="/login">Back to sign in</Link>
      </p>
    </AuthFrame>
  );
}
