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
      className={cn("w-full", className)}
      style={{
        // Halved symmetrical padding to prevent double-stacking gaps
        // while perfectly preserving background color boundaries
        paddingTop: '80px',
        paddingBottom: '80px'
      }}
    >
      {children}
    </section>
  );
}
