"use client";
import { Menu, X } from "lucide-react";
import { useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { navigation } from "@/lib/data/navigation";
import { useStore } from "@/components/store";
export default function MobileMenu() {
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const previousOverflow = useRef("");
  const pathname = usePathname();
  const { cart, user } = useStore();
  function show() { previousOverflow.current = document.body.style.overflow; document.body.style.overflow = "hidden"; dialog.current?.showModal(); setOpen(true); }
  function close() { dialog.current?.close(); document.body.style.overflow = previousOverflow.current; setOpen(false); trigger.current?.focus(); }
  function destination(href: string) { return href.startsWith("#") && pathname !== "/" ? `/${href}` : href; }
  return <>
    <button ref={trigger} className="inline-flex h-10 w-10 items-center justify-start" onClick={show} aria-label="Menu" aria-haspopup="dialog" aria-expanded={open} aria-controls="site-navigation"><Menu size={22} strokeWidth={1.5} /></button>
    <dialog id="site-navigation" ref={dialog} aria-label="Site navigation" className="fixed inset-y-0 left-0 right-auto m-0 h-[100svh] max-h-none w-full max-w-[44rem] border-0 bg-white px-[var(--page-gutter)] text-neutral-900 shadow-xl backdrop:bg-black/30 sm:w-[60vw]" onCancel={(event) => { event.preventDefault(); close(); }} onClose={() => { document.body.style.overflow = previousOverflow.current; setOpen(false); trigger.current?.focus(); }} onClick={(event) => { if (event.target === event.currentTarget) close(); }}>
      <div className="flex h-full flex-col justify-center" onClick={(event) => event.stopPropagation()}>
        <button autoFocus className="absolute right-[var(--page-gutter)] top-7 md:top-9" onClick={close} aria-label="Close menu"><X size={26} strokeWidth={1.5} /></button>
        <nav className="flex flex-col gap-7">{[...navigation, { title: "Sizing & care", href: "/buying-guide" }].map((item) => <Link key={item.title} href={destination(item.href)} onClick={close} className="display-font text-[clamp(2rem,3vw,3.5rem)] leading-none tracking-[0.04em] hover:text-[#B89B5E]">{item.title}</Link>)}</nav>
        <div className="mt-12 flex items-center gap-6 border-t border-neutral-300 pt-6 text-xs uppercase tracking-widest"><Link href={user ? "/account" : "/login"} onClick={close}>{user ? "Account" : "Sign in"}</Link><Link href="/cart" onClick={close}>Bag{cart.itemCount > 0 ? ` (${cart.itemCount})` : ""}</Link></div>
      </div>
    </dialog>
  </>;
}
