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
  lg: "text-lg leading-9",
  xl: "text-xl leading-10",
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