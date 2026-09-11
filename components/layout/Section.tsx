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
      className={cn("w-full py-[var(--section-space)]", className)}
    >
      {children}
    </section>
  );
}
