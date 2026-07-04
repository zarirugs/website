import { cn } from "@/lib/utils/cn";

interface GridProps {
  children: React.ReactNode;
  className?: string;
}

export default function Grid({
  children,
  className,
}: GridProps) {
  return (
    <div
      className={cn(
        "grid gap-8 lg:grid-cols-12",
        className
      )}
    >
      {children}
    </div>
  );
}