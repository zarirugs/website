"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { useStore } from "./StoreProvider";

export default function AccountPage() {
  const router = useRouter();
  const { ready, signOut, user } = useStore();

  async function logout() {
    await signOut();
    router.push("/");
    router.refresh();
  }

  return <main className="min-h-screen bg-[#f8f6f1] px-6 pb-20 pt-36 text-neutral-900 lg:px-16 xl:px-32"><div className="mx-auto max-w-3xl"><p className="text-[10px] uppercase tracking-[0.25em] text-[#8b7442]">Your ZARI account</p><h1 className="display-font mt-3 text-4xl tracking-[0.08em]">Account</h1>{!ready ? <p className="mt-10 text-sm text-neutral-500">Loading your account…</p> : !user ? <section className="mt-10 bg-white p-8 shadow-sm"><p className="text-sm text-neutral-600">Please sign in to view your account.</p><Link href="/login" className="mt-6 inline-flex bg-neutral-950 px-6 py-4 text-[10px] uppercase tracking-[0.18em] text-white">Sign in</Link></section> : <section className="mt-10 bg-white p-8 shadow-sm"><p className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">Signed in as</p><h2 className="display-font mt-3 text-3xl tracking-[0.06em]">{user.fullName}</h2><p className="mt-2 text-sm text-neutral-600">{user.email}</p><div className="mt-8 flex flex-wrap gap-4"><Link href="/cart" className="bg-neutral-950 px-6 py-4 text-[10px] uppercase tracking-[0.18em] text-white">View shopping bag</Link><button onClick={() => void logout()} className="border border-neutral-300 px-6 py-4 text-[10px] uppercase tracking-[0.18em] text-neutral-700">Sign out</button></div></section>}</div></main>;
}
