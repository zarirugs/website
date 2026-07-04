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
        "transition-opacity duration-300",
        // Removed hardcoded dark text so it inherits the dynamic color from Navbar
        "opacity-80 hover:opacity-100"
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
          bg-current
          transition-all
          duration-300
          group-hover:w-full
        "
      />
    </Link>
  );
}