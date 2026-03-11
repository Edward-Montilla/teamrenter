"use client";

import Link from "next/link";
import { FeedbackPanel } from "@/components/ui/FeedbackPanel";
import { primaryButtonClass, secondaryButtonClass } from "@/lib/ui";

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
      <div className="border-b border-zinc-200 pb-6 dark:border-zinc-800">
        <p className="text-sm font-medium uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-400">
          Step 3 of 3
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
          Review submitted
        </h2>
      </div>
      <FeedbackPanel
        tone="success"
        description={
          <div className="space-y-2">
            <p>Thank you for contributing. Your review helps other renters evaluate this property with more confidence.</p>
            <p className="text-xs opacity-75">Submission reference: {reviewId}</p>
          </div>
        }
      />
      <div className="flex flex-wrap gap-3">
        <Link
          href={`/properties/${propertyId}`}
          className={primaryButtonClass}
        >
          View property listing
        </Link>
        <Link
          href="/"
          className={secondaryButtonClass}
        >
          Return to search
        </Link>
      </div>
    </div>
  );
}
