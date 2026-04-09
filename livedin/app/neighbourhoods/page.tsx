import Link from "next/link";
import { PublicSiteHeader } from "@/components/auth/PublicSiteHeader";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { NeighbourhoodCard } from "@/components/NeighbourhoodCard";
import { PageHeader } from "@/components/PageHeader";
import { loadNeighbourhoods } from "@/lib/neighbourhoods-data";
import { pageContainerClass, sectionCardClass, secondaryButtonClass } from "@/lib/ui";

type Props = {
  searchParams: Promise<{ city?: string }>;
};

export default async function NeighbourhoodsPage({ searchParams }: Props) {
  const { city } = await searchParams;
  const cityFilter = city?.trim() || null;

  let data;
  let error = false;
  try {
    data = await loadNeighbourhoods(cityFilter);
  } catch {
    error = true;
    data = { items: [], total: 0 };
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-foreground dark:bg-zinc-950">
      <PublicSiteHeader />
      <main className={`${pageContainerClass} py-8 sm:py-10`}>
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Neighbourhoods" },
          ]}
        />

        <div className="mt-6 space-y-8">
          <PageHeader
            title="Neighbourhoods"
            subtitle="Explore areas with aggregated trust signals and linked rental properties."
          />

          <div className="flex flex-wrap gap-3">
            <Link href="/" className={secondaryButtonClass}>
              Back to properties
            </Link>
            {cityFilter ? (
              <Link href="/neighbourhoods" className={secondaryButtonClass}>
                Clear city filter
              </Link>
            ) : null}
          </div>

          {error ? (
            <div className={`${sectionCardClass} p-6 text-red-700 dark:text-red-300`}>
              We could not load neighbourhoods. Try again later.
            </div>
          ) : null}

          {!error && data.items.length === 0 ? (
            <div className={`${sectionCardClass} p-8 text-center text-zinc-600 dark:text-zinc-400`}>
              No neighbourhoods found
              {cityFilter ? ` for “${cityFilter}”.` : "."}
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.items.map((item) => (
              <NeighbourhoodCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
