interface TrustScoreBadgeProps {
  score: number;
  size?: "sm" | "md" | "lg" | "hero";
  className?: string;
  /** When true, show a dash instead of a numeric score (no aggregate yet). */
  empty?: boolean;
}

export function TrustScoreBadge({
  score,
  size = "md",
  className = "",
  empty = false,
}: TrustScoreBadgeProps) {
  const sizeClasses = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-4xl",
    hero: "text-[64px]",
  };

  const containerSizes = {
    sm: "w-12 h-12",
    md: "w-16 h-16",
    lg: "w-24 h-24",
    hero: "w-32 h-32",
  };

  return (
    <div className={`flex flex-col items-center gap-1 ${className}`}>
      <div
        className={`${containerSizes[size]} rounded-full bg-[#E8913A] flex items-center justify-center`}
      >
        <span
          className={`${sizeClasses[size]} font-semibold text-white`}
          style={{ fontFamily: "var(--font-lora), ui-serif, Georgia, serif" }}
        >
          {empty ? "—" : score}
        </span>
      </div>
      <span className="text-xs text-[#717182]">TrustScore</span>
    </div>
  );
}
