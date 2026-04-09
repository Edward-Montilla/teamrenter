"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { TrustScoreBadge } from "@/components/facelift/TrustScoreBadge";
import {
  aggregatesToSevenCategoryBars,
  FACELIFT_CATEGORY_LABELS,
} from "@/lib/facelift-seven-categories";
import { trustScoreDisplayFacelift } from "@/lib/facelift-mappers";
import { readShortlistIds } from "@/lib/shortlist-local";
import type { PropertyDetailPublic } from "@/lib/types";

function parseIdsParam(raw: string | null): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Client-only comparison from shortlist and/or `?ids=` query (comma-separated UUIDs).
 * Matches Facelift grid/table behaviour without inventing neighbourhood rows.
 */
export function ComparisonClient() {
  const searchParams = useSearchParams();
  const [rows, setRows] = useState<PropertyDetailPublic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const fromQuery = parseIdsParam(searchParams.get("ids"));
      const fromStorage = readShortlistIds();
      const merged = [...new Set([...fromQuery, ...fromStorage])].slice(0, 5);

      if (merged.length === 0) {
        if (!cancelled) {
          setRows([]);
          setLoading(false);
        }
        return;
      }

      const loaded = await Promise.all(
        merged.map(async (id) => {
          const res = await fetch(`/api/properties/${id}`);
          if (!res.ok) return null;
          return (await res.json()) as PropertyDetailPublic;
        }),
      );

      if (!cancelled) {
        setRows(loaded.filter((x): x is PropertyDetailPublic => x != null));
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-24 text-center text-[#717182]">
        Loading comparison…
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16 text-center">
        <h1
          className="mb-4 text-3xl font-bold text-[#0F1F38]"
          style={{ fontFamily: "var(--font-lora), ui-serif, Georgia, serif" }}
        >
          Compare properties
        </h1>
        <p className="text-[#717182]">
          Add properties to your shortlist from listing pages, or open{" "}
          <code className="rounded bg-[#F7F4EF] px-1 text-xs">/comparison?ids=uuid1,uuid2</code>.
        </p>
        <Link
          href="/search"
          className="mt-8 inline-block rounded-[12px] bg-[#E8913A] px-6 py-3 font-semibold text-white"
        >
          Browse search
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-[#F7F4EF] py-12">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-8">
          <h1
            className="mb-2 text-4xl font-bold text-[#0F1F38]"
            style={{ fontFamily: "var(--font-lora), ui-serif, Georgia, serif" }}
          >
            Compare properties
          </h1>
          <p className="text-[#717182]">Side-by-side scores from public aggregates (up to five).</p>
        </div>

        <div className="overflow-hidden rounded-[16px] border border-[#E2DDD6] bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-[#E2DDD6]">
                  <th className="w-56 bg-[#F7F4EF] p-4 text-left font-semibold text-[#0F1F38]">
                    Property
                  </th>
                  {rows.map((d) => (
                    <th key={d.property.id} className="p-4 text-center align-top">
                      <div className="flex flex-col items-center gap-3">
                        <div className="h-28 w-full max-w-[200px] overflow-hidden rounded-lg bg-[#E2DDD6]">
                          {d.photos[0]?.display_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={d.photos[0].display_url}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : null}
                        </div>
                        <div>
                          <p
                            className="font-semibold text-[#0F1F38]"
                            style={{
                              fontFamily: "var(--font-lora), ui-serif, Georgia, serif",
                            }}
                          >
                            {d.property.display_name}
                          </p>
                          <p className="text-sm text-[#717182]">
                            {[d.property.city, d.property.province].filter(Boolean).join(", ")}
                          </p>
                        </div>
                        <Link
                          href={`/properties/${d.property.id}`}
                          className="text-xs font-semibold text-[#E8913A] hover:text-[#d17f2f]"
                        >
                          View listing
                        </Link>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-[#E2DDD6] bg-[#F7F4EF]/50">
                  <td className="p-4 font-semibold text-[#0F1F38]">Overall TrustScore</td>
                  {rows.map((d) => (
                    <td key={d.property.id} className="p-4 text-center">
                      <div className="flex justify-center">
                        <TrustScoreBadge
                          score={trustScoreDisplayFacelift(d.aggregates.display_trustscore_0_5)}
                          size="lg"
                          empty={d.aggregates.review_count === 0}
                        />
                      </div>
                    </td>
                  ))}
                </tr>
                {FACELIFT_CATEGORY_LABELS.map((label, idx) => (
                  <tr
                    key={label}
                    className={`border-b border-[#E2DDD6] ${idx % 2 === 0 ? "bg-white" : "bg-[#F7F4EF]/30"}`}
                  >
                    <td className="p-4 font-semibold text-[#0F1F38]">{label}</td>
                    {rows.map((d) => {
                      const bars = aggregatesToSevenCategoryBars(d.aggregates);
                      const cell = bars.find((b) => b.label === label);
                      const v = cell?.score10;
                      return (
                        <td key={d.property.id} className="p-4 text-center">
                          {v == null ? (
                            <span className="text-[#717182]">—</span>
                          ) : (
                            <span
                              className="text-xl font-semibold text-[#E8913A]"
                              style={{
                                fontFamily: "var(--font-lora), ui-serif, Georgia, serif",
                              }}
                            >
                              {v.toFixed(1)}
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
