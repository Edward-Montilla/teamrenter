import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicSiteHeader } from "@/components/auth/PublicSiteHeader";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { PropertyCard } from "@/components/PropertyCard";
import { PageHeader } from "@/components/PageHeader";
import { TrustScoreBadge } from "@/components/TrustScoreBadge";
import { loadNeighbourhoodDetail } from "@/lib/neighbourhoods-data";
import { pageContainerClass, sectionCardClass, secondaryButtonClass } from "@/lib/ui";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function NeighbourhoodDetailPage({ params }: Props) {
  const { id } = await params;

  let detail;
  try {
    detail = await loadNeighbourhoodDetail(id);
  } catch {
    return (
      <div className="min-h-screen bg-zinc-50 px-4 py-16 text-center text-zinc-600 dark:bg-zinc-950 dark:text-zinc-400">
        <PublicSiteHeader />
        <p className="mt-8">We could not load this neighbourhood.</p>
        <Link href="/neighbourhoods" className="mt-4 inline-block text-[var(--theme-primary)] underline">
          Back to neighbourhoods
        </Link>
      </div>
    );
  }

  if (!detail) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-foreground dark:bg-zinc-950">
      <PublicSiteHeader />
      <main className={`${pageContainerClass} py-8 sm:py-10`}>
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Neighbourhoods", href: "/neighbourhoods" },
            { label: detail.name },
          ]}
        />

        <div className="mt-6 space-y-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <PageHeader
              title={detail.name}
              subtitle={`${detail.city}, ${detail.province}`}
            />
            <TrustScoreBadge
              score={detail.avg_trust_score}
              reviewCount={detail.property_count > 0 ? detail.property_count : 0}
              caption={detail.property_count === 0 ? "No properties" : "Area average"}
              className="lg:mt-2"
            />
          </div>

          {detail.description ? (
            <p className="max-w-3xl text-base leading-7 text-zinc-600 dark:text-zinc-400">
              {detail.description}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <Link href="/neighbourhoods" className={secondaryButtonClass}>
              All neighbourhoods
            </Link>
            <Link href="/" className={secondaryButtonClass}>
              Browse properties
            </Link>
          </div>

          <section className={`${sectionCardClass} p-6 sm:p-8`}>
            <h2 className="text-xl font-semibold text-foreground">Properties in this area</h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              {detail.properties.length}{" "}
              {detail.properties.length === 1 ? "listing" : "listings"}
            </p>
            <div className="mt-6 space-y-4">
              {detail.properties.length === 0 ? (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  No active properties are linked to this neighbourhood yet.
                </p>
              ) : (
                detail.properties.map((p) => <PropertyCard key={p.id} item={p} />)
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
