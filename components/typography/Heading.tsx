import { cn } from "@/lib/utils/cn";

type HeadingTag = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
type HeadingSize = "display" | "hero" | "xl" | "lg" | "md" | "sm";

interface HeadingProps {
  as?: HeadingTag;
  size?: HeadingSize;
  children: React.ReactNode;
  className?: string;
}

// Drastically reduced all sizes for a highly refined, editorial look
const sizes = {
  display: "text-[clamp(3rem,7vw,6rem)] leading-[0.95] tracking-[-0.03em]",
  hero: "text-[clamp(2.5rem,5vw,4.5rem)] leading-[1] tracking-[-0.02em]",
  xl: "text-4xl lg:text-5xl leading-[1.1] tracking-[-0.02em]",
  lg: "text-2xl lg:text-3xl leading-[1.2] tracking-[-0.01em]",
  md: "text-xl lg:text-2xl leading-snug font-normal",
  sm: "text-lg leading-snug font-normal",
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
