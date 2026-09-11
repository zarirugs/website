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
  display: "text-[clamp(3.25rem,5.75vw,5.75rem)] leading-[0.94] tracking-[-0.035em]",
  hero: "text-[clamp(2.75rem,4.5vw,4.75rem)] leading-[0.97] tracking-[-0.03em]",
  xl: "text-[clamp(2.5rem,3.5vw,4.25rem)] leading-[1] tracking-[-0.025em]",
  lg: "text-[clamp(2rem,2.5vw,2.75rem)] leading-[1.08] tracking-[-0.02em]",
  md: "text-[clamp(1.5rem,1.75vw,2rem)] leading-[1.14] tracking-[-0.015em] font-normal",
  sm: "text-[1.25rem] leading-[1.2] tracking-[-0.01em] font-normal",
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
        sizes[size],
        className
      )}
    >
      {children}
    </Tag>
  );
}
