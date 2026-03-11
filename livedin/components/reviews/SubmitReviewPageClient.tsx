"use client";

import { ReviewSubmitFlow } from "@/components/reviews/ReviewSubmitFlow";

type SubmitReviewPageClientProps = {
  propertyId: string;
};

export function SubmitReviewPageClient({
  propertyId,
}: SubmitReviewPageClientProps) {
  return (
    <div className="min-h-screen bg-background px-4 py-8 text-foreground">
      <ReviewSubmitFlow propertyId={propertyId} />
    </div>
  );
}
