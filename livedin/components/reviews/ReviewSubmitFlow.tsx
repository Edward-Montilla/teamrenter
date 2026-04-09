"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import type {
  PropertyDetailPublic,
  ReviewCreateInput,
  ReviewGateState,
  ReviewableProperty,
} from "@/lib/types";
import { FaceliftReviewFormStep } from "@/components/facelift/FaceliftReviewFormStep";
import { StepProgress } from "@/components/facelift/StepProgress";
import { ReviewGateBanner } from "@/components/reviews/ReviewGateBanner";
import { PropertySelectStep } from "@/components/reviews/PropertySelectStep";
import { ReviewFormStep } from "@/components/reviews/ReviewFormStep";
import { ReviewSubmittedScreen } from "@/components/reviews/ReviewSubmittedScreen";
import { FeedbackPanel } from "@/components/ui/FeedbackPanel";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { cn, sectionCardClass } from "@/lib/ui";
import {
  DEFAULT_SEVEN_SLIDER_VALUES,
  FACELIFT_CATEGORY_LABELS,
  sevenSlidersToFiveMetrics,
  type SevenSliderValues,
} from "@/lib/facelift-seven-categories";
import {
  TEXT_INPUT_MAX,
  validateReviewCreateInput,
  type ReviewValidationErrors,
} from "@/lib/validation/review";

type ReviewSubmitFlowProps = {
  propertyId: string;
  /** Facelift chrome + seven-slider form; errors also surface via Sonner. */
  variant?: "default" | "facelift";
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

export function ReviewSubmitFlow({
  propertyId,
  variant = "default",
}: ReviewSubmitFlowProps) {
  const facelift = variant === "facelift";
  const shellClass = facelift
    ? "mx-auto max-w-4xl rounded-[16px] border border-[#E2DDD6] bg-white p-6 sm:p-8"
    : `${sectionCardClass} mx-auto max-w-4xl p-6 sm:p-8`;
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
  const [fxProperty, setFxProperty] = useState<ReviewableProperty | null>(null);
  const [fxPropertyLoading, setFxPropertyLoading] = useState(false);
  const [fxPropertyError, setFxPropertyError] = useState<string | null>(null);
  const [fxStep, setFxStep] = useState<1 | 2 | 3>(1);
  const [fxAddress, setFxAddress] = useState("");
  const [fxMoveIn, setFxMoveIn] = useState("");
  const [fxMoveOut, setFxMoveOut] = useState("");
  const [fxSliders, setFxSliders] = useState<SevenSliderValues>({
    ...DEFAULT_SEVEN_SLIDER_VALUES,
  });
  const [fxReviewText, setFxReviewText] = useState("");
  const [fxBestSuited, setFxBestSuited] = useState<string>("");
  const [fxErrors, setFxErrors] = useState<ReviewValidationErrors>({});
  const [fxSubmitting, setFxSubmitting] = useState(false);

  const MIN_REVIEW_LENGTH = 50;
  const BEST_SUITED_OPTIONS = [
    "Young Professional",
    "Family",
    "Student",
    "Retiree",
    "Pet Owner",
  ];

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

  useEffect(() => {
    if (!facelift || propertyId === "new") return;

    let cancelled = false;
    setFxPropertyLoading(true);
    setFxPropertyError(null);

    const loadProperty = async () => {
      try {
        const res = await fetch(`/api/properties/${propertyId}`);
        if (!res.ok) {
          throw new Error(
            res.status === 404
              ? "We could not load this property. Enter the address manually to continue."
              : "Failed to load this property. Enter the address manually to continue.",
          );
        }
        const detail = (await res.json()) as PropertyDetailPublic;
        if (cancelled) return;
        const property: ReviewableProperty = {
          id: detail.property.id,
          display_name: detail.property.display_name,
          address_line1: detail.property.address_line1,
          city: detail.property.city,
          province: detail.property.province,
          management_company: detail.property.management_company,
        };
        setFxProperty(property);
        setFxAddress([property.address_line1, property.city, property.province].filter(Boolean).join(", "));
      } catch (error) {
        if (cancelled) return;
        setFxPropertyError(
          error instanceof Error ? error.message : "Failed to load this property.",
        );
      } finally {
        if (!cancelled) setFxPropertyLoading(false);
      }
    };

    void loadProperty();
    return () => {
      cancelled = true;
    };
  }, [facelift, propertyId]);

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
      if (facelift) {
        toast.success("Review submitted successfully.");
      }
      setSubmittedReviewId(json.review_id);
      setStep("done");
      return;
    }
    if (res.status === 401) {
      setGateState("unauthenticated");
      setSubmitError(message);
      if (facelift) toast.error(message);
      return;
    }
    if (res.status === 403) {
      setGateState("unverified");
      setSubmitError(message);
      if (facelift) toast.error(message);
      return;
    }
    if (res.status === 409) {
      setGateState("already_reviewed");
      setSubmitError(message);
      if (facelift) toast.error(message);
      return;
    }
    if (res.status === 429) {
      setGateState("limit_reached");
      setSubmitError(message);
      if (facelift) toast.error(message);
      return;
    }

    setSubmitError(message || "Failed to save review. Please try again.");
    if (facelift) {
      toast.error(message || "Failed to save review. Please try again.");
    }
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

  const handleFxSubmitReview = async () => {
    if (!fxMoveIn.trim()) {
      toast.error("Move-in date is required.");
      return;
    }
    if (!fxAddress.trim()) {
      toast.error("Property address is required.");
      return;
    }
    if (fxReviewText.trim().length < MIN_REVIEW_LENGTH) {
      toast.error(`Review must be at least ${MIN_REVIEW_LENGTH} characters.`);
      return;
    }

    const propertyIdToSubmit = fxProperty?.id ?? propertyId;
    const five = sevenSlidersToFiveMetrics(fxSliders);
    const payload: Partial<ReviewCreateInput> = {
      property_id: propertyIdToSubmit,
      ...five,
      text_input: fxReviewText.trim(),
      tenancy_start: fxMoveIn.trim(),
      tenancy_end: fxMoveOut.trim() || null,
    };
    const { valid, errors } = validateReviewCreateInput(payload);
    setFxErrors(errors);
    if (!valid) {
      toast.error("Please fix the highlighted fields.");
      return;
    }

    setFxSubmitting(true);
    try {
      await handleSubmitReview({
        property_id: propertyIdToSubmit,
        management_responsiveness: five.management_responsiveness,
        maintenance_timeliness: five.maintenance_timeliness,
        listing_accuracy: five.listing_accuracy,
        fee_transparency: five.fee_transparency,
        lease_clarity: five.lease_clarity,
        text_input: fxReviewText.trim(),
        tenancy_start: fxMoveIn.trim(),
        tenancy_end: fxMoveOut.trim() || null,
      });
    } finally {
      setFxSubmitting(false);
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
      <div className={shellClass}>
        <FeedbackPanel title="Checking your account" description="Loading your review permissions and current session." />
      </div>
    );
  }

  if (gateState !== "allowed") {
    return (
      <div className={shellClass}>
        <div
          className={
            facelift
              ? "border-b border-[#E2DDD6] pb-6"
              : "border-b border-zinc-200 pb-6 dark:border-zinc-800"
          }
        >
          <p
            className={
              facelift
                ? "text-sm font-medium uppercase tracking-[0.22em] text-[#717182]"
                : "text-sm font-medium uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-400"
            }
          >
            Submit a review
          </p>
          <h1
            className={
              facelift
                ? "mt-3 text-3xl font-bold tracking-tight text-[#0F1F38]"
                : "mt-3 text-3xl font-semibold tracking-tight text-foreground"
            }
            style={
              facelift
                ? { fontFamily: "var(--font-lora), ui-serif, Georgia, serif" }
                : undefined
            }
          >
            You are almost ready to review this property
          </h1>
          <p
            className={
              facelift
                ? "mt-3 max-w-2xl text-sm leading-7 text-[#717182]"
                : "mt-3 max-w-2xl text-sm leading-7 text-zinc-600 dark:text-zinc-400"
            }
          >
            Review submission stays focused on one task at a time. Complete the gate below, then you can confirm the property and continue.
          </p>
        </div>

        <ol className="mt-6 grid gap-3 sm:grid-cols-3">
          {stepItems.map((stepItem) => (
            <li
              key={stepItem.id}
              className={cn(
                "rounded-2xl border px-4 py-3 text-sm",
                facelift
                  ? stepItem.active
                    ? "border-[#0F1F38] bg-[#0F1F38] text-white"
                    : "border-[#E2DDD6] bg-[#F7F4EF] text-[#717182]"
                  : stepItem.active
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

  if (facelift && propertyId !== "new" && gateState === "allowed") {
    if (step === "done" && submittedReviewId) {
      return (
        <div className={shellClass}>
          <ReviewSubmittedScreen
            reviewId={submittedReviewId}
            propertyId={fxProperty?.id ?? propertyId}
            variant="facelift"
            stepLabel="Step 4 of 4"
            primaryActionHref="/dashboard"
            primaryActionLabel="View dashboard"
            secondaryActionHref="/"
            secondaryActionLabel="Back to home"
          />
        </div>
      );
    }

    return (
      <div className={shellClass}>
        <StepProgress
          currentStep={fxStep}
          totalSteps={3}
          steps={["Verify Tenancy", "Rate Categories", "Write Review"]}
        />

        {fxStep === 1 ? (
          <div className="space-y-6">
            <div className="border-b border-[#E2DDD6] pb-6">
              <p className="text-sm font-medium uppercase tracking-[0.22em] text-[#717182]">
                Step 1 of 4
              </p>
              <h2
                className="mt-3 text-3xl font-bold tracking-tight text-[#0F1F38]"
                style={{ fontFamily: "var(--font-lora), ui-serif, Georgia, serif" }}
              >
                Verify your tenancy
              </h2>
            </div>

            {fxPropertyError ? (
              <FeedbackPanel tone="warning" description={fxPropertyError} />
            ) : null}

            <div className="space-y-4 rounded-[16px] border border-[#E2DDD6] bg-white p-6">
              <div>
                <label className="block text-sm font-semibold text-[#0F1F38]">
                  Property address *
                </label>
                <input
                  type="text"
                  value={fxAddress}
                  onChange={(e) => setFxAddress(e.target.value)}
                  readOnly={!fxPropertyError && Boolean(fxProperty)}
                  className="mt-2 w-full rounded-[12px] border border-[#E2DDD6] px-4 py-3 text-[#0F1F38] outline-none focus:ring-2 focus:ring-[#E8913A]/40 disabled:bg-[#F7F4EF]"
                  placeholder="142 Oak Street, Unit 3B"
                  disabled={fxPropertyLoading}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold text-[#0F1F38]">
                    Move-in date *
                  </label>
                  <input
                    type="date"
                    value={fxMoveIn}
                    onChange={(e) => setFxMoveIn(e.target.value)}
                    className="mt-2 w-full rounded-[12px] border border-[#E2DDD6] px-4 py-3 outline-none focus:ring-2 focus:ring-[#E8913A]/40"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#0F1F38]">
                    Move-out date
                  </label>
                  <input
                    type="date"
                    value={fxMoveOut}
                    onChange={(e) => setFxMoveOut(e.target.value)}
                    className="mt-2 w-full rounded-[12px] border border-[#E2DDD6] px-4 py-3 outline-none focus:ring-2 focus:ring-[#E8913A]/40"
                  />
                </div>
              </div>

              <div className="rounded-[12px] border border-[#E2DDD6] bg-[#F7F4EF] p-4 text-sm text-[#0F1F38]">
                <strong>Privacy note:</strong> Your review is verified for authenticity, and your personal information stays confidential.
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setFxStep(2)}
                disabled={!fxAddress.trim() || !fxMoveIn.trim() || fxPropertyLoading}
                className="rounded-[12px] bg-[#E8913A] px-6 py-3 font-semibold text-white transition-colors hover:bg-[#d17f2f] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Continue
              </button>
            </div>
          </div>
        ) : null}

        {fxStep === 2 ? (
          <div className="space-y-6">
            <div className="border-b border-[#E2DDD6] pb-6">
              <p className="text-sm font-medium uppercase tracking-[0.22em] text-[#717182]">
                Step 2 of 4
              </p>
              <h2
                className="mt-3 text-3xl font-bold tracking-tight text-[#0F1F38]"
                style={{ fontFamily: "var(--font-lora), ui-serif, Georgia, serif" }}
              >
                Rate your experience
              </h2>
            </div>

            <section className="rounded-[16px] border border-[#E2DDD6] bg-white p-6">
              <p className="text-sm text-[#717182]">1 = poor, 10 = excellent</p>
              <div className="mt-6 space-y-6">
                {FACELIFT_CATEGORY_LABELS.map((label) => (
                  <div key={label}>
                    <div className="mb-2 flex items-center justify-between">
                      <label className="text-sm font-semibold text-[#0F1F38]" htmlFor={`sl-${label}`}>
                        {label}
                      </label>
                      <span
                        className="text-2xl font-semibold text-[#E8913A]"
                        style={{ fontFamily: "var(--font-lora), ui-serif, Georgia, serif" }}
                      >
                        {fxSliders[label].toFixed(1)}
                      </span>
                    </div>
                    <input
                      id={`sl-${label}`}
                      type="range"
                      min={1}
                      max={10}
                      step={0.5}
                      value={fxSliders[label]}
                      onChange={(e) =>
                        setFxSliders((prev) => ({
                          ...prev,
                          [label]: Number(e.target.value),
                        }))
                      }
                      className="h-2 w-full cursor-pointer accent-[#E8913A]"
                    />
                  </div>
                ))}
              </div>
            </section>

            <div className="flex justify-between gap-3">
              <button
                type="button"
                onClick={() => setFxStep(1)}
                className="rounded-[12px] border border-[#E2DDD6] bg-white px-6 py-3 font-semibold text-[#0F1F38] transition-colors hover:bg-[#F7F4EF]"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setFxStep(3)}
                className="rounded-[12px] bg-[#E8913A] px-6 py-3 font-semibold text-white transition-colors hover:bg-[#d17f2f]"
              >
                Continue
              </button>
            </div>
          </div>
        ) : null}

        {fxStep === 3 ? (
          <div className="space-y-6">
            <div className="border-b border-[#E2DDD6] pb-6">
              <p className="text-sm font-medium uppercase tracking-[0.22em] text-[#717182]">
                Step 3 of 4
              </p>
              <h2
                className="mt-3 text-3xl font-bold tracking-tight text-[#0F1F38]"
                style={{ fontFamily: "var(--font-lora), ui-serif, Georgia, serif" }}
              >
                Share your story
              </h2>
            </div>

            {submitError ? <FeedbackPanel tone="error" description={submitError} /> : null}

            <section className="rounded-[16px] border border-[#E2DDD6] bg-white p-6">
              <label className="block text-sm font-semibold text-[#0F1F38]">Your review *</label>
              <textarea
                value={fxReviewText}
                onChange={(e) => setFxReviewText(e.target.value.slice(0, TEXT_INPUT_MAX))}
                maxLength={TEXT_INPUT_MAX}
                rows={8}
                className="mt-2 w-full rounded-[12px] border border-[#E2DDD6] px-4 py-3 text-[#0F1F38] outline-none focus:ring-2 focus:ring-[#E8913A]/40"
                placeholder="Share your experience living at this property."
              />
              <p className="mt-2 text-sm text-[#717182]">
                {fxReviewText.length}/{TEXT_INPUT_MAX} characters (minimum {MIN_REVIEW_LENGTH})
              </p>
              {fxErrors.text_input ? (
                <p className="mt-1 text-sm text-red-600" role="alert">
                  {fxErrors.text_input}
                </p>
              ) : null}
            </section>

            <section className="rounded-[16px] border border-[#E2DDD6] bg-white p-6">
              <label className="block text-sm font-semibold text-[#0F1F38]">
                Who is this property best suited for?
              </label>
              <div className="mt-3 flex flex-wrap gap-3">
                {BEST_SUITED_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setFxBestSuited(option)}
                    className={cn(
                      "rounded-full border px-4 py-2 text-sm transition-colors",
                      fxBestSuited === option
                        ? "border-[#E8913A] bg-[#E8913A] text-white"
                        : "border-[#E2DDD6] bg-white text-[#0F1F38] hover:border-[#E8913A]",
                    )}
                  >
                    {option}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-[#717182]">
                Selection is currently for UI guidance and is not included in review payload.
              </p>
            </section>

            <div className="flex justify-between gap-3">
              <button
                type="button"
                onClick={() => setFxStep(2)}
                className="rounded-[12px] border border-[#E2DDD6] bg-white px-6 py-3 font-semibold text-[#0F1F38] transition-colors hover:bg-[#F7F4EF]"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => void handleFxSubmitReview()}
                disabled={fxSubmitting || fxReviewText.trim().length < MIN_REVIEW_LENGTH}
                className="rounded-[12px] bg-[#E8913A] px-6 py-3 font-semibold text-white transition-colors hover:bg-[#d17f2f] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {fxSubmitting ? "Submitting..." : "Submit review"}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  if (step === 1) {
    return (
      <div
        className={
          facelift
            ? "mx-auto max-w-5xl rounded-[16px] border border-[#E2DDD6] bg-white p-6 sm:p-8"
            : `${sectionCardClass} mx-auto max-w-5xl p-6 sm:p-8`
        }
      >
        {facelift ? (
          <StepProgress
            currentStep={1}
            totalSteps={3}
            steps={["Choose property", "Rate experience", "Confirmation"]}
          />
        ) : null}
        <div
          className={
            facelift
              ? "border-b border-[#E2DDD6] pb-6"
              : "border-b border-zinc-200 pb-6 dark:border-zinc-800"
          }
        >
          <p
            className={
              facelift
                ? "text-sm font-medium uppercase tracking-[0.22em] text-[#717182]"
                : "text-sm font-medium uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-400"
            }
          >
            Step 1 of 3
          </p>
          <h1
            className={
              facelift
                ? "mt-3 text-3xl font-bold tracking-tight text-[#0F1F38]"
                : "mt-3 text-3xl font-semibold tracking-tight text-foreground"
            }
            style={
              facelift
                ? { fontFamily: "var(--font-lora), ui-serif, Georgia, serif" }
                : undefined
            }
          >
            Confirm the property you want to review
          </h1>
          <p
            className={
              facelift
                ? "mt-3 max-w-2xl text-sm leading-7 text-[#717182]"
                : "mt-3 max-w-2xl text-sm leading-7 text-zinc-600 dark:text-zinc-400"
            }
          >
            Search by address or management company, choose the correct property, then continue to the review form.
          </p>
        </div>
        <PropertySelectStep
          initialPropertyId={propertyId}
          onContinue={handleContinueFromStep1}
          variant={facelift ? "facelift" : "default"}
        />
      </div>
    );
  }

  if (step === 2 && selectedProperty) {
    return (
      <div className={shellClass}>
        {facelift ? (
          <>
            <StepProgress
              currentStep={2}
              totalSteps={3}
              steps={["Choose property", "Rate experience", "Confirmation"]}
            />
            <FaceliftReviewFormStep
              property={selectedProperty}
              onSubmit={handleSubmitReview}
              onBack={() => setStep(1)}
              submitError={submitError}
            />
          </>
        ) : (
          <ReviewFormStep
            property={selectedProperty}
            onSubmit={handleSubmitReview}
            onBack={() => setStep(1)}
            submitError={submitError}
          />
        )}
      </div>
    );
  }

  if (step === "done" && submittedReviewId && selectedProperty) {
    return (
      <div className={shellClass}>
        {facelift ? (
          <StepProgress
            currentStep={3}
            totalSteps={3}
            steps={["Choose property", "Rate experience", "Confirmation"]}
          />
        ) : null}
        <ReviewSubmittedScreen
          reviewId={submittedReviewId}
          propertyId={selectedProperty.id}
          variant={facelift ? "facelift" : "default"}
        />
      </div>
    );
  }

  return null;
}
