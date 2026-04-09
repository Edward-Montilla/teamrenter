"use client";

import { Grid, List, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { PropertyListItem, PropertySearchResponse, UiListState } from "@/lib/types";
import { searchProperties } from "@/lib/property-search";
import { trustScoreDisplayFacelift } from "@/lib/facelift-mappers";
import { readShortlistIds, writeShortlistIds } from "@/lib/shortlist-local";
import { FaceliftPropertyCard } from "./FaceliftPropertyCard";

type SortKey = "trustScore" | "priceAsc" | "priceDesc";
type MinTrust = "any" | "7" | "8" | "9";

function minTrustThreshold(option: MinTrust): number {
  if (option === "any") return 0;
  if (option === "7") return 7;
  if (option === "8") return 8;
  return 9;
}

export function FaceliftSearchPage() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q") ?? "";

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<SortKey>("trustScore");
  const [minTrust, setMinTrust] = useState<MinTrust>("any");
  const [shortlisted, setShortlisted] = useState<Set<string>>(new Set());
  const [items, setItems] = useState<PropertyListItem[]>([]);
  const [state, setState] = useState<UiListState>("loading");

  const load = useCallback(async () => {
    setState("loading");
    try {
      const res: PropertySearchResponse = await searchProperties(q);
      setItems(res.items);
      setState(res.items.length > 0 ? "ready" : "empty");
    } catch {
      setState("error");
    }
  }, [q]);

  useEffect(() => {
    const t = setTimeout(() => {
      void load();
    }, 0);
    return () => clearTimeout(t);
  }, [load]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate shortlist from localStorage after mount (no storage on SSR)
    setShortlisted(new Set(readShortlistIds()));
  }, []);

  const handleHeartClick = (id: string) => {
    setShortlisted((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      writeShortlistIds([...next]);
      return next;
    });
  };

  const filteredSorted = useMemo(() => {
    const threshold = minTrustThreshold(minTrust);
    let list = items.filter((item) => {
      if (threshold <= 0) return true;
      return trustScoreDisplayFacelift(item.trustscore_display_0_5) >= threshold;
    });

    list = [...list].sort((a, b) => {
      if (sortBy === "trustScore") {
        return (
          b.trustscore_display_0_5 - a.trustscore_display_0_5 ||
          b.review_count - a.review_count
        );
      }
      // Price sort requires DB fields (Phase 5); keep stable order for now.
      return a.display_name.localeCompare(b.display_name);
    });

    return list;
  }, [items, minTrust, sortBy]);

  return (
    <div className="min-h-screen py-8">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex gap-8">
          <aside className="w-64 shrink-0">
            <div className="sticky top-24 rounded-[16px] border border-[#E2DDD6] bg-white p-6">
              <div className="mb-6 flex items-center gap-2">
                <SlidersHorizontal className="h-5 w-5 text-[#0F1F38]" />
                <h3 className="font-semibold text-[#0F1F38]">Filters</h3>
              </div>

              <div className="mb-6">
                <label className="mb-3 block text-sm font-semibold text-[#0F1F38]">
                  Minimum TrustScore
                </label>
                <select
                  value={minTrust}
                  onChange={(e) => setMinTrust(e.target.value as MinTrust)}
                  className="w-full rounded-lg border border-[#E2DDD6] px-3 py-2 text-sm text-[#0F1F38]"
                >
                  <option value="any">Any</option>
                  <option value="7">7.0+</option>
                  <option value="8">8.0+</option>
                  <option value="9">9.0+</option>
                </select>
              </div>

              <p className="text-xs text-[#717182]">
                Neighbourhood and rent filters need upcoming data (see Phase 5
                migrations).
              </p>
            </div>
          </aside>

          <div className="flex-1">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1
                  className="mb-2 text-3xl font-bold text-[#0F1F38]"
                  style={{
                    fontFamily: "var(--font-lora), ui-serif, Georgia, serif",
                  }}
                >
                  {q.trim() ? `Results for “${q.trim()}”` : "Browse properties"}
                </h1>
                <p className="text-[#717182]">
                  {state === "loading"
                    ? "Loading…"
                    : state === "ready"
                      ? `${filteredSorted.length} propert${filteredSorted.length === 1 ? "y" : "ies"} shown`
                      : ""}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortKey)}
                  className="rounded-lg border border-[#E2DDD6] px-4 py-2 text-sm text-[#0F1F38]"
                  title={
                    sortBy !== "trustScore"
                      ? "Price sorting needs rent fields in the database (Phase 5)."
                      : undefined
                  }
                >
                  <option value="trustScore">Highest TrustScore</option>
                  <option value="priceAsc">Price: Low to High (soon)</option>
                  <option value="priceDesc">Price: High to Low (soon)</option>
                </select>

                <div className="flex gap-2 rounded-lg border border-[#E2DDD6] p-1">
                  <button
                    type="button"
                    onClick={() => setViewMode("grid")}
                    className={`rounded p-2 transition-colors ${
                      viewMode === "grid"
                        ? "bg-[#E8913A] text-white"
                        : "text-[#717182] hover:text-[#0F1F38]"
                    }`}
                  >
                    <Grid className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("list")}
                    className={`rounded p-2 transition-colors ${
                      viewMode === "list"
                        ? "bg-[#E8913A] text-white"
                        : "text-[#717182] hover:text-[#0F1F38]"
                    }`}
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {state === "error" ? (
              <div className="rounded-[16px] border border-[#E2DDD6] bg-white p-8 text-center">
                <p className="text-[#0F1F38]">Something went wrong.</p>
                <button
                  type="button"
                  onClick={() => void load()}
                  className="mt-4 rounded-[12px] bg-[#E8913A] px-6 py-2 font-semibold text-white"
                >
                  Retry
                </button>
              </div>
            ) : state === "empty" ? (
              <div className="rounded-[16px] border border-[#E2DDD6] bg-white p-8">
                <p className="text-[#0F1F38]">No properties matched.</p>
                <Link
                  href="/"
                  className="mt-4 inline-block font-semibold text-[#E8913A]"
                >
                  Back home
                </Link>
              </div>
            ) : (
              <div
                className={
                  viewMode === "grid"
                    ? "grid grid-cols-1 gap-6 md:grid-cols-2"
                    : "space-y-4"
                }
              >
                {filteredSorted.map((property) => (
                  <FaceliftPropertyCard
                    key={property.id}
                    item={property}
                    variant={viewMode}
                    onHeartClick={handleHeartClick}
                    isShortlisted={shortlisted.has(property.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
