import Link from "next/link";

import { cn } from "@/lib/utils/cn";

type Variant =
  | "primary"
  | "secondary"
  | "ghost";

interface ButtonProps {
  children: React.ReactNode;

  href?: string;

  variant?: Variant;

  className?: string;
}

const variants = {
  primary:
    "bg-neutral-950 text-white hover:bg-black",

  secondary:
    "border border-neutral-900 text-neutral-900 hover:bg-neutral-900 hover:text-white",

  ghost:
    "text-neutral-900 hover:text-[#B89B5E]",
};

export default function Button({
  children,
  href,
  variant = "primary",
  className,
}: ButtonProps) {
  const classes = cn(
    "inline-flex items-center justify-center",
    "h-14 px-8",
    "uppercase tracking-[0.22em]",
    "text-[12px]",
    "transition-all duration-300",
    "rounded-full",
    variants[variant],
    className
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes}>
      {children}
    </button>
  );
}