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
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

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

  if (gateState === "loading") {
    return (
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-6 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
        Checking your account…
      </div>
    );
  }

  if (gateState !== "allowed") {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Submit a review
        </h1>
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
        {submitError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">
            {submitError}
          </div>
        )}
        {verificationMessage && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-900 dark:border-green-900/70 dark:bg-green-950/30 dark:text-green-200">
            {verificationMessage}
          </div>
        )}
      </div>
    );
  }

  if (step === 1) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Submit a review
        </h1>
        <PropertySelectStep
          initialPropertyId={propertyId}
          onContinue={handleContinueFromStep1}
        />
      </div>
    );
  }

  if (step === 2 && selectedProperty) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Submit a review
        </h1>
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
      <div className="mx-auto max-w-2xl space-y-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Submit a review
        </h1>
        <ReviewSubmittedScreen
          reviewId={submittedReviewId}
          propertyId={selectedProperty.id}
        />
      </div>
    );
  }

  return null;
}
