"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SearchBar } from "@/components/SearchBar";
import { PropertyCard } from "@/components/PropertyCard";
import { searchProperties } from "@/lib/property-search";
import type { PropertyListItem, PropertySearchResponse, UiListState } from "@/lib/types";

function ResultsSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="h-24 animate-pulse rounded-lg border border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800"
          aria-hidden
        />
      ))}
    </div>
  );
}

function ResultsContent({
  state,
  items,
  total,
  query,
  onRetry,
}: {
  state: UiListState;
  items: PropertyListItem[];
  total: number;
  query: string;
  onRetry: () => void;
}) {
  if (state === "loading") {
    return <ResultsSkeleton />;
  }

  if (state === "error") {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/30">
        <p className="text-red-800 dark:text-red-200">Something went wrong. Please try again.</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90"
        >
          Retry
        </button>
      </div>
    );
  }

  if (state === "empty") {
    return (
      <p className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
        No results. {total} results for &quot;{query || "(all)"}&quot;.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <PropertyCard key={item.id} item={item} />
      ))}
    </div>
  );
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [state, setState] = useState<UiListState>("loading");
  const [data, setData] = useState<PropertySearchResponse | null>(null);
  const [lastQuery, setLastQuery] = useState("");

  const runSearch = async (q: string) => {
    setLastQuery(q);
    setState("loading");
    try {
      const res = await searchProperties(q);
      setData(res);
      setState(res.items.length > 0 ? "ready" : "empty");
    } catch {
      setState("error");
    }
  };

  const handleRetry = () => {
    runSearch(lastQuery);
  };

  useEffect(() => {
    runSearch("");
  }, []);

  const handleSearchSubmit = (q: string) => {
    setQuery(q);
    runSearch(q);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-zinc-200 bg-white px-4 py-6 dark:border-zinc-800 dark:bg-zinc-950 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Rental insights you can trust.
          </h1>
          <p className="mt-1 text-zinc-600 dark:text-zinc-400">
            Browse reviews from verified renters on properties and management companies.
          </p>
          <div className="mt-4">
            <SearchBar
              value={query}
              onChange={setQuery}
              onSubmit={handleSearchSubmit}
              disabled={state === "loading"}
            />
          </div>
          <div className="mt-3">
            <Link
              href="/submit-review/new"
              className="inline-block rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-foreground hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:hover:bg-zinc-800"
            >
              Leave a review
            </Link>
          </div>
        </div>
      </header>

      <main className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1fr_320px]">
          <section className="min-w-0">
            <h2 className="sr-only">Search results</h2>
            {(state === "ready" || state === "empty") && data && (
              <p className="mb-3 text-sm text-zinc-600 dark:text-zinc-400">
                {data.total} result{data.total !== 1 ? "s" : ""} for &quot;{data.query || "(all)"}&quot;
              </p>
            )}
            <ResultsContent
              state={state}
              items={data?.items ?? []}
              total={data?.total ?? 0}
              query={data?.query ?? query}
              onRetry={handleRetry}
            />
          </section>
          <aside
            className="flex min-h-[300px] items-center justify-center rounded-lg border border-zinc-200 bg-zinc-100 text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 lg:min-h-[500px]"
            aria-hidden
          >
            Map placeholder
          </aside>
        </div>
      </main>
    </div>
  );
}
