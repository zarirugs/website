"use client";

import { Menu, X } from "lucide-react";
import { useState } from "react";
import Link from "next/link";

import { navigation } from "@/lib/data/navigation";
import { useStore } from "@/components/store";

export default function MobileMenu() {
  const [open, setOpen] = useState(false);
  const { cart, user } = useStore();

  return (
    <>
      <button
        className="lg:hidden"
        onClick={() => setOpen(!open)}
        aria-label="Menu"
      >
        {open ? <X size={28} /> : <Menu size={28} />}
      </button>

      {open && (
        <div
          className="
            fixed
            inset-0
            z-50
            bg-white/95
            text-neutral-900
            backdrop-blur-xl
            flex
            flex-col
            items-center
            justify-center
            gap-10
          "
        >
          <button
            className="absolute right-8 top-8 text-neutral-900"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
          >
            <X size={30} />
          </button>

          {navigation.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              onClick={() => setOpen(false)}
              className="
                display-font
                text-3xl
                tracking-[0.12em]
                transition-colors
                hover:text-[#B89B5E]
              "
            >
              {item.title}
            </Link>
          ))}

          <div className="mt-4 flex items-center gap-6 border-t border-neutral-300 pt-6 text-[10px] uppercase tracking-[0.18em]">
            <Link href={user ? "/account" : "/login"} onClick={() => setOpen(false)} className="hover:text-[#B89B5E]">
              {user ? "Account" : "Sign in"}
            </Link>
            <Link href="/cart" onClick={() => setOpen(false)} className="hover:text-[#B89B5E]">
              Bag{cart.itemCount > 0 ? ` (${cart.itemCount})` : ""}
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
