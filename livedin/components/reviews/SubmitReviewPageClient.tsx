"use client";

import Link from "next/link";
import { ReviewSubmitFlow } from "@/components/reviews/ReviewSubmitFlow";
import { pageContainerClass, secondaryButtonClass } from "@/lib/ui";

type SubmitReviewPageClientProps = {
  propertyId: string;
  variant?: "default" | "facelift";
};

export function SubmitReviewPageClient({
  propertyId,
  variant = "default",
}: SubmitReviewPageClientProps) {
  const cancelHref = propertyId === "new" ? "/" : `/properties/${propertyId}`;

  if (variant === "facelift") {
    return (
      <div className="bg-[#F7F4EF] pb-16 pt-6">
        <div className={`${pageContainerClass} mb-8 flex items-start justify-between gap-4`}>
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.22em] text-[#717182]">
              Write a review
            </p>
            <p className="mt-1 text-sm text-[#717182]">
              Confirm the property, rate your experience, and submit for moderation.
            </p>
          </div>
          <Link
            href={cancelHref}
            className="shrink-0 rounded-[12px] border border-[#E2DDD6] bg-white px-4 py-2 text-sm font-semibold text-[#0F1F38] transition-colors hover:bg-[#F7F4EF]"
          >
            Cancel
          </Link>
        </div>
        <div className={pageContainerClass}>
          <ReviewSubmitFlow propertyId={propertyId} variant="facelift" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-foreground dark:bg-zinc-950">
      <div className="border-b border-zinc-200 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
        <div className={`${pageContainerClass} flex items-center justify-between py-4`}>
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-400">
              Livedin reviews
            </p>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Confirm the property first, then complete your renter review.
            </p>
          </div>
          <Link href={cancelHref} className={secondaryButtonClass}>
            Cancel
          </Link>
        </div>
      </div>
      <div className={`${pageContainerClass} py-8 sm:py-10`}>
        <ReviewSubmitFlow propertyId={propertyId} />
      </div>
    </div>
  );
}
