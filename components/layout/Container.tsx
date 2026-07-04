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
        // Increased horizontal padding on desktop to push content inward
        "container mx-auto w-full px-6 lg:px-16 xl:px-32",
        className
      )}
    >
      {children}
    </div>
  );
}
