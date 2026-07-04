import { cn } from "@/lib/utils/cn";

interface Props {
  children: React.ReactNode;
  className?: string;
}

export default function Label({
  children,
  className,
}: Props) {
  return (
    <span
      className={cn(
        "text-sm uppercase tracking-[0.24em] text-neutral-500",
        className
      )}
    >
      {children}
    </span>
  );
}