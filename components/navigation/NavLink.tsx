"use client";

import Link from "next/link";
import { cn } from "@/lib/utils/cn";

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
}

export default function NavLink({
  href,
  children,
}: NavLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative",
        "text-[13px]",
        "uppercase",
        "tracking-[0.24em]",
        "text-neutral-700",
        "transition-colors",
        "duration-300",
        "hover:text-black"
      )}
    >
      {children}

      <span
        className="
          absolute
          left-0
          -bottom-2
          h-px
          w-0
          bg-black
          transition-all
          duration-300
          group-hover:w-full
        "
      />
    </Link>
  );
}