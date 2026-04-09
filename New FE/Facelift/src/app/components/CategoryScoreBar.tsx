interface CategoryScoreBarProps {
  category: string;
  score: number;
  average: number;
  className?: string;
}

export function CategoryScoreBar({ category, score, average, className = '' }: CategoryScoreBarProps) {
  const isAboveAverage = score >= average;
  const percentage = (score / 10) * 100;

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-[#0F1F38]">{category}</span>
        <div className="flex items-center gap-2">
          <span className="text-sm font-['Lora'] font-semibold text-[#0F1F38]">{score.toFixed(1)}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            isAboveAverage 
              ? 'bg-green-100 text-green-700' 
              : 'bg-orange-100 text-orange-700'
          }`}>
            {isAboveAverage ? 'Above avg' : 'Below avg'}
          </span>
        </div>
      </div>
      <div className="h-2 bg-[#E2DDD6] rounded-full overflow-hidden">
        <div 
          className="h-full bg-[#E8913A] rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
