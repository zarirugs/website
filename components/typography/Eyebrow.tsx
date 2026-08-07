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
        "inline-block uppercase tracking-[0.45em] text-[12px] text-[#B89B5E]",
        className
      )}
    >
      {children}
    </span>
  );
}