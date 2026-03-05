import { SubmitReviewPageClient } from "@/components/reviews/SubmitReviewPageClient";
import type { ReviewGateState } from "@/lib/types";

const VALID_GATE_VALUES: ReviewGateState[] = [
  "unauthenticated",
  "unverified",
  "limit_reached",
  "already_reviewed",
  "allowed",
];

type Props = {
  params: Promise<{ propertyId: string }>;
  searchParams: Promise<{ gate?: string }>;
};

export default async function SubmitReviewPage({ params, searchParams }: Props) {
  const { propertyId } = await params;
  const { gate: gateParam } = await searchParams;
  const gateOverride: ReviewGateState | null =
    gateParam && VALID_GATE_VALUES.includes(gateParam as ReviewGateState)
      ? (gateParam as ReviewGateState)
      : null;

  return (
    <SubmitReviewPageClient
      propertyId={propertyId}
      gateOverride={gateOverride}
    />
  );
}
