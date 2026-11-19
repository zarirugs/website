"use client";
import { useRef, useState, type FormEvent } from "react";
export default function NewsletterForm() {
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const [status, setStatus] = useState({ error: false, message: "" });
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (lock.current) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    lock.current = true; setBusy(true); setStatus({ error: false, message: "" });
    try {
      const response = await fetch("/api/newsletter", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: data.get("email"), website: data.get("website") }) });
      const result = await response.json() as { message?: string; error?: string };
      if (!response.ok || !result.message) throw new Error(result.error || "We could not record your signup. Please try again.");
      form.reset(); setStatus({ error: false, message: result.message });
    } catch (reason) { setStatus({ error: true, message: reason instanceof Error ? reason.message : "Please check your connection and try again." }); }
    finally { lock.current = false; setBusy(false); }
  }
  return <form onSubmit={submit}>
    <label htmlFor="newsletter-email" className="sr-only">Email address for ZARI updates</label>
    <div className="relative flex items-center border-b border-neutral-700 pb-3"><input id="newsletter-email" name="email" type="email" required maxLength={254} autoComplete="email" placeholder="Email address" disabled={busy} className="w-full bg-transparent pr-16 text-sm text-white outline-none" /><button disabled={busy} type="submit" className="absolute right-0 text-xs uppercase tracking-widest text-neutral-300 disabled:opacity-50">{busy ? "Joining…" : "Join"}</button></div>
    <label aria-hidden="true" className="sr-only">Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
    <p className="mt-3 text-xs leading-relaxed text-neutral-400">Join to register your interest in ZARI updates. <a href="/privacy" className="underline">Your information</a></p>
    {status.message && <p role={status.error ? "alert" : "status"} className="mt-3 text-xs leading-relaxed text-neutral-200">{status.message}</p>}
  </form>;
}
