import { cn } from "@/lib/utils/cn";

type TextSize = "sm" | "md" | "lg" | "xl";

interface TextProps {
  children: React.ReactNode;
  size?: TextSize;
  className?: string;
}

const sizes = {
  sm: "text-sm leading-6",
  md: "text-base leading-7",
  lg: "text-[1.125rem] leading-8",
  xl: "text-xl leading-9",
};

export default function Text({
  children,
  size = "md",
  className,
}: TextProps) {
  return (
    <p
      className={cn(
        "body-font text-neutral-600",
        sizes[size],
        className
      )}
    >
      {children}
    </p>
  );
}
