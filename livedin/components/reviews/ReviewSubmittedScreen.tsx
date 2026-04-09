"use client";

import Link from "next/link";
import { FeedbackPanel } from "@/components/ui/FeedbackPanel";
import { primaryButtonClass, secondaryButtonClass } from "@/lib/ui";

type ReviewSubmittedScreenProps = {
  reviewId: string;
  propertyId: string;
  variant?: "default" | "facelift";
  stepLabel?: string;
  primaryActionHref?: string;
  primaryActionLabel?: string;
  secondaryActionHref?: string;
  secondaryActionLabel?: string;
};

export function ReviewSubmittedScreen({
  reviewId,
  propertyId,
  variant = "default",
  stepLabel,
  primaryActionHref,
  primaryActionLabel,
  secondaryActionHref,
  secondaryActionLabel,
}: ReviewSubmittedScreenProps) {
  const fx = variant === "facelift";
  const resolvedStepLabel = stepLabel ?? "Step 3 of 3";
  const resolvedPrimaryHref = primaryActionHref ?? `/properties/${propertyId}`;
  const resolvedPrimaryLabel = primaryActionLabel ?? "View property listing";
  const resolvedSecondaryHref = secondaryActionHref ?? "/";
  const resolvedSecondaryLabel = secondaryActionLabel ?? "Return to search";
  return (
    <div className="space-y-6">
      <div
        className={
          fx ? "border-b border-[#E2DDD6] pb-6" : "border-b border-zinc-200 pb-6 dark:border-zinc-800"
        }
      >
        <p
          className={
            fx
              ? "text-sm font-medium uppercase tracking-[0.22em] text-[#717182]"
              : "text-sm font-medium uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-400"
          }
        >
          {resolvedStepLabel}
        </p>
        <h2
          className={
            fx
              ? "mt-3 text-3xl font-bold tracking-tight text-[#0F1F38]"
              : "mt-3 text-3xl font-semibold tracking-tight text-foreground"
          }
          style={
            fx ? { fontFamily: "var(--font-lora), ui-serif, Georgia, serif" } : undefined
          }
        >
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
          href={resolvedPrimaryHref}
          className={
            fx
              ? "rounded-[12px] bg-[#E8913A] px-5 py-3 font-semibold text-white transition-colors hover:bg-[#d17f2f]"
              : primaryButtonClass
          }
        >
          {resolvedPrimaryLabel}
        </Link>
        <Link
          href={resolvedSecondaryHref}
          className={
            fx
              ? "rounded-[12px] border border-[#E2DDD6] bg-white px-5 py-3 font-semibold text-[#0F1F38] transition-colors hover:bg-[#F7F4EF]"
              : secondaryButtonClass
          }
        >
          {resolvedSecondaryLabel}
        </Link>
      </div>
    </div>
  );
}
