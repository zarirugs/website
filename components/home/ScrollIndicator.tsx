export default function ScrollIndicator() {
    return (
      <div
        className="
          absolute
          bottom-12
          left-1/2
          -translate-x-1/2
          z-20
          opacity-70
          transition-opacity
          duration-500
          hover:opacity-100
        "
      >
        <div className="flex flex-col items-center gap-5">
          <span
            className="
              text-[10px]
              uppercase
              tracking-[0.4em]
              text-white
            "
          >
            Scroll
          </span>
  
          {/* A sleek, static line that fades out at the bottom instead of bouncing */}
          <div className="h-20 w-[1px] bg-gradient-to-b from-white/60 to-transparent" />
        </div>
      </div>
    );
  }