import Link from "next/link";
import type { PropertyListItem } from "@/lib/types";
import { ShortlistButton } from "@/components/ShortlistButton";
import { TrustScoreBadge } from "@/components/TrustScoreBadge";

type PropertyCardProps = {
  item: PropertyListItem;
  initialShortlisted?: boolean;
};

function formatAddress(item: PropertyListItem): string {
  const parts = [item.address_line1, item.city, item.province].filter(Boolean);
  return parts.join(", ");
}

export function PropertyCard({
  item,
  initialShortlisted = false,
}: PropertyCardProps) {
  return (
    <div className="relative rounded-3xl border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700">
      <ShortlistButton
        propertyId={item.id}
        initialShortlisted={initialShortlisted}
        className="absolute right-3 top-3 z-10"
      />
      <Link
        href={`/properties/${item.id}`}
        className="group block p-5"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 pr-12">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-semibold text-foreground">{item.display_name}</h3>
              {item.management_company ? (
                <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">
                  {item.management_company}
                </span>
              ) : null}
            </div>
            <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              {formatAddress(item)}
            </p>
          </div>
          <TrustScoreBadge
            score={item.trustscore_display_0_5}
            reviewCount={item.review_count}
            size="md"
          />
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 pt-4 text-sm dark:border-zinc-800">
          <span className="font-medium text-zinc-700 dark:text-zinc-300">
            {item.review_count} {item.review_count === 1 ? "review" : "reviews"}
          </span>
          <span className="font-medium text-zinc-950 transition group-hover:translate-x-0.5 dark:text-zinc-100">
            View details
          </span>
        </div>
      </Link>
    </div>
  );
}
