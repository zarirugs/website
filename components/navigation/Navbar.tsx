"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils/cn";
import { navigation } from "@/lib/data/navigation";

import Container from "../layout/Container";
import NavLink from "./NavLink";
import MobileMenu from "./MobileMenu";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 30);
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
        scrolled
          ? "bg-white/70 backdrop-blur-xl border-b border-black/5"
          : "bg-transparent"
      )}
    >
      <Container>
        <nav className="flex h-24 items-center justify-between">

          <Link
            href="/"
            className="
              display-font
              text-4xl
              tracking-[0.25em]
            "
          >
            ZARI
          </Link>

          <div className="hidden lg:flex items-center gap-12">
            {navigation.map((item) => (
              <NavLink
                key={item.title}
                href={item.href}
              >
                {item.title}
              </NavLink>
            ))}
          </div>

          <MobileMenu />

        </nav>
      </Container>
    </header>
  );
}