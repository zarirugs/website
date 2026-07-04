import { cn } from "@/lib/utils/cn";

interface SectionProps {
  children: React.ReactNode;
  id?: string;
  className?: string;
}

export default function Section({
  children,
  id,
  className,
}: SectionProps) {
  return (
    <section
      id={id}
      className={cn(
        "py-28 lg:py-40",
        className
      )}
    >
      {children}
    </section>
  );
}