import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicSiteHeader } from "@/components/auth/PublicSiteHeader";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { FeedbackPanel } from "@/components/ui/FeedbackPanel";
import { getPropertyDetail } from "@/lib/property-detail";
import type { PropertyDetailPublic } from "@/lib/types";
import { pageContainerClass, primaryButtonClass, sectionCardClass, secondaryButtonClass } from "@/lib/ui";

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

function formatShortLocation(p: PropertyDetailPublic["property"]): string {
  return [p.city, p.province].filter(Boolean).join(", ");
}

function formatScore(score: number): string {
  return score.toFixed(1).replace(/\.0$/, "");
}

function formatUpdatedDate(value: string): string {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
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

function ScoreDots({ score }: { score: number }) {
  const filled = Math.round(score);
  return (
    <div className="flex gap-2" aria-hidden>
      {Array.from({ length: 6 }, (_, index) => (
        <span
          key={index}
          className={`h-2.5 w-8 rounded-full ${
            index < filled
              ? "bg-slate-800 dark:bg-slate-100"
              : "bg-slate-200 dark:bg-slate-700"
          }`}
        />
      ))}
    </div>
  );
}

function MetricBar({ label, value }: { label: string; value: number }) {
  const width = `${(value / 6) * 100}%`;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-950">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</p>
          <p className="mt-3 text-2xl font-semibold text-slate-900 dark:text-slate-50">
            {formatScore(value)}
          </p>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">/ 6</p>
      </div>
      <div className="mt-4 h-2 rounded-full bg-slate-200 dark:bg-slate-800">
        <div
          className="h-2 rounded-full bg-slate-800 transition-[width] dark:bg-slate-100"
          style={{ width }}
        />
      </div>
    </div>
  );
}

export default async function PropertyDetailPage({ params }: Props) {
  const { id } = await params;
  const data = await getPropertyDetail(id);
  if (!data) notFound();

  const { property, aggregates, insights } = data;
  const hasReviews = aggregates.review_count > 0;

  return (
    <div className="min-h-screen bg-zinc-50 text-slate-950 dark:bg-slate-950 dark:text-slate-50">
      <PublicSiteHeader />
      <div className={`${pageContainerClass} py-8 sm:py-10`}>
        <div className="space-y-6">
          <Breadcrumbs
            items={[
              { label: "Browse properties", href: "/" },
              { label: property.display_name },
            ]}
          />

          <div className="flex flex-wrap gap-3">
            <Link href="/" className={secondaryButtonClass}>
              Back to results
            </Link>
            <Link href={`/submit-review/${id}`} className={primaryButtonClass}>
              Leave a review
            </Link>
          </div>
        </div>

        <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="min-w-0">
            <header className={`${sectionCardClass} p-6 sm:p-8`}>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
                Property detail
              </p>
              <h1 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight text-slate-950 dark:text-slate-50 sm:text-4xl lg:text-5xl">
                {property.display_name}
              </h1>
              <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-lg text-slate-500 dark:text-slate-400">
                {property.management_company && <span>{property.management_company}</span>}
                {property.management_company && <span aria-hidden>•</span>}
                <span>{formatAddress(property)}</span>
              </div>
              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <div className="rounded-3xl bg-slate-950 p-5 text-white dark:bg-slate-100 dark:text-slate-950">
                  <p className="text-xs uppercase tracking-[0.2em] opacity-70">Trust score</p>
                  <p className="mt-3 text-4xl font-semibold">
                    {formatScore(aggregates.display_trustscore_0_6)}/6
                  </p>
                  <div className="mt-4">
                    <ScoreDots score={aggregates.display_trustscore_0_6} />
                  </div>
                </div>
                <div className="rounded-3xl border border-slate-200 p-5 dark:border-slate-800">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                    Review count
                  </p>
                  <p className="mt-3 text-3xl font-semibold text-slate-950 dark:text-slate-50">
                    {aggregates.review_count}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                    <ConfidenceLabel reviewCount={aggregates.review_count} />
                  </p>
                </div>
                <div className="rounded-3xl border border-slate-200 p-5 dark:border-slate-800">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                    Insight summary
                  </p>
                  <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
                    {insights
                      ? "Approved renter insight is available below."
                      : hasReviews
                        ? "Reviews exist, but a public insight summary has not been approved yet."
                        : "Public insight summaries appear after enough verified reviews are available."}
                  </p>
                </div>
              </div>
            </header>

            <section className={`${sectionCardClass} mt-8 p-6 sm:p-8`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-semibold text-slate-950 dark:text-slate-50">
                    Structured rating breakdown
                  </h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Scores are shown on a 0 to 6 scale using approved public aggregates only.
                  </p>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Updated {formatUpdatedDate(aggregates.last_updated)}
                </p>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {METRIC_KEYS.map((key) => (
                  <MetricBar
                    key={key}
                    label={METRIC_LABELS[key]}
                    value={aggregates[key]}
                  />
                ))}
              </div>

              {!hasReviews && (
                <div className="mt-6">
                  <FeedbackPanel
                    title="No verified reviews yet"
                    description="This property is live, but renters have not submitted approved reviews yet. Be the first to share your experience."
                    primaryAction={{ label: "Leave a review", href: `/submit-review/${id}` }}
                  />
                </div>
              )}
            </section>

            <section className={`${sectionCardClass} mt-8 p-6 sm:p-8`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-2xl font-semibold text-slate-950 dark:text-slate-50">
                  Distilled insights
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Public summary only
                </p>
              </div>

              {insights ? (
                <div className="mt-6 space-y-4">
                  <p className="whitespace-pre-wrap text-base leading-8 text-slate-700 dark:text-slate-300">
                    {insights.insights_text}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Last updated {formatUpdatedDate(insights.last_generated_at)}
                  </p>
                </div>
              ) : (
                <div className="mt-6">
                  <FeedbackPanel
                    title={hasReviews ? "Insight summary not published yet" : "Not enough data for insights yet"}
                    description={
                      hasReviews
                        ? "Verified reviews exist, but there is no approved public summary available yet. Check back after moderation."
                        : "Insights appear once enough verified review data is available for a meaningful summary."
                    }
                  />
                </div>
              )}
            </section>
          </div>

          <aside className="space-y-6 lg:sticky lg:top-8 lg:self-start">
            <section className={`${sectionCardClass} p-6`}>
              <h2 className="text-lg font-semibold text-slate-950 dark:text-slate-50">
                Next step
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">
                Confirm the address, then share a structured renter review to help future tenants evaluate this property.
              </p>
              <Link
                href={`/submit-review/${id}`}
                className={`${primaryButtonClass} mt-5 w-full`}
              >
                Leave a review
              </Link>
            </section>

            <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="h-44 bg-[linear-gradient(135deg,#334155_0%,#475569_30%,#94a3b8_100%)]" />
              <div className="p-6">
                <h2 className="text-xl font-semibold text-slate-950 dark:text-slate-50">
                  Location details
                </h2>
                <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
                  {formatShortLocation(property)}
                  <br />
                  {property.postal_code}
                  <br />
                  {property.address_line1}
                  {property.address_line2 ? `, ${property.address_line2}` : ""}
                </p>
                {property.management_company && (
                  <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
                    Managed by {property.management_company}
                  </p>
                )}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
