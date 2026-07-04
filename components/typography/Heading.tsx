import { cn } from "@/lib/utils/cn";

type HeadingTag =
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "h5"
  | "h6";

type HeadingSize =
  | "display"
  | "hero"
  | "xl"
  | "lg"
  | "md"
  | "sm";

interface HeadingProps {
  as?: HeadingTag;
  size?: HeadingSize;
  children: React.ReactNode;
  className?: string;
}

const sizes = {
  display:
    "text-[clamp(5rem,11vw,10rem)] leading-[0.9] tracking-[-0.06em]",

  hero:
    "text-[clamp(4rem,8vw,7rem)] leading-[0.92] tracking-[-0.05em]",

  xl:
    "text-[clamp(3rem,5vw,5rem)] leading-[0.96] tracking-[-0.04em]",

  lg:
    "text-[clamp(2.2rem,4vw,3.5rem)] leading-[1]",

  md:
    "text-4xl leading-tight",

  sm:
    "text-3xl leading-tight",
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
        "display-font font-light text-neutral-950",
        sizes[size],
        className
      )}
    >
      {children}
    </Tag>
  );
}