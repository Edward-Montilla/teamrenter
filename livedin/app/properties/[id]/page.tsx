import Link from "next/link";
import { notFound } from "next/navigation";
import { getPropertyDetail } from "@/lib/property-detail-mock";
import type { PropertyDetailPublic } from "@/lib/types";

type Props = {
  params: Promise<{ id: string }>;
};

const METRIC_LABELS: Record<keyof Pick<
  PropertyDetailPublic["aggregates"],
  | "display_management_responsiveness_0_6"
  | "display_maintenance_timeliness_0_6"
  | "display_listing_accuracy_0_6"
  | "display_fee_transparency_0_6"
  | "display_lease_clarity_0_6"
>, string> = {
  display_management_responsiveness_0_6: "Management responsiveness",
  display_maintenance_timeliness_0_6: "Maintenance timeliness",
  display_listing_accuracy_0_6: "Listing accuracy",
  display_fee_transparency_0_6: "Fee transparency",
  display_lease_clarity_0_6: "Lease clarity",
};

const METRIC_KEYS = [
  "display_management_responsiveness_0_6",
  "display_maintenance_timeliness_0_6",
  "display_listing_accuracy_0_6",
  "display_fee_transparency_0_6",
  "display_lease_clarity_0_6",
] as const;

function formatAddress(p: PropertyDetailPublic["property"]): string {
  const parts = [
    p.address_line1,
    p.address_line2,
    [p.city, p.province].filter(Boolean).join(" "),
    p.postal_code,
  ].filter(Boolean);
  return parts.join(", ");
}

function ConfidenceLabel({ reviewCount }: { reviewCount: number }) {
  if (reviewCount === 0) {
    return (
      <span className="text-zinc-500 dark:text-zinc-400">
        No reviews yet / Not enough data
      </span>
    );
  }
  const label =
    reviewCount >= 10 ? "High confidence" : reviewCount >= 3 ? "Moderate confidence" : "Based on few reviews";
  return (
    <span className="text-zinc-600 dark:text-zinc-400">
      Based on {reviewCount} {reviewCount === 1 ? "review" : "reviews"} · {label}
    </span>
  );
}

export default async function PropertyDetailPage({ params }: Props) {
  const { id } = await params;
  const data = await getPropertyDetail(id);
  if (!data) notFound();

  const { property, aggregates, insights } = data;
  const hasReviews = aggregates.review_count > 0;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <Link
            href="/"
            className="text-sm font-medium text-foreground underline hover:no-underline"
          >
            Back to results
          </Link>
          <Link
            href={`/submit-review/${id}`}
            className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-foreground hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:hover:bg-zinc-800"
          >
            Leave a review
          </Link>
        </div>

        <header className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {property.display_name}
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            {formatAddress(property)}
          </p>
          {property.management_company && (
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-500">
              {property.management_company}
            </p>
          )}
        </header>

        <section className="mb-8 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-950">
          <h2 className="sr-only">Trust score</h2>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-foreground">
              {aggregates.display_trustscore_0_6}
            </span>
            <span className="text-xl text-zinc-500 dark:text-zinc-400">/ 6</span>
          </div>
          <p className="mt-1 text-sm">
            <ConfidenceLabel reviewCount={aggregates.review_count} />
          </p>
        </section>

        <section className="mb-8 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-950">
          <h2 className="mb-4 text-lg font-semibold text-foreground">
            Score breakdown
          </h2>
          <ul className="space-y-3">
            {METRIC_KEYS.map((key) => (
              <li
                key={key}
                className="flex flex-wrap items-center justify-between gap-2"
              >
                <span className="text-sm text-zinc-700 dark:text-zinc-300">
                  {METRIC_LABELS[key]}
                </span>
                <span className="font-medium text-foreground">
                  {aggregates[key]} / 6
                </span>
              </li>
            ))}
          </ul>
          {!hasReviews && (
            <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
              No reviews yet. Scores will appear once renters leave reviews.
            </p>
          )}
        </section>

        <section className="mb-8 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-950">
          <h2 className="mb-4 text-lg font-semibold text-foreground">
            Distilled insights
          </h2>
          {insights ? (
            <div>
              <p className="text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
                {insights.insights_text}
              </p>
              <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                Last updated {new Date(insights.last_generated_at).toLocaleDateString()}
              </p>
            </div>
          ) : (
            <p className="text-zinc-500 dark:text-zinc-400">
              {hasReviews
                ? "No insights yet"
                : "Not enough data"}
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
