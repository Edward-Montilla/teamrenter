"use client";

import Link from "next/link";
import { AuthPromptCard } from "@/components/auth/AuthPromptCard";
import { SignOutButton } from "@/components/auth/SignOutButton";
import type { ReviewGateState } from "@/lib/types";

type ReviewGateBannerProps = {
  gateState: Exclude<ReviewGateState, "allowed">;
  propertyId: string;
  email?: string | null;
  resendLabel?: string;
  onResendVerification?: () => void | Promise<void>;
  resendDisabled?: boolean;
};

export function ReviewGateBanner({
  gateState,
  propertyId,
  email,
  resendLabel = "Resend verification email",
  onResendVerification,
  resendDisabled = false,
}: ReviewGateBannerProps) {
  const signInHref = `/sign-in?redirect=${encodeURIComponent(
    `/submit-review/${propertyId}`,
  )}`;

  if (gateState === "unauthenticated") {
    return (
      <AuthPromptCard
        title="Sign in required"
        description="Sign in first so we can tie the review to your account and return you directly to this review flow."
        primaryAction={{ label: "Sign in", href: signInHref }}
        secondaryAction={{ label: "Back to property", href: `/properties/${propertyId}` }}
      />
    );
  }

  if (gateState === "unverified") {
    return (
      <div className="space-y-4">
        <AuthPromptCard
          title="Verify your email"
          description={
            <>
              <p>
                Reviews are limited to verified accounts.{" "}
                {email ? (
                  <>
                    We currently have <span className="font-medium">{email}</span>{" "}
                    signed in.
                  </>
                ) : (
                  "Finish email confirmation for your account."
                )}
              </p>
              <p className="mt-2">
                After you confirm your email, come back here and continue with property selection.
              </p>
            </>
          }
          primaryAction={
            onResendVerification
              ? {
                  label: resendLabel,
                  onClick: onResendVerification,
                  disabled: resendDisabled,
                }
              : undefined
          }
          secondaryAction={{ label: "Back to property", href: `/properties/${propertyId}` }}
        />
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={signInHref}
            className="text-sm font-medium text-foreground underline underline-offset-4"
          >
            Switch account
          </Link>
          <SignOutButton redirectTo={signInHref} />
        </div>
      </div>
    );
  }

  if (gateState === "limit_reached") {
    return (
      <AuthPromptCard
        title="Review limit reached"
        description="You can submit up to 3 reviews in a 6 month period. You can still browse property details now and return when the limit window resets."
        primaryAction={{ label: "Back to property", href: `/properties/${propertyId}` }}
      />
    );
  }

  if (gateState === "already_reviewed") {
    return (
      <AuthPromptCard
        title="Review already submitted"
        description="This account has already submitted a review for this property, so you do not need to complete the form again."
        primaryAction={{ label: "Back to property", href: `/properties/${propertyId}` }}
      />
    );
  }

  return null;
}
