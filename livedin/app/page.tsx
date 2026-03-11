"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SearchBar } from "@/components/SearchBar";
import { PropertyCard } from "@/components/PropertyCard";
import { PublicSiteHeader } from "@/components/auth/PublicSiteHeader";
import { FeedbackPanel } from "@/components/ui/FeedbackPanel";
import { searchProperties } from "@/lib/property-search";
import type { PropertyListItem, PropertySearchResponse, UiListState } from "@/lib/types";
import { pageContainerClass, sectionCardClass, secondaryButtonClass } from "@/lib/ui";

function ResultsSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="h-32 animate-pulse rounded-3xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900"
          aria-hidden
        />
      ))}
    </div>
  );
}

function ResultsContent({
  state,
  items,
  query,
  onRetry,
  onClear,
}: {
  state: UiListState;
  items: PropertyListItem[];
  query: string;
  onRetry: () => void;
  onClear: () => void;
}) {
  if (state === "loading") {
    return <ResultsSkeleton />;
  }

  if (state === "error") {
    return (
      <FeedbackPanel
        tone="error"
        title="We could not load properties"
        description="The search request failed. Retry to refresh the list."
        primaryAction={{ label: "Retry", onClick: onRetry }}
      />
    );
  }

  if (state === "empty") {
    return (
      <FeedbackPanel
        title="No properties matched that search"
        description={
          <div className="space-y-2">
            <p>
              No results were found for <span className="font-medium">&quot;{query || "(all)"}&quot;</span>.
            </p>
            <p>Try a street name, building name, management company, or clear the search to browse everything.</p>
          </div>
        }
        primaryAction={{ label: "Clear search", onClick: onClear }}
      />
    );
  }

  return (
    <div className="space-y-4">
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

  const handleClearSearch = () => {
    setQuery("");
    runSearch("");
  };

  useEffect(() => {
    async function loadInitialResults() {
      try {
        const res = await searchProperties("");
        setData(res);
        setState(res.items.length > 0 ? "ready" : "empty");
      } catch {
        setState("error");
      }
    }

    void loadInitialResults();
  }, []);

  const handleSearchSubmit = (q: string) => {
    setQuery(q);
    runSearch(q);
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-foreground dark:bg-zinc-950">
      <PublicSiteHeader />
      <main className="py-8 sm:py-10">
        <div className={pageContainerClass}>
          <section className={`${sectionCardClass} overflow-hidden p-6 sm:p-8 lg:p-10`}>
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_300px] lg:items-end">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-400">
                  Verified renter reviews
                </p>
                <h1 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-4xl lg:text-5xl">
                  Rental insights that help you spot the right place before you sign.
                </h1>
                <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-600 dark:text-zinc-400">
                  Search by address or management company, compare trust signals, and leave your own verified renter review when you are ready.
                </p>
                <div className="mt-6 max-w-3xl">
                  <SearchBar
                    value={query}
                    onChange={setQuery}
                    onSubmit={handleSearchSubmit}
                    disabled={state === "loading"}
                  />
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link href="/submit-review/new" className="inline-flex items-center rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-300">
                    Start a review
                  </Link>
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className={secondaryButtonClass}
                  >
                    Clear search
                  </button>
                </div>
              </div>

              <aside className="rounded-3xl border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-900">
                <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">
                  What you can do here
                </h2>
                <div className="mt-4 space-y-4 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                  <p>Browse active properties and quickly see how many verified reviews support each trust score.</p>
                  <p>Open a property to read structured category ratings and approved distilled insights.</p>
                  <p>Submit your own review once you are signed in with a verified email address.</p>
                </div>
              </aside>
            </div>
          </section>

          <section className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div className={`${sectionCardClass} p-6 sm:p-8`}>
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
                    Browse properties
                  </h2>
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                    Search results update using your current query and always keep the next action visible.
                  </p>
                </div>
                {(state === "ready" || state === "empty") && data ? (
                  <p className="text-sm text-zinc-500 dark:text-zinc-400" aria-live="polite">
                    {data.total} result{data.total !== 1 ? "s" : ""} for &quot;{data.query || "(all)"}&quot;
                  </p>
                ) : null}
              </div>

              <div className="mt-6">
                <ResultsContent
                  state={state}
                  items={data?.items ?? []}
                  query={data?.query ?? query}
                  onRetry={handleRetry}
                  onClear={handleClearSearch}
                />
              </div>
            </div>

            <aside className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
              <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">
                Search tips
              </h2>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                <li>Try a street address, building name, or management company.</li>
                <li>Use `Clear search` if you want to broaden the results again.</li>
                <li>Open any property to see trust score context before leaving a review.</li>
              </ul>
            </aside>
          </section>
        </div>
      </main>
    </div>
  );
}
