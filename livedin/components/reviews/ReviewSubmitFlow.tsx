"use client";

import { useMemo, useState } from "react";
import type { ReviewGateState, ReviewCreateInput } from "@/lib/types";
import { useMockGate } from "@/components/reviews/MockGatePanel";
import { ReviewGateBanner } from "@/components/reviews/ReviewGateBanner";
import { PropertySelectStep } from "@/components/reviews/PropertySelectStep";
import { ReviewFormStep } from "@/components/reviews/ReviewFormStep";
import { ReviewSubmittedScreen } from "@/components/reviews/ReviewSubmittedScreen";
import type { MockPropertyForReview } from "@/lib/mocks/properties";
import { storeReview } from "@/lib/mocks/reviews";

const GATE_STATES: ReviewGateState[] = [
  "unauthenticated",
  "unverified",
  "limit_reached",
  "already_reviewed",
  "allowed",
];

function resolveGateState(
  toggles: {
    authenticated: boolean;
    email_verified: boolean;
    limit_reached: boolean;
    already_reviewed: boolean;
  },
  override: ReviewGateState | null
): ReviewGateState {
  if (override && GATE_STATES.includes(override)) return override;
  if (!toggles.authenticated) return "unauthenticated";
  if (!toggles.email_verified) return "unverified";
  if (toggles.limit_reached) return "limit_reached";
  if (toggles.already_reviewed) return "already_reviewed";
  return "allowed";
}

const MOCK_SUBMIT_DELAY_MS = 350;

type ReviewSubmitFlowProps = {
  propertyId: string;
  gateOverride: ReviewGateState | null;
};

export function ReviewSubmitFlow({
  propertyId,
  gateOverride,
}: ReviewSubmitFlowProps) {
  const { toggles, setAuthenticated, setEmailVerified } = useMockGate();
  const [step, setStep] = useState<1 | 2 | "done">(1);
  const [selectedProperty, setSelectedProperty] =
    useState<MockPropertyForReview | null>(null);
  const [submittedReviewId, setSubmittedReviewId] = useState<string | null>(
    null
  );

  const gateState = useMemo(
    () => resolveGateState(toggles, gateOverride),
    [toggles, gateOverride]
  );

  const handleMockSignIn = () => setAuthenticated(true);
  const handleMockVerifyEmail = () => setEmailVerified(true);

  const handleContinueFromStep1 = (property: MockPropertyForReview) => {
    setSelectedProperty(property);
    setStep(2);
  };

  const handleSubmitReview = async (data: ReviewCreateInput) => {
    await new Promise((r) => setTimeout(r, MOCK_SUBMIT_DELAY_MS));
    const review_id = crypto.randomUUID();
    storeReview({ ...data, review_id });
    setSubmittedReviewId(review_id);
    setStep("done");
  };

  if (gateState !== "allowed") {
    return (
      <>
        <div className="mx-auto max-w-2xl space-y-6">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Submit a review
          </h1>
          <ReviewGateBanner
            gateState={gateState}
            onMockSignIn={handleMockSignIn}
            onMockVerifyEmail={handleMockVerifyEmail}
          />
        </div>
      </>
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
