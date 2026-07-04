export default function ScrollIndicator() {
    return (
      <div
        className="
          absolute
          bottom-10
          left-1/2
          -translate-x-1/2
          z-20
          animate-bounce
        "
      >
        <div className="flex flex-col items-center gap-3">
          <span
            className="
              text-xs
              uppercase
              tracking-[0.35em]
              text-white/70
            "
          >
            Scroll
          </span>
  
          <div className="h-12 w-px bg-white/60" />
        </div>
      </div>
    );
  }