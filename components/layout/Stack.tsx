import { cn } from "@/lib/utils/cn";

interface StackProps {
  children: React.ReactNode;
  className?: string;
}

export default function Stack({
  children,
  className,
}: StackProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-6",
        className
      )}
    >
      {children}
    </div>
  );
}