"use client";

import Link from "next/link";

type ReviewSubmittedScreenProps = {
  reviewId: string;
  propertyId: string;
};

export function ReviewSubmittedScreen({
  reviewId,
  propertyId,
}: ReviewSubmittedScreenProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-foreground">Review — Done</h2>
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-700 dark:bg-zinc-900">
        <p className="font-medium text-foreground">Review submitted.</p>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Thank you for contributing. Your review helps other renters.
        </p>
        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-500">
          Submission reference: {reviewId}
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Link
          href={`/properties/${propertyId}`}
          className="inline-block rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90"
        >
          View property listing
        </Link>
        <Link
          href="/"
          className="inline-block rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-foreground hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:hover:bg-zinc-800"
        >
          Return to search
        </Link>
      </div>
    </div>
  );
}
