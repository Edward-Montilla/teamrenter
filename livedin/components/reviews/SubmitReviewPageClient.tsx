"use client";

import type { ReviewGateState } from "@/lib/types";
import { MockGateProvider, MockGatePanel } from "@/components/reviews/MockGatePanel";
import { ReviewSubmitFlow } from "@/components/reviews/ReviewSubmitFlow";

type SubmitReviewPageClientProps = {
  propertyId: string;
  gateOverride: ReviewGateState | null;
};

export function SubmitReviewPageClient({
  propertyId,
  gateOverride,
}: SubmitReviewPageClientProps) {
  return (
    <MockGateProvider>
      <div className="min-h-screen bg-background px-4 py-8 text-foreground">
        <ReviewSubmitFlow propertyId={propertyId} gateOverride={gateOverride} />
      </div>
      <MockGatePanel />
    </MockGateProvider>
  );
}
