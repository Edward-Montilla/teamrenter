"use client";

import { useId, useState, type KeyboardEvent } from "react";
import { cn } from "@/lib/ui";
import type { ReviewScore } from "@/lib/types";

const STAR_VALUES: ReviewScore[] = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];

type StarRatingInputProps = {
  id: string;
  label: string;
  value: ReviewScore | "";
  onChange: (value: ReviewScore | "") => void;
  error?: string;
  helperText?: string;
};

function formatScore(value: ReviewScore) {
  return Number.isInteger(value) ? `${value}` : value.toFixed(1);
}

function scoreAriaLabel(value: ReviewScore) {
  return `${formatScore(value)} ${value === 1 ? "star" : "stars"}`;
}

function StarIcon({
  fillPercent,
  highlighted,
}: {
  fillPercent: number;
  highlighted: boolean;
}) {
  const clipId = useId();

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={cn(
        "h-8 w-8 transition sm:h-9 sm:w-9",
        highlighted ? "drop-shadow-[0_0_12px_rgba(245,158,11,0.22)]" : "",
      )}
    >
      <defs>
        <clipPath id={clipId}>
          <rect x="0" y="0" width={`${fillPercent}%`} height="24" />
        </clipPath>
      </defs>
      <path
        d="M12 2.75l2.85 5.77 6.37.93-4.61 4.49 1.09 6.34L12 17.29l-5.7 2.99 1.09-6.34L2.78 9.45l6.37-.93L12 2.75z"
        className="fill-zinc-200 dark:fill-zinc-800"
      />
      <path
        d="M12 2.75l2.85 5.77 6.37.93-4.61 4.49 1.09 6.34L12 17.29l-5.7 2.99 1.09-6.34L2.78 9.45l6.37-.93L12 2.75z"
        clipPath={`url(#${clipId})`}
        className="fill-amber-400 dark:fill-amber-300"
      />
      <path
        d="M12 2.75l2.85 5.77 6.37.93-4.61 4.49 1.09 6.34L12 17.29l-5.7 2.99 1.09-6.34L2.78 9.45l6.37-.93L12 2.75z"
        className="fill-none stroke-zinc-300 dark:stroke-zinc-700"
        strokeWidth="1.25"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function StarRatingInput({
  id,
  label,
  value,
  onChange,
  error,
  helperText,
}: StarRatingInputProps) {
  const [hoverValue, setHoverValue] = useState<ReviewScore | null>(null);
  const displayValue = hoverValue ?? value ?? "";
  const describedBy = [error ? `${id}-error` : null, helperText ? `${id}-hint` : null]
    .filter(Boolean)
    .join(" ") || undefined;

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (
      event.key !== "ArrowLeft" &&
      event.key !== "ArrowRight" &&
      event.key !== "ArrowUp" &&
      event.key !== "ArrowDown" &&
      event.key !== "Home" &&
      event.key !== "End" &&
      event.key !== "Backspace" &&
      event.key !== "Delete"
    ) {
      return;
    }

    event.preventDefault();

    if (event.key === "Home" || event.key === "Backspace" || event.key === "Delete") {
      onChange(0);
      return;
    }
    if (event.key === "End") {
      onChange(5);
      return;
    }

    const direction =
      event.key === "ArrowRight" || event.key === "ArrowUp" ? 0.5 : -0.5;
    const baseValue = typeof value === "number" ? value : 0;
    const nextValue = Math.min(5, Math.max(0, baseValue + direction)) as ReviewScore;
    onChange(nextValue);
  };

  return (
    <fieldset className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
      <legend className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {label}
      </legend>

      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {typeof value === "number"
            ? `${formatScore(value)} / 5`
            : "Choose a rating"}
        </p>
        <button
          type="button"
          onClick={() => onChange("")}
          className="text-xs font-medium text-zinc-500 underline underline-offset-4 transition hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          Clear
        </button>
      </div>

      <div
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-orientation="horizontal"
        aria-valuemin={0}
        aria-valuemax={5}
        aria-valuenow={typeof value === "number" ? value : 0}
        aria-valuetext={
          typeof value === "number" ? `${formatScore(value)} out of 5` : "No rating selected"
        }
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        onKeyDown={handleKeyDown}
        onMouseLeave={() => setHoverValue(null)}
        onBlur={() => setHoverValue(null)}
        className={cn(
          "mt-3 rounded-2xl border px-3 py-3 outline-none transition",
          error
            ? "border-red-300 ring-1 ring-red-200 dark:border-red-500/60 dark:ring-red-900/50"
            : "border-zinc-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-200 dark:border-zinc-800 dark:focus:border-amber-300 dark:focus:ring-amber-500/20",
        )}
      >
        <div className="relative inline-flex">
          <div className="flex gap-1">
            {Array.from({ length: 5 }, (_, index) => {
              const visibleValue = typeof displayValue === "number" ? displayValue : 0;
              const fillPercent = Math.max(
                0,
                Math.min(1, visibleValue - index),
              ) * 100;

              return (
                <StarIcon
                  key={index}
                  fillPercent={fillPercent}
                  highlighted={typeof displayValue === "number" && displayValue > index}
                />
              );
            })}
          </div>

          <div className="absolute inset-0 grid grid-cols-10">
            {STAR_VALUES.map((starValue) => (
              <button
                key={starValue}
                type="button"
                onMouseEnter={() => setHoverValue(starValue)}
                onFocus={() => setHoverValue(starValue)}
                onClick={() => onChange(starValue)}
                className="rounded-md outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-amber-300 dark:focus-visible:ring-offset-zinc-950"
                aria-label={`Set ${label.toLowerCase()} to ${scoreAriaLabel(starValue)}`}
                aria-pressed={value === starValue}
              >
                <span className="sr-only">{scoreAriaLabel(starValue)}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {helperText ? (
        <p
          id={`${id}-hint`}
          className="mt-3 text-xs text-zinc-500 dark:text-zinc-400"
        >
          {helperText}
        </p>
      ) : null}
      {error ? (
        <p
          id={`${id}-error`}
          className="mt-2 text-sm text-red-600 dark:text-red-400"
          role="alert"
        >
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
