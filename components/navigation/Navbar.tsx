"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ShoppingBag, UserRound } from "lucide-react";

import { cn } from "@/lib/utils/cn";
import Container from "../layout/Container";
import MobileMenu from "./MobileMenu";
import { useStore } from "@/components/store";

type NavbarProps = {
  surface?: "overlay" | "solid";
};

export default function Navbar({ surface = "overlay" }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const { cart, ready, user } = useStore();
  const isSolid = surface === "solid";

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 4);
    };

    onScroll();

    window.addEventListener("scroll", onScroll);

    return () => window.removeEventListener(
      "scroll",
      onScroll
    );
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-500",
        // A solid surface keeps navigation readable over every section.
        isSolid || scrolled
          ? "bg-white border-b border-black/5 text-neutral-900 shadow-sm"
          : "bg-transparent text-white"
      )}
    >
      <Container>
        <nav className="grid h-20 grid-cols-[1fr_auto_1fr] items-center md:h-24">
          <MobileMenu />

          <Link
            href="/"
            style={{ fontFamily: "var(--font-wordmark)" }}
            className="
              col-start-2
              text-[2rem]
              tracking-[0.18em]
              md:text-[2.25rem]
            "
          >
            ZARI
          </Link>

          <div className="col-start-3 flex items-center justify-self-end gap-4 text-[10px] uppercase tracking-[0.16em] sm:gap-6">
            <Link href={user ? "/account" : "/login"} className="hidden items-center gap-2 transition-opacity hover:opacity-60 sm:inline-flex">
              <UserRound size={16} strokeWidth={1.5} />
              <span>{user ? user.fullName.split(" ")[0] : "Sign in"}</span>
            </Link>
            <Link href="/cart" className="relative inline-flex items-center gap-2 transition-opacity hover:opacity-60">
              <ShoppingBag size={17} strokeWidth={1.5} />
              <span className="hidden sm:inline">Bag</span>
              {ready && cart.itemCount > 0 && <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-[#b89b5e] px-1 text-[9px] text-white">{cart.itemCount}</span>}
            </Link>
          </div>
        </nav>
      </Container>
    </header>
  );
}
