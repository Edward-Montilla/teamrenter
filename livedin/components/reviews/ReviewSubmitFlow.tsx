"use client";

import { useEffect, useState } from "react";
import type {
  ReviewCreateInput,
  ReviewGateState,
  ReviewableProperty,
} from "@/lib/types";
import { ReviewGateBanner } from "@/components/reviews/ReviewGateBanner";
import { PropertySelectStep } from "@/components/reviews/PropertySelectStep";
import { ReviewFormStep } from "@/components/reviews/ReviewFormStep";
import { ReviewSubmittedScreen } from "@/components/reviews/ReviewSubmittedScreen";
import { FeedbackPanel } from "@/components/ui/FeedbackPanel";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { cn, sectionCardClass } from "@/lib/ui";

type ReviewSubmitFlowProps = {
  propertyId: string;
};

async function resolveGateState(): Promise<{
  gateState: ReviewGateState;
  email: string | null;
}> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    return { gateState: "unauthenticated", email: null };
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token || !session.user) {
    return { gateState: "unauthenticated", email: null };
  }

  const email = session.user.email ?? null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("email_verified")
    .eq("user_id", session.user.id)
    .maybeSingle();

  return {
    gateState: profile?.email_verified ? "allowed" : "unverified",
    email,
  };
}

export function ReviewSubmitFlow({ propertyId }: ReviewSubmitFlowProps) {
  const [step, setStep] = useState<1 | 2 | "done">(1);
  const [selectedProperty, setSelectedProperty] =
    useState<ReviewableProperty | null>(null);
  const [submittedReviewId, setSubmittedReviewId] = useState<string | null>(
    null,
  );
  const [gateState, setGateState] = useState<ReviewGateState | "loading">(
    "loading",
  );
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [verificationMessage, setVerificationMessage] = useState<string | null>(
    null,
  );
  const [resendingVerification, setResendingVerification] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setGateState("unauthenticated");
      setSessionEmail(null);
      return;
    }

    let active = true;

    const sync = async () => {
      const next = await resolveGateState();
      if (!active) return;
      setGateState(next.gateState);
      setSessionEmail(next.email);
    };

    void sync();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void sync();
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleContinueFromStep1 = (property: ReviewableProperty) => {
    setSelectedProperty(property);
    setStep(2);
    setSubmitError(null);
  };

  const handleSubmitReview = async (data: ReviewCreateInput) => {
    setSubmitError(null);
    setVerificationMessage(null);

    const supabase = getSupabaseBrowserClient();
    const session = supabase
      ? (await supabase.auth.getSession()).data?.session
      : null;

    if (!session?.access_token) {
      setGateState("unauthenticated");
      return;
    }

    const res = await fetch(`/api/properties/${data.property_id}/reviews`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(data),
    });
    const json = await res.json().catch(() => ({}));
    const message =
      typeof json?.message === "string"
        ? json.message
        : "Something went wrong.";

    if (res.status === 201 && json.review_id) {
      setSubmittedReviewId(json.review_id);
      setStep("done");
      return;
    }
    if (res.status === 401) {
      setGateState("unauthenticated");
      setSubmitError(message);
      return;
    }
    if (res.status === 403) {
      setGateState("unverified");
      setSubmitError(message);
      return;
    }
    if (res.status === 409) {
      setGateState("already_reviewed");
      setSubmitError(message);
      return;
    }
    if (res.status === 429) {
      setGateState("limit_reached");
      setSubmitError(message);
      return;
    }

    setSubmitError(message || "Failed to save review. Please try again.");
  };

  const handleResendVerification = async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !sessionEmail) {
      setVerificationMessage(
        "Sign in again before requesting another verification email.",
      );
      return;
    }

    setResendingVerification(true);
    setSubmitError(null);
    setVerificationMessage(null);

    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: sessionEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/sign-in?verified=1`,
        },
      });
      if (error) {
        throw error;
      }

      setVerificationMessage(
        "Verification email sent. Check your inbox, then sign in again.",
      );
    } catch (error) {
      setVerificationMessage(
        error instanceof Error
          ? error.message
          : "Failed to resend verification email.",
      );
    } finally {
      setResendingVerification(false);
    }
  };

  const stepItems = [
    {
      id: 1,
      label: "Choose property",
      active: gateState === "allowed" && step === 1,
      complete: gateState === "allowed" && (step === 2 || step === "done"),
    },
    {
      id: 2,
      label: "Complete review",
      active: gateState === "allowed" && step === 2,
      complete: gateState === "allowed" && step === "done",
    },
    {
      id: 3,
      label: "Confirmation",
      active: gateState === "allowed" && step === "done",
      complete: false,
    },
  ];

  if (gateState === "loading") {
    return (
      <div className={`${sectionCardClass} mx-auto max-w-4xl p-6 sm:p-8`}>
        <FeedbackPanel title="Checking your account" description="Loading your review permissions and current session." />
      </div>
    );
  }

  if (gateState !== "allowed") {
    return (
      <div className={`${sectionCardClass} mx-auto max-w-4xl p-6 sm:p-8`}>
        <div className="border-b border-zinc-200 pb-6 dark:border-zinc-800">
          <p className="text-sm font-medium uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-400">
            Submit a review
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
            You are almost ready to review this property
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-600 dark:text-zinc-400">
            Review submission stays focused on one task at a time. Complete the gate below, then you can confirm the property and continue.
          </p>
        </div>

        <ol className="mt-6 grid gap-3 sm:grid-cols-3">
          {stepItems.map((stepItem) => (
            <li
              key={stepItem.id}
              className={cn(
                "rounded-2xl border px-4 py-3 text-sm",
                stepItem.active
                  ? "border-zinc-950 bg-zinc-950 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-950"
                  : "border-zinc-200 bg-zinc-50 text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400",
              )}
            >
              <span className="font-medium">Step {stepItem.id}</span>
              <span className="ml-2">{stepItem.label}</span>
            </li>
          ))}
        </ol>

        <div className="mt-6 space-y-4">
          <ReviewGateBanner
            gateState={gateState}
            propertyId={propertyId}
            email={sessionEmail}
            resendLabel={
              resendingVerification
                ? "Sending verification email…"
                : "Resend verification email"
            }
            onResendVerification={
              gateState === "unverified" ? handleResendVerification : undefined
            }
            resendDisabled={resendingVerification}
          />
          {submitError ? <FeedbackPanel tone="error" description={submitError} /> : null}
          {verificationMessage ? (
            <FeedbackPanel tone="success" description={verificationMessage} />
          ) : null}
        </div>
      </div>
    );
  }

  if (step === 1) {
    return (
      <div className={`${sectionCardClass} mx-auto max-w-5xl p-6 sm:p-8`}>
        <div className="border-b border-zinc-200 pb-6 dark:border-zinc-800">
          <p className="text-sm font-medium uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-400">
            Step 1 of 3
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
            Confirm the property you want to review
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-600 dark:text-zinc-400">
            Search by address or management company, choose the correct property, then continue to the review form.
          </p>
        </div>
        <PropertySelectStep
          initialPropertyId={propertyId}
          onContinue={handleContinueFromStep1}
        />
      </div>
    );
  }

  if (step === 2 && selectedProperty) {
    return (
      <div className={`${sectionCardClass} mx-auto max-w-4xl p-6 sm:p-8`}>
        <ReviewFormStep
          property={selectedProperty}
          onSubmit={handleSubmitReview}
          onBack={() => setStep(1)}
          submitError={submitError}
        />
      </div>
    );
  }

  if (step === "done" && submittedReviewId && selectedProperty) {
    return (
      <div className={`${sectionCardClass} mx-auto max-w-4xl p-6 sm:p-8`}>
        <ReviewSubmittedScreen
          reviewId={submittedReviewId}
          propertyId={selectedProperty.id}
        />
      </div>
    );
  }

  return null;
}
