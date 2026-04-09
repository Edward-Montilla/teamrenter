import Link from "next/link";
import { notFound } from "next/navigation";
import { Flag, MapPin, Share2 } from "lucide-react";
import { CategoryScoreBar } from "@/components/facelift/CategoryScoreBar";
import { FaceliftPropertyReviewsSection } from "@/components/facelift/FaceliftPropertyReviewsSection";
import { FaceliftPropertyShortlistHeart } from "@/components/facelift/FaceliftPropertyShortlistHeart";
import { TrustScoreBadge } from "@/components/facelift/TrustScoreBadge";
import { trustScoreDisplayFacelift } from "@/lib/facelift-mappers";
import { aggregatesToSevenCategoryBars } from "@/lib/facelift-seven-categories";
import { getPropertyDetail } from "@/lib/property-detail";
import type { PropertyDetailPublic } from "@/lib/types";

type Props = {
  params: Promise<{ id: string }>;
};

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

function formatUpdatedDate(value: string): string {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function PropertyDetailPage({ params }: Props) {
  const { id } = await params;
  const data = await getPropertyDetail(id);
  if (!data) notFound();

  const { property, aggregates, insights, photos } = data;
  const hasReviews = aggregates.review_count > 0;
  const heroPhoto = photos[0];
  const heroUrl = heroPhoto?.display_url ?? null;
  const trust10 = trustScoreDisplayFacelift(aggregates.display_trustscore_0_5);
  const categoryBars = aggregatesToSevenCategoryBars(aggregates);

  return (
    <div className="min-h-screen bg-[#F7F4EF]">
      {/* Hero */}
      <div className="relative h-96 w-full">
        {heroUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={heroUrl}
            alt={property.display_name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,#cbd5e1_0%,#64748b_55%,#334155_100%)] px-6 text-center"
            role="img"
            aria-label="No property photo available"
          >
            <p className="max-w-md text-sm leading-relaxed text-white/95">
              No published photo yet. Images appear here when admins attach public gallery URLs for
              this listing.
            </p>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute bottom-6 left-0 right-0">
          <div className="mx-auto max-w-7xl px-6">
            <div className="flex items-end justify-between gap-4">
              <div className="min-w-0 text-white">
                <h1
                  className="mb-2 text-3xl font-bold sm:text-4xl"
                  style={{ fontFamily: "var(--font-lora), ui-serif, Georgia, serif" }}
                >
                  {property.display_name}
                </h1>
                <div className="flex items-center gap-2 text-lg text-white/95">
                  <MapPin className="h-5 w-5 shrink-0" aria-hidden />
                  <span className="truncate">{formatShortLocation(property)}</span>
                </div>
              </div>
              <div className="flex shrink-0 gap-3">
                <button
                  type="button"
                  className="rounded-full bg-white/90 p-3 backdrop-blur-sm transition-colors hover:bg-white"
                  aria-label="Share property"
                  disabled
                  title="Sharing is not available yet"
                >
                  <Share2 className="h-5 w-5 text-[#0F1F38]" />
                </button>
                <FaceliftPropertyShortlistHeart propertyId={id} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="flex flex-col gap-8 lg:flex-row">
          <div className="min-w-0 flex-1 space-y-6">
            {/* Trust + category bars */}
            <div className="rounded-[16px] border border-[#E2DDD6] bg-white p-8">
              <div className="flex flex-col items-start gap-8 lg:flex-row">
                <div className="shrink-0">
                  <TrustScoreBadge
                    score={trust10}
                    size="hero"
                    empty={!hasReviews}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h2
                    className="mb-2 text-2xl font-bold text-[#0F1F38]"
                    style={{ fontFamily: "var(--font-lora), ui-serif, Georgia, serif" }}
                  >
                    TrustScore rating
                  </h2>
                  <p className="mb-6 text-[#717182]">
                    Based on {aggregates.review_count} verified renter{" "}
                    {aggregates.review_count === 1 ? "review" : "reviews"}
                    {hasReviews ? (
                      <>
                        {" "}
                        · Updated {formatUpdatedDate(aggregates.last_updated)}
                      </>
                    ) : null}
                  </p>
                  <div className="grid grid-cols-1 gap-4">
                    {categoryBars.map((row) => (
                      <CategoryScoreBar
                        key={row.label}
                        category={row.label}
                        score10={row.score10}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* About */}
            <div className="rounded-[16px] border border-[#E2DDD6] bg-white p-8">
              <h2
                className="mb-4 text-2xl font-bold text-[#0F1F38]"
                style={{ fontFamily: "var(--font-lora), ui-serif, Georgia, serif" }}
              >
                About this property
              </h2>
              <p className="mb-4 leading-relaxed text-[#0F1F38]">
                {insights?.insights_text ??
                  (hasReviews
                    ? "Verified reviews exist for this address. An approved public insight summary may appear here after moderation."
                    : "Structured renter scores and approved insight summaries will appear here as the community contributes verified reviews.")}
              </p>
              <div className="flex flex-wrap gap-4">
                <div className="rounded-full bg-[#F7F4EF] px-4 py-2">
                  <span className="text-sm text-[#0F1F38]">
                    {property.management_company ?? "Independent / TBD"}
                  </span>
                </div>
                <div className="rounded-full bg-[#F7F4EF] px-4 py-2">
                  <span className="text-sm text-[#0F1F38]">{formatAddress(property)}</span>
                </div>
              </div>
            </div>

            <FaceliftPropertyReviewsSection hasApprovedReviews={hasReviews} />

            {photos.length > 1 ? (
              <div className="rounded-[16px] border border-[#E2DDD6] bg-white p-8">
                <h2
                  className="mb-4 text-2xl font-bold text-[#0F1F38]"
                  style={{ fontFamily: "var(--font-lora), ui-serif, Georgia, serif" }}
                >
                  More photos
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {photos.slice(1).map((photo, index) => (
                    <div
                      key={photo.id}
                      className="overflow-hidden rounded-xl border border-[#E2DDD6] bg-[#F7F4EF]"
                    >
                      {photo.display_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={photo.display_url}
                          alt={`${property.display_name} photo ${index + 2}`}
                          className="h-48 w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-48 items-center justify-center px-4 text-center text-sm text-[#717182]">
                          Registered photo — display URL not configured
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          {/* Sidebar */}
          <aside className="w-full shrink-0 lg:w-80">
            <div className="sticky top-24 rounded-[16px] border border-[#E2DDD6] bg-white p-6">
              <div className="mb-6 text-center">
                <div
                  className="mb-2 text-3xl font-bold text-[#0F1F38]"
                  style={{ fontFamily: "var(--font-lora), ui-serif, Georgia, serif" }}
                >
                  {property.postal_code}
                </div>
                <p className="text-sm text-[#717182]">Rental property</p>
              </div>

              <Link
                href={`/write-review/${id}`}
                className="mb-3 block w-full rounded-[12px] bg-[#E8913A] py-3 text-center font-semibold text-white transition-colors hover:bg-[#d17f2f]"
              >
                Write a review
              </Link>

              <button
                type="button"
                disabled
                className="mb-4 w-full cursor-not-allowed rounded-[12px] bg-[#0F1F38]/40 py-3 font-semibold text-white"
                title="Coming soon"
              >
                Contact landlord
              </button>

              <button
                type="button"
                disabled
                className="flex w-full cursor-not-allowed items-center justify-center gap-2 py-2 text-[#717182]"
                title="Coming soon"
              >
                <Flag className="h-4 w-4" aria-hidden />
                Report issue
              </button>

              <div className="mt-6 border-t border-[#E2DDD6] pt-6">
                <h4 className="mb-3 font-semibold text-[#0F1F38]">Compare similar</h4>
                <Link
                  href="/comparison"
                  className="text-sm text-[#E8913A] transition-colors hover:text-[#d17f2f]"
                >
                  Open comparison →
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
