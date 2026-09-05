"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { useStore } from "./StoreProvider";

export default function AuthForm({ mode }: { mode: "login" | "register" }) {
  const isRegistering = mode === "register";
  const router = useRouter();
  const { refresh } = useStore();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
    const result = await response.json().catch(() => ({}));
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
    <main className="min-h-screen bg-[#f8f6f1] px-6 py-12 text-neutral-900 md:px-12">
      <div className="mx-auto grid min-h-[calc(100vh-6rem)] max-w-5xl overflow-hidden bg-white shadow-[0_30px_100px_rgba(0,0,0,.08)] lg:grid-cols-[.85fr_1.15fr]">
        <section className="bg-neutral-950 p-8 text-white md:p-12">
          <Link href="/" className="display-font text-3xl tracking-[0.25em]">ZARI</Link>
          <div className="mt-20 max-w-sm"><p className="text-[10px] uppercase tracking-[0.28em] text-[#b89b5e]">Private account</p><h1 className="display-font mt-6 text-4xl leading-tight tracking-[0.07em]">{isRegistering ? "Create your archive" : "Welcome back"}</h1><p className="mt-6 text-sm leading-loose text-neutral-400">Save your selected pieces, return to your cart across devices, and receive a more considered order experience.</p></div>
        </section>
        <section className="flex items-center p-8 md:p-12"><div className="mx-auto w-full max-w-md"><p className="text-[10px] uppercase tracking-[0.22em] text-[#8b7442]">{isRegistering ? "New customer" : "Customer sign in"}</p><h2 className="display-font mt-3 text-3xl tracking-[0.07em]">{isRegistering ? "Your details" : "Sign in to your account"}</h2><form onSubmit={submit} className="mt-10 grid gap-6">{isRegistering && <label className="grid gap-2 text-xs text-neutral-600">Full name<input required name="fullName" autoComplete="name" maxLength={120} className="border-b border-neutral-300 px-0 py-3 text-sm outline-none focus:border-neutral-900" /></label>}<label className="grid gap-2 text-xs text-neutral-600">Email address<input required name="email" type="email" autoComplete="email" maxLength={254} className="border-b border-neutral-300 px-0 py-3 text-sm outline-none focus:border-neutral-900" /></label><label className="grid gap-2 text-xs text-neutral-600">Password<input required name="password" type="password" autoComplete={isRegistering ? "new-password" : "current-password"} minLength={10} maxLength={128} className="border-b border-neutral-300 px-0 py-3 text-sm outline-none focus:border-neutral-900" />{isRegistering && <span className="text-[11px] leading-relaxed text-neutral-400">Use at least 10 characters.</span>}</label>{error && <p role="alert" className="text-sm text-red-700">{error}</p>}<button disabled={submitting} className="mt-2 bg-neutral-950 px-6 py-4 text-[10px] uppercase tracking-[0.2em] text-white transition-colors hover:bg-[#8b7442] disabled:opacity-60">{submitting ? "Please wait…" : isRegistering ? "Create account" : "Sign in"}</button></form><p className="mt-8 text-sm text-neutral-500">{isRegistering ? "Already have an account?" : "New to ZARI?"} <Link href={isRegistering ? "/login" : "/register"} className="text-neutral-900 underline underline-offset-4">{isRegistering ? "Sign in" : "Create an account"}</Link></p></div></section>
      </div>
    </main>
  );
}
