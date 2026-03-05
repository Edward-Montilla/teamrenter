"use client";

import type { ReviewGateState } from "@/lib/types";

type ReviewGateBannerProps = {
  gateState: Exclude<ReviewGateState, "allowed">;
  onMockSignIn?: () => void;
  onMockVerifyEmail?: () => void;
};

export function ReviewGateBanner({
  gateState,
  onMockSignIn,
  onMockVerifyEmail,
}: ReviewGateBannerProps) {
  const containerClass =
    "rounded-lg border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-700 dark:bg-zinc-900";

  if (gateState === "unauthenticated") {
    return (
      <div className={containerClass}>
        <p className="text-zinc-700 dark:text-zinc-300">
          Sign in to submit a review.
        </p>
        {onMockSignIn && (
          <button
            type="button"
            onClick={onMockSignIn}
            className="mt-4 rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90"
          >
            Sign in (mock)
          </button>
        )}
      </div>
    );
  }

  if (gateState === "unverified") {
    return (
      <div className={containerClass}>
        <p className="text-zinc-700 dark:text-zinc-300">
          Verify your email to submit a review.
        </p>
        {onMockVerifyEmail && (
          <button
            type="button"
            onClick={onMockVerifyEmail}
            className="mt-4 rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90"
          >
            Verify email (mock)
          </button>
        )}
      </div>
    );
  }

  if (gateState === "limit_reached") {
    return (
      <div className={containerClass}>
        <p className="text-zinc-700 dark:text-zinc-300">
          Review limit reached.
        </p>
      </div>
    );
  }

  if (gateState === "already_reviewed") {
    return (
      <div className={containerClass}>
        <p className="text-zinc-700 dark:text-zinc-300">
          You have already reviewed this property.
        </p>
      </div>
    );
  }

  return null;
}
