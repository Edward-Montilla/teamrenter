"use client";

import { MapPin, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { PropertyListItem, PropertySearchResponse, UiListState } from "@/lib/types";
import { searchProperties } from "@/lib/property-search";
import { FaceliftPropertyCard } from "./FaceliftPropertyCard";

/**
 * Shortlist is client-only for v1; refresh clears selection (see Phase 5 persistence in implementation prompt).
 */
export function FaceliftHomePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [shortlisted, setShortlisted] = useState<Set<string>>(new Set());
  const [items, setItems] = useState<PropertyListItem[]>([]);
  const [state, setState] = useState<UiListState>("loading");

  const load = useCallback(async () => {
    setState("loading");
    try {
      const res: PropertySearchResponse = await searchProperties("");
      setItems(res.items);
      setState(res.items.length > 0 ? "ready" : "empty");
    } catch {
      setState("error");
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      void load();
    }, 0);
    return () => clearTimeout(t);
  }, [load]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
  };

  const handleHeartClick = (id: string) => {
    setShortlisted((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const featured =
    state === "ready" ? items.slice(0, 6) : ([] as PropertyListItem[]);

  return (
    <div className="min-h-screen">
      <section className="bg-[#0F1F38] py-20 text-white">
        <div className="mx-auto max-w-7xl px-6">
          <div className="max-w-3xl">
            <h1
              className="mb-4 text-5xl font-bold"
              style={{
                fontFamily: "var(--font-lora), ui-serif, Georgia, serif",
              }}
            >
              Find Your Next Home with Confidence
            </h1>
            <p className="mb-8 text-xl text-gray-300">
              Honest reviews from real renters. Make informed decisions about
              where you live.
            </p>

            <form
              onSubmit={handleSearch}
              className="flex gap-2 rounded-[16px] bg-white p-2"
            >
              <div className="flex flex-1 items-center gap-3 px-4">
                <MapPin className="h-5 w-5 shrink-0 text-[#717182]" />
                <input
                  type="text"
                  placeholder="Search by address, neighbourhood, or city..."
                  className="flex-1 text-[#0F1F38] outline-none"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button
                type="submit"
                className="flex items-center gap-2 rounded-[12px] bg-[#E8913A] px-8 py-3 font-semibold text-white transition-colors hover:bg-[#d17f2f]"
              >
                <Search className="h-5 w-5" />
                Search
              </button>
            </form>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2
                className="mb-2 text-3xl font-bold text-[#0F1F38]"
                style={{
                  fontFamily: "var(--font-lora), ui-serif, Georgia, serif",
                }}
              >
                Featured properties
              </h2>
              <p className="text-[#717182]">
                {state === "error"
                  ? "We could not load listings. Try again shortly."
                  : state === "empty"
                    ? "No active properties yet."
                    : "Verified rentals from our directory"}
              </p>
            </div>
            <Link
              href="/search"
              className="font-semibold text-[#E8913A] transition-colors hover:text-[#d17f2f]"
            >
              View all →
            </Link>
          </div>

          {state === "loading" ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-80 animate-pulse rounded-[16px] bg-[#E2DDD6]/60"
                />
              ))}
            </div>
          ) : state === "error" ? (
            <button
              type="button"
              onClick={() => void load()}
              className="rounded-[12px] bg-[#E8913A] px-6 py-3 font-semibold text-white"
            >
              Retry
            </button>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {featured.map((property) => (
                <FaceliftPropertyCard
                  key={property.id}
                  item={property}
                  onHeartClick={handleHeartClick}
                  isShortlisted={shortlisted.has(property.id)}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="bg-[#0F1F38] py-16 text-white">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <h2
            className="mb-4 text-3xl font-bold"
            style={{
              fontFamily: "var(--font-lora), ui-serif, Georgia, serif",
            }}
          >
            Have you rented before?
          </h2>
          <p className="mb-8 text-xl text-gray-300">
            Share your experience and help others make better decisions
          </p>
          <Link
            href="/write-review/new"
            className="inline-block rounded-[16px] bg-[#E8913A] px-8 py-4 text-lg font-semibold text-white transition-colors hover:bg-[#d17f2f]"
          >
            Write a Review
          </Link>
        </div>
      </section>
    </div>
  );
}
