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
        "text-[10px] font-medium uppercase tracking-[0.2em] text-neutral-500",
        className
      )}
    >
      {children}
    </span>
  );
}
