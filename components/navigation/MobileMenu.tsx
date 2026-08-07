"use client";

import { Menu, X } from "lucide-react";
import { useState } from "react";
import Link from "next/link";

import { navigation } from "@/lib/data/navigation";

export default function MobileMenu() {
  const [open, setOpen] = useState(false);

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
            bg-[#f8f6f1]
            flex
            flex-col
            items-center
            justify-center
            gap-10
          "
        >
          <button
            className="absolute right-8 top-8"
            onClick={() => setOpen(false)}
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
              "
            >
              {item.title}
            </Link>
          ))}
        </div>
      )}
    </>
  );
}