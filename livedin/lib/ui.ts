import type { UiFeedbackTone } from "@/lib/types";

export function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export const pageContainerClass = "mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8";
export const sectionCardClass =
  "rounded-3xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950";
export const mutedCardClass =
  "rounded-2xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900";
export const primaryButtonClass =
  "inline-flex items-center justify-center rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:pointer-events-none disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-300";
export const secondaryButtonClass =
  "inline-flex items-center justify-center rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-950 transition hover:bg-zinc-50 disabled:pointer-events-none disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800";
export const destructiveButtonClass =
  "inline-flex items-center justify-center rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-red-500 disabled:pointer-events-none disabled:opacity-50";
export const inputClass =
  "w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-950 placeholder:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500";
export const selectClass =
  "rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";
export const textareaClass = `${inputClass} min-h-28`;

export function feedbackToneClass(tone: UiFeedbackTone) {
  switch (tone) {
    case "success":
      return "border-green-200 bg-green-50 text-green-950 dark:border-green-900/70 dark:bg-green-950/30 dark:text-green-200";
    case "warning":
      return "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900/70 dark:bg-amber-950/30 dark:text-amber-200";
    case "error":
      return "border-red-200 bg-red-50 text-red-950 dark:border-red-900/70 dark:bg-red-950/30 dark:text-red-200";
    default:
      return "border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300";
  }
}
