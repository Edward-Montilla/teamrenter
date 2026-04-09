"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/ui";

type CategoryStarRatingProps = {
  label: string;
  value: number;
  onChange: (value: number) => void;
};

export function CategoryStarRating({
  label,
  value,
  onChange,
}: CategoryStarRatingProps) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-semibold text-[#0F1F38]">{label}</p>
        <span
          className="text-2xl font-semibold text-[#E8913A]"
          style={{ fontFamily: "var(--font-lora), ui-serif, Georgia, serif" }}
        >
          {value}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(0)}
          className={cn(
            "rounded-md border px-2 py-1 text-xs font-semibold transition-colors",
            value === 0
              ? "border-[#E8913A] bg-[#E8913A] text-white"
              : "border-[#E2DDD6] bg-white text-[#717182] hover:border-[#E8913A]",
          )}
          aria-label={`${label} 0 stars`}
        >
          0
        </button>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="rounded-md p-1 transition-transform hover:scale-105"
            aria-label={`${label} ${star} stars`}
          >
            <Star
              className={cn(
                "h-6 w-6",
                star <= value
                  ? "fill-[#E8913A] text-[#E8913A]"
                  : "fill-transparent text-[#E2DDD6]",
              )}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
