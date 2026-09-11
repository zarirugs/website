import { cn } from "@/lib/utils/cn";

interface Props {
  children: React.ReactNode;
  className?: string;
}

export default function Eyebrow({
  children,
  className,
}: Props) {
  return (
    <span
      className={cn(
        "inline-block text-[10px] font-medium uppercase tracking-[0.28em] text-[#B89B5E]",
        className
      )}
    >
      {children}
    </span>
  );
}
