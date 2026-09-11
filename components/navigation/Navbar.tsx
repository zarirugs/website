"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ShoppingBag, UserRound } from "lucide-react";

import { cn } from "@/lib/utils/cn";
import { navigation } from "@/lib/data/navigation";

import Container from "../layout/Container";
import NavLink from "./NavLink";
import MobileMenu from "./MobileMenu";
import { useStore } from "@/components/store";

type NavbarProps = {
  surface?: "overlay" | "solid";
};

export default function Navbar({ surface = "overlay" }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const { cart, ready, user } = useStore();
  const isSolid = surface === "solid";

  function destination(href: string) {
    return href.startsWith("#") && pathname !== "/" ? `/${href}` : href;
  }

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
        <nav className="flex h-20 items-center justify-between md:h-24">

          <Link
            href="/"
            className="
              display-font
              text-[2rem]
              tracking-[0.22em]
              md:text-[2.25rem]
            "
          >
            ZARI
          </Link>

          <div className="hidden items-center gap-10 lg:flex xl:gap-12">
            {navigation.map((item) => (
              <NavLink
                key={item.title}
                href={destination(item.href)}
              >
                {item.title}
              </NavLink>
            ))}
          </div>

          <div className="ml-auto mr-8 hidden items-center gap-6 lg:flex">
            <Link href={user ? "/account" : "/login"} className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] transition-opacity hover:opacity-60">
              <UserRound size={16} strokeWidth={1.5} />
              <span>{user ? user.fullName.split(" ")[0] : "Sign in"}</span>
            </Link>
            <Link href="/cart" className="relative inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] transition-opacity hover:opacity-60">
              <ShoppingBag size={17} strokeWidth={1.5} />
              <span>Bag</span>
              {ready && cart.itemCount > 0 && <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-[#b89b5e] px-1 text-[9px] text-white">{cart.itemCount}</span>}
            </Link>
          </div>

          <MobileMenu />

        </nav>
      </Container>
    </header>
  );
}
