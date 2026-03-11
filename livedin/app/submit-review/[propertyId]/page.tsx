import { SubmitReviewPageClient } from "@/components/reviews/SubmitReviewPageClient";

type Props = {
  params: Promise<{ propertyId: string }>;
};

export default async function SubmitReviewPage({ params }: Props) {
  const { propertyId } = await params;

  return <SubmitReviewPageClient propertyId={propertyId} />;
}
