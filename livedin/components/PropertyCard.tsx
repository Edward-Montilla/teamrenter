import Link from "next/link";
import type { PropertyListItem } from "@/lib/types";

type PropertyCardProps = {
  item: PropertyListItem;
};

function formatAddress(item: PropertyListItem): string {
  const parts = [item.address_line1, item.city, item.province].filter(Boolean);
  return parts.join(", ");
}

export function PropertyCard({ item }: PropertyCardProps) {
  return (
    <Link
      href={`/properties/${item.id}`}
      className="block rounded-lg border border-zinc-200 bg-white p-4 shadow-sm transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-600 dark:hover:bg-zinc-800"
    >
      <h3 className="font-semibold text-foreground">{item.display_name}</h3>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{formatAddress(item)}</p>
      {item.management_company && (
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-500">
          {item.management_company}
        </p>
      )}
      <div className="mt-2 flex items-center gap-4 text-sm">
        <span className="font-medium text-foreground">
          Score: {item.trustscore_display_0_6}/6
        </span>
        <span className="text-zinc-500 dark:text-zinc-400">
          {item.review_count} {item.review_count === 1 ? "review" : "reviews"}
        </span>
      </div>
    </Link>
  );
}
