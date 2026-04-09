import type { DisplayScore0_5 } from "@/lib/types";
import { cn } from "@/lib/ui";

type TrustScoreBadgeProps = {
  score: DisplayScore0_5;
  reviewCount: number;
  /** When set, shown instead of the review-count line (e.g. neighbourhood aggregates). */
  caption?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
};

function toneForScore(score: DisplayScore0_5, reviewCount: number) {
  if (reviewCount === 0) {
    return {
      ring: "ring-zinc-200 dark:ring-zinc-700",
      bg: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
      label: "text-zinc-500 dark:text-zinc-400",
    };
  }
  if (score >= 4) {
    return {
      ring: "ring-[color-mix(in_srgb,var(--theme-success)_35%,transparent)]",
      bg: "bg-[color-mix(in_srgb,var(--theme-success)_18%,var(--theme-surface))] text-foreground",
      label: "text-[color-mix(in_srgb,var(--theme-success)_70%,var(--foreground))]",
    };
  }
  if (score >= 2.5) {
    return {
      ring: "ring-[color-mix(in_srgb,var(--theme-warning)_40%,transparent)]",
      bg: "bg-[color-mix(in_srgb,var(--theme-warning)_16%,var(--theme-surface))] text-foreground",
      label: "text-[color-mix(in_srgb,var(--theme-warning)_75%,var(--foreground))]",
    };
  }
  return {
    ring: "ring-[color-mix(in_srgb,var(--theme-error)_38%,transparent)]",
    bg: "bg-[color-mix(in_srgb,var(--theme-error)_14%,var(--theme-surface))] text-foreground",
    label: "text-[color-mix(in_srgb,var(--theme-error)_78%,var(--foreground))]",
  };
}

const sizeClasses = {
  sm: "h-14 w-14 text-lg",
  md: "h-16 w-16 text-xl",
  lg: "h-20 w-20 text-2xl",
} as const;

export function TrustScoreBadge({
  score,
  reviewCount,
  caption,
  className,
  size = "md",
}: TrustScoreBadgeProps) {
  const tone = toneForScore(score, reviewCount);
  const confidence =
    caption ??
    (reviewCount === 0
      ? "Not enough data"
      : `${reviewCount} ${reviewCount === 1 ? "review" : "reviews"}`);

  return (
    <div className={cn("flex flex-col items-center gap-1", className)}>
      <div
        className={cn(
          "flex items-center justify-center rounded-full font-semibold ring-2 ring-inset",
          tone.ring,
          tone.bg,
          sizeClasses[size],
        )}
        aria-label={`Trust score ${reviewCount ? `${score} out of 5` : "no reviews yet"}`}
      >
        {reviewCount === 0 ? "—" : score}
      </div>
      <span className={cn("max-w-[8rem] text-center text-xs leading-tight", tone.label)}>
        {confidence}
      </span>
    </div>
  );
}
