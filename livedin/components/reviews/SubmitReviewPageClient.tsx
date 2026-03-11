"use client";

import { PublicSiteHeader } from "@/components/auth/PublicSiteHeader";
import { ReviewSubmitFlow } from "@/components/reviews/ReviewSubmitFlow";

type SubmitReviewPageClientProps = {
  propertyId: string;
};

export function SubmitReviewPageClient({
  propertyId,
}: SubmitReviewPageClientProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <PublicSiteHeader />
      <div className="px-4 py-8">
        <ReviewSubmitFlow propertyId={propertyId} />
      </div>
    </div>
  );
}
