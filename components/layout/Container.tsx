import { cn } from "@/lib/utils/cn";

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
}

export default function Container({
  children,
  className,
}: ContainerProps) {
  return (
    <div
      className={cn(
        "container mx-auto w-full px-6 lg:px-10 xl:px-12",
        className
      )}
    >
      {children}
    </div>
  );
}