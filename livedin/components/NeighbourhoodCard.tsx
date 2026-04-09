import Link from "next/link";
import type { NeighbourhoodListItem } from "@/lib/types";
import { TrustScoreBadge } from "@/components/TrustScoreBadge";
import { sectionCardClass, cn } from "@/lib/ui";

type NeighbourhoodCardProps = {
  item: NeighbourhoodListItem;
  className?: string;
};

export function NeighbourhoodCard({ item, className }: NeighbourhoodCardProps) {
  return (
    <Link
      href={`/neighbourhoods/${item.id}`}
      className={cn(
        sectionCardClass,
        "block p-5 transition hover:-translate-y-0.5 hover:shadow-md",
        className,
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-foreground">{item.name}</h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {item.city}, {item.province}
          </p>
          <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
            {item.property_count}{" "}
            {item.property_count === 1 ? "property" : "properties"}
          </p>
        </div>
        <TrustScoreBadge
          score={item.avg_trust_score}
          reviewCount={item.property_count > 0 ? Math.max(1, item.property_count) : 0}
          caption={
            item.property_count === 0
              ? "No properties"
              : "Area average"
          }
          size="sm"
        />
      </div>
    </Link>
  );
}
