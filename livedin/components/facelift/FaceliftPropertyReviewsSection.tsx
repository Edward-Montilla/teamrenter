"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/facelift/ui/tabs";

type Props = {
  /** When false, RLS/public policy does not expose per-review excerpts; show honest copy only. */
  hasApprovedReviews: boolean;
};

/**
 * Facelift-shaped renter reviews section without fabricated ReviewCard text.
 * Public excerpts require a dedicated API + policy (Gap 7); until then, tabs explain the limitation.
 */
export function FaceliftPropertyReviewsSection({
  hasApprovedReviews,
}: Props) {
  return (
    <div className="rounded-[16px] border border-[#E2DDD6] bg-white p-8">
      <h2
        className="mb-6 text-2xl font-bold text-[#0F1F38]"
        style={{ fontFamily: "var(--font-lora), ui-serif, Georgia, serif" }}
      >
        Renter reviews
      </h2>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="all">All reviews</TabsTrigger>
          <TabsTrigger value="positive">Positive</TabsTrigger>
          <TabsTrigger value="critical">Critical</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4 text-[#717182]">
          <p className="text-sm leading-relaxed text-[#0F1F38]">
            {hasApprovedReviews
              ? "Individual review quotes are not shown on the public page. Approved summaries appear in the distilled insights section above."
              : "There are no verified reviews to display yet. Structured scores will appear here after renters submit approved reviews."}
          </p>
        </TabsContent>
        <TabsContent value="positive" className="text-sm text-[#717182]">
          <p>
            Filtering by tone needs a public reviews feed. For now, use the trust breakdown and
            insights for an overall picture.
          </p>
        </TabsContent>
        <TabsContent value="critical" className="text-sm text-[#717182]">
          <p>
            Filtering by tone needs a public reviews feed. For now, use the trust breakdown and
            insights for an overall picture.
          </p>
        </TabsContent>
      </Tabs>
    </div>
  );
}
