import { cn } from "@/lib/utils/cn";

type HeadingTag = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
type HeadingSize = "display" | "hero" | "xl" | "lg" | "md" | "sm";

interface HeadingProps {
  as?: HeadingTag;
  size?: HeadingSize;
  children: React.ReactNode;
  className?: string;
}

const sizes = {
  display: { fontSize: "var(--fs-heading-display)", className: "leading-[0.96] tracking-[-0.03em]" },
  hero: { fontSize: "var(--fs-hero)", className: "leading-[0.98] tracking-[-0.025em]" },
  xl: { fontSize: "var(--fs-heading-xl)", className: "leading-[1] tracking-[-0.025em]" },
  lg: { fontSize: "var(--fs-heading-lg)", className: "leading-[1.08] tracking-[-0.02em]" },
  md: { fontSize: "var(--fs-heading-md)", className: "leading-[1.14] tracking-[-0.015em] font-normal" },
  sm: { fontSize: "var(--fs-heading-sm)", className: "leading-[1.2] tracking-[-0.01em] font-normal" },
};

export default function Heading({
  as = "h2",
  size = "xl",
  children,
  className,
}: HeadingProps) {
  const Tag = as;

  return (
    <Tag
      className={cn(
        "display-font text-neutral-900",
        sizes[size].className,
        className
      )}
      style={{ fontSize: sizes[size].fontSize }}
    >
      {children}
    </Tag>
  );
}
