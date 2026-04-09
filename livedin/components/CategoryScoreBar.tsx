import type { DisplayScore0_5 } from "@/lib/types";
import { cn } from "@/lib/ui";

type CategoryScoreBarProps = {
  label: string;
  score: DisplayScore0_5;
  maxScore?: number;
  className?: string;
};

export function CategoryScoreBar({
  label,
  score,
  maxScore = 5,
  className,
}: CategoryScoreBarProps) {
  const widthPct = Math.min(100, Math.max(0, (score / maxScore) * 100));

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-medium text-foreground">{label}</span>
        <span className="tabular-nums text-zinc-600 dark:text-zinc-400">
          {score}/{maxScore}
        </span>
      </div>
      <div
        className="h-2.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800"
        role="meter"
        aria-valuemin={0}
        aria-valuemax={maxScore}
        aria-valuenow={score}
        aria-label={`${label} score ${score} out of ${maxScore}`}
      >
        <div
          className="h-full rounded-full bg-[var(--theme-primary)] transition-[width]"
          style={{ width: `${widthPct}%` }}
        />
      </div>
    </div>
  );
}
