import Link from "next/link";
import type { ComparisonPropertyItem, DisplayScore0_5 } from "@/lib/types";
import { TrustScoreBadge } from "@/components/TrustScoreBadge";
import { sectionCardClass, cn } from "@/lib/ui";

const METRICS: Array<{
  key: keyof ComparisonPropertyItem["aggregates"];
  label: string;
}> = [
  {
    key: "display_management_responsiveness_0_5",
    label: "Management responsiveness",
  },
  {
    key: "display_maintenance_timeliness_0_5",
    label: "Maintenance timeliness",
  },
  { key: "display_listing_accuracy_0_5", label: "Listing accuracy" },
  { key: "display_fee_transparency_0_5", label: "Fee transparency" },
  { key: "display_lease_clarity_0_5", label: "Lease clarity" },
];

type ComparisonTableProps = {
  properties: ComparisonPropertyItem[];
  onRemove?: (propertyId: string) => void;
  className?: string;
};

export function ComparisonTable({
  properties,
  onRemove,
  className,
}: ComparisonTableProps) {
  if (properties.length === 0) {
    return (
      <div
        className={cn(
          sectionCardClass,
          "flex flex-col items-center justify-center gap-3 p-12 text-center",
          className,
        )}
      >
        <p className="text-lg font-medium text-foreground">No properties selected</p>
        <p className="max-w-md text-sm text-zinc-600 dark:text-zinc-400">
          Add up to three property IDs in the URL, for example{" "}
          <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs dark:bg-zinc-900">
            /comparison?ids=uuid1,uuid2
          </code>
          .
        </p>
        <Link href="/" className="text-sm font-medium text-[var(--theme-primary)] hover:underline">
          Browse properties
        </Link>
      </div>
    );
  }

  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full min-w-[640px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-zinc-200 dark:border-zinc-800">
            <th
              scope="col"
              className="sticky left-0 z-10 min-w-[180px] bg-[var(--background)] px-3 py-3 font-semibold text-foreground"
            >
              Metric
            </th>
            {properties.map((p) => (
              <th
                key={p.property.id}
                scope="col"
                className="min-w-[200px] px-3 py-3 align-bottom"
              >
                <div className="flex flex-col gap-2">
                  <Link
                    href={`/properties/${p.property.id}`}
                    className="font-semibold text-[var(--theme-primary)] hover:underline"
                  >
                    {p.property.display_name}
                  </Link>
                  <p className="text-xs font-normal text-zinc-500 dark:text-zinc-400">
                    {[p.property.address_line1, p.property.city].filter(Boolean).join(", ")}
                  </p>
                  {onRemove ? (
                    <button
                      type="button"
                      className="self-start text-xs font-medium text-zinc-600 underline hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                      onClick={() => onRemove(p.property.id)}
                    >
                      Remove
                    </button>
                  ) : null}
                  <div className="flex justify-center pt-2">
                    <TrustScoreBadge
                      score={p.aggregates.display_trustscore_0_5}
                      reviewCount={p.aggregates.review_count}
                      size="sm"
                    />
                  </div>
                  <p className="text-center text-xs text-zinc-500 dark:text-zinc-400">
                    {p.aggregates.review_count}{" "}
                    {p.aggregates.review_count === 1 ? "review" : "reviews"}
                  </p>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-zinc-200 dark:border-zinc-800">
            <th
              scope="row"
              className="sticky left-0 z-10 bg-[var(--background)] px-3 py-2 font-medium text-zinc-700 dark:text-zinc-300"
            >
              Neighbourhood
            </th>
            {properties.map((p) => (
              <td key={`${p.property.id}-n`} className="px-3 py-2 text-zinc-600 dark:text-zinc-400">
                {p.neighbourhood ?? "—"}
              </td>
            ))}
          </tr>
          <tr className="border-b border-zinc-200 dark:border-zinc-800">
            <th
              scope="row"
              className="sticky left-0 z-10 bg-[var(--background)] px-3 py-2 font-medium text-zinc-700 dark:text-zinc-300"
            >
              City
            </th>
            {properties.map((p) => (
              <td key={`${p.property.id}-c`} className="px-3 py-2">
                {p.property.city}
              </td>
            ))}
          </tr>
          {METRICS.map((m) => (
            <tr
              key={m.key}
              className="border-b border-zinc-200 dark:border-zinc-800"
            >
              <th
                scope="row"
                className="sticky left-0 z-10 bg-[var(--background)] px-3 py-2 font-medium text-zinc-700 dark:text-zinc-300"
              >
                {m.label}
              </th>
              {properties.map((p) => {
                const v = p.aggregates[m.key] as DisplayScore0_5;
                return (
                  <td key={`${p.property.id}-${m.key}`} className="px-3 py-2 tabular-nums">
                    {p.aggregates.review_count === 0 ? "—" : v}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
