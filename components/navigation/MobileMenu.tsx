"use client";

import { Menu, X } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { navigation } from "@/lib/data/navigation";
import { useStore } from "@/components/store";

export default function MobileMenu() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { cart, user } = useStore();

  function destination(href: string) {
    return href.startsWith("#") && pathname !== "/" ? `/${href}` : href;
  }

  return (
    <>
      <button
        className="inline-flex h-10 w-10 items-center justify-start"
        onClick={() => setOpen(!open)}
        aria-label="Menu"
        aria-expanded={open}
      >
        <Menu size={22} strokeWidth={1.5} />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/20 text-neutral-900 backdrop-blur-[2px]"
          onClick={() => setOpen(false)}
        >
          <aside
            aria-label="Site navigation"
            aria-modal="true"
            className="absolute inset-y-0 left-0 flex w-full max-w-[44rem] flex-col justify-center bg-white px-[var(--page-gutter)] shadow-[20px_0_60px_rgba(0,0,0,0.12)] sm:w-[60vw]"
            role="dialog"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="absolute right-[var(--page-gutter)] top-7 text-neutral-900 md:top-9"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
            >
              <X size={26} strokeWidth={1.5} />
            </button>

            <nav className="flex flex-col gap-7">
              {navigation.map((item) => (
                <Link
                  key={item.title}
                  href={destination(item.href)}
                  onClick={() => setOpen(false)}
                  className="display-font text-[clamp(2.25rem,3vw,3.5rem)] leading-none tracking-[0.04em] transition-colors hover:text-[#B89B5E]"
                >
                  {item.title}
                </Link>
              ))}
            </nav>

            <div className="mt-12 flex w-36 items-center gap-6 border-t border-neutral-300 pt-6 text-[10px] uppercase tracking-[0.18em]">
              <Link href={user ? "/account" : "/login"} onClick={() => setOpen(false)} className="hover:text-[#B89B5E]">
                {user ? "Account" : "Sign in"}
              </Link>
              <Link href="/cart" onClick={() => setOpen(false)} className="hover:text-[#B89B5E]">
                Bag{cart.itemCount > 0 ? ` (${cart.itemCount})` : ""}
              </Link>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
