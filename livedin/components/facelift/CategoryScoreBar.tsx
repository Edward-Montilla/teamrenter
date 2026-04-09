type CategoryScoreBarProps = {
  category: string;
  /** 0–10 display scale; null = no public aggregate data */
  score10: number | null;
  /** Baseline for “above/below avg” chip (Facelift used ~7.5–8.5 mock averages). */
  average10?: number;
  className?: string;
};

const DEFAULT_AVG = 7.5;

export function CategoryScoreBar({
  category,
  score10,
  average10 = DEFAULT_AVG,
  className = "",
}: CategoryScoreBarProps) {
  if (score10 === null || Number.isNaN(score10)) {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-[#0F1F38]">{category}</span>
          <span className="text-sm text-[#717182]">No data</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-[#E2DDD6]">
          <div className="h-full w-0 rounded-full bg-[#E8913A]" />
        </div>
      </div>
    );
  }

  const isAboveAverage = score10 >= average10;
  const percentage = Math.min(100, Math.max(0, (score10 / 10) * 100));

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-[#0F1F38]">{category}</span>
        <div className="flex items-center gap-2">
          <span
            className="text-sm font-semibold text-[#0F1F38]"
            style={{
              fontFamily: "var(--font-lora), ui-serif, Georgia, serif",
            }}
          >
            {score10.toFixed(1)}
          </span>
          <span
            className={`rounded-full px-2 py-0.5 text-xs ${
              isAboveAverage
                ? "bg-green-100 text-green-700"
                : "bg-orange-100 text-orange-700"
            }`}
          >
            {isAboveAverage ? "Above avg" : "Below avg"}
          </span>
        </div>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[#E2DDD6]">
        <div
          className="h-full rounded-full bg-[#E8913A] transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
