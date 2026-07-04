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
      // Bypassing Tailwind to guarantee massive, editorial padding
      style={{
        paddingTop: 'clamp(120px, 15vw, 200px)',
        paddingBottom: 'clamp(120px, 15vw, 200px)'
      }}
    >
      {children}
    </section>
  );
}
