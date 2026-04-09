"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { SearchBar } from "@/components/SearchBar";
import { PropertyCard } from "@/components/PropertyCard";
import { PublicSiteHeader } from "@/components/auth/PublicSiteHeader";
import { FeedbackPanel } from "@/components/ui/FeedbackPanel";
import { fetchShortlist } from "@/lib/portal-client";
import { searchProperties } from "@/lib/property-search";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import type { NeighbourhoodListItem, PropertyListItem, PropertySearchResponse, UiListState } from "@/lib/types";
import {
  pageContainerClass,
  sectionCardClass,
  secondaryButtonClass,
  selectClass,
  primaryButtonClass,
} from "@/lib/ui";

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
  shortlistIds,
  onRetry,
  onClear,
}: {
  state: UiListState;
  items: PropertyListItem[];
  query: string;
  shortlistIds: Set<string>;
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
        <PropertyCard
          key={item.id}
          item={item}
          initialShortlisted={shortlistIds.has(item.id)}
        />
      ))}
    </div>
  );
}

function HomeInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<string>("reviews");
  const [minScore, setMinScore] = useState<string>("");
  const [neighbourhoodId, setNeighbourhoodId] = useState<string>("");

  const [state, setState] = useState<UiListState>("loading");
  const [data, setData] = useState<PropertySearchResponse | null>(null);
  const [lastQuery, setLastQuery] = useState("");
  const [neighbourhoods, setNeighbourhoods] = useState<NeighbourhoodListItem[]>([]);
  const [shortlistIds, setShortlistIds] = useState<Set<string>>(() => new Set());
  const [filtersOpen, setFiltersOpen] = useState(false);

  const pushUrl = useCallback(
    (next: {
      q: string;
      sort: string;
      minScore: string;
      neighbourhood: string;
    }) => {
      const p = new URLSearchParams();
      if (next.q.trim()) p.set("q", next.q.trim());
      if (next.sort && next.sort !== "reviews") p.set("sort", next.sort);
      if (next.minScore !== "") p.set("minScore", next.minScore);
      if (next.neighbourhood) p.set("neighbourhood", next.neighbourhood);
      const qs = p.toString();
      router.replace(qs ? `/?${qs}` : "/", { scroll: false });
    },
    [router],
  );

  const runSearch = useCallback(
    async (
      q: string,
      opts: {
        sort: "trust" | "reviews" | "recent";
        minScore: number | null;
        neighbourhoodId: string | null;
      },
    ) => {
      setLastQuery(q);
      setState("loading");
      try {
        const res = await searchProperties(q, {
          sort: opts.sort,
          minScore: opts.minScore,
          neighbourhoodId: opts.neighbourhoodId,
        });
        setData(res);
        setState(res.items.length > 0 ? "ready" : "empty");
      } catch {
        setState("error");
      }
    },
    [],
  );

  useEffect(() => {
    void fetch("/api/neighbourhoods")
      .then((r) => r.json())
      .then((body: { items?: NeighbourhoodListItem[] }) => {
        setNeighbourhoods(body.items ?? []);
      })
      .catch(() => setNeighbourhoods([]));
  }, []);

  const refreshShortlist = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setShortlistIds(new Set());
      return;
    }
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.access_token) {
      setShortlistIds(new Set());
      return;
    }
    try {
      const { items } = await fetchShortlist();
      setShortlistIds(new Set(items.map((i) => i.property_id)));
    } catch {
      setShortlistIds(new Set());
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => void refreshShortlist());
  }, [refreshShortlist]);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => void refreshShortlist());
    return () => subscription.unsubscribe();
  }, [refreshShortlist]);

  const paramsKey = searchParams.toString();

  useEffect(() => {
    const q = searchParams.get("q") ?? "";
    const sRaw = searchParams.get("sort") ?? "reviews";
    const s = ["trust", "reviews", "recent"].includes(sRaw) ? sRaw : "reviews";
    const mRaw = searchParams.get("minScore");
    const n = searchParams.get("neighbourhood") ?? "";

    const minParsed =
      mRaw !== null && mRaw !== ""
        ? Math.min(5, Math.max(0, Number.parseInt(mRaw, 10)))
        : null;
    const minOpt =
      minParsed !== null && !Number.isNaN(minParsed) ? minParsed : null;

    queueMicrotask(() => {
      setQuery(q);
      setSort(s);
      setMinScore(mRaw ?? "");
      setNeighbourhoodId(n);
      void runSearch(q, {
        sort: s as "trust" | "reviews" | "recent",
        minScore: minOpt,
        neighbourhoodId: n || null,
      });
    });
  }, [paramsKey, runSearch, searchParams]);

  const filterOpts = useCallback(() => {
    const s = ["trust", "reviews", "recent"].includes(sort) ? sort : "reviews";
    const minParsed =
      minScore === "" ? null : Math.min(5, Math.max(0, Number.parseInt(minScore, 10)));
    const minOpt =
      minParsed !== null && !Number.isNaN(minParsed) ? minParsed : null;
    return {
      sort: s as "trust" | "reviews" | "recent",
      minScore: minOpt,
      neighbourhoodId: neighbourhoodId || null,
    };
  }, [minScore, neighbourhoodId, sort]);

  const handleRetry = () => {
    void runSearch(lastQuery, filterOpts());
  };

  const handleClearSearch = () => {
    pushUrl({ q: "", sort, minScore, neighbourhood: neighbourhoodId });
  };

  const handleSearchSubmit = (q: string) => {
    setQuery(q);
    pushUrl({ q, sort, minScore, neighbourhood: neighbourhoodId });
  };

  const applyFilters = () => {
    pushUrl({ q: query, sort, minScore, neighbourhood: neighbourhoodId });
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
                <h1 className="mt-3 max-w-3xl font-[family-name:var(--font-playfair)] text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-4xl lg:text-5xl">
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
                  <Link
                    href="/write-review/new"
                    className={`${primaryButtonClass} inline-flex`}
                  >
                    Start a review
                  </Link>
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className={secondaryButtonClass}
                  >
                    Clear search
                  </button>
                  <button
                    type="button"
                    className={`${secondaryButtonClass} lg:hidden`}
                    aria-expanded={filtersOpen}
                    onClick={() => setFiltersOpen((o) => !o)}
                  >
                    {filtersOpen ? "Hide filters" : "Filters & sort"}
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
                  <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
                    Browse properties
                  </h2>
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                    Use filters to narrow by neighbourhood, minimum trust score, and sort order. State stays in the URL.
                  </p>
                </div>
                {(state === "ready" || state === "empty") && data ? (
                  <p className="text-sm text-zinc-500 dark:text-zinc-400" aria-live="polite">
                    {data.total} result{data.total !== 1 ? "s" : ""} for &quot;{data.query || "(all)"}&quot;
                  </p>
                ) : null}
              </div>

              <aside
                className={`mt-6 space-y-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900 lg:hidden ${filtersOpen ? "block" : "hidden"}`}
              >
                <FilterFields
                  neighbourhoods={neighbourhoods}
                  sort={sort}
                  minScore={minScore}
                  neighbourhoodId={neighbourhoodId}
                  onSort={setSort}
                  onMinScore={setMinScore}
                  onNeighbourhood={setNeighbourhoodId}
                  onApply={applyFilters}
                />
              </aside>

              <div className="mt-6">
                <ResultsContent
                  state={state}
                  items={data?.items ?? []}
                  query={data?.query ?? query}
                  shortlistIds={shortlistIds}
                  onRetry={handleRetry}
                  onClear={handleClearSearch}
                />
              </div>
            </div>

            <aside className="hidden space-y-4 lg:block">
              <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">
                  Filters &amp; sort
                </h2>
                <FilterFields
                  neighbourhoods={neighbourhoods}
                  sort={sort}
                  minScore={minScore}
                  neighbourhoodId={neighbourhoodId}
                  onSort={setSort}
                  onMinScore={setMinScore}
                  onNeighbourhood={setNeighbourhoodId}
                  onApply={applyFilters}
                />
              </div>
              <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">
                  Search tips
                </h2>
                <ul className="mt-4 space-y-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                  <li>Try a street address, building name, or management company.</li>
                  <li>Use `Clear search` if you want to broaden the results again.</li>
                  <li>Open any property to see trust score context before leaving a review.</li>
                </ul>
              </div>
            </aside>
          </section>
        </div>
      </main>
    </div>
  );
}

function FilterFields({
  neighbourhoods,
  sort,
  minScore,
  neighbourhoodId,
  onSort,
  onMinScore,
  onNeighbourhood,
  onApply,
}: {
  neighbourhoods: NeighbourhoodListItem[];
  sort: string;
  minScore: string;
  neighbourhoodId: string;
  onSort: (v: string) => void;
  onMinScore: (v: string) => void;
  onNeighbourhood: (v: string) => void;
  onApply: () => void;
}) {
  return (
    <div className="mt-4 space-y-4">
      <div>
        <label htmlFor="filter-neighbourhood" className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
          Neighbourhood
        </label>
        <select
          id="filter-neighbourhood"
          className={`${selectClass} mt-1 w-full`}
          value={neighbourhoodId}
          onChange={(e) => onNeighbourhood(e.target.value)}
        >
          <option value="">All areas</option>
          {neighbourhoods.map((n) => (
            <option key={n.id} value={n.id}>
              {n.name} — {n.city}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="filter-min-score" className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
          Minimum trust score (0–5)
        </label>
        <select
          id="filter-min-score"
          className={`${selectClass} mt-1 w-full`}
          value={minScore}
          onChange={(e) => onMinScore(e.target.value)}
        >
          <option value="">Any</option>
          {[1, 2, 3, 4, 5].map((n) => (
            <option key={n} value={String(n)}>
              {n}+
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="filter-sort" className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
          Sort by
        </label>
        <select
          id="filter-sort"
          className={`${selectClass} mt-1 w-full`}
          value={sort}
          onChange={(e) => onSort(e.target.value)}
        >
          <option value="reviews">Most reviewed</option>
          <option value="trust">Highest trust</option>
          <option value="recent">Recently added</option>
        </select>
      </div>
      <button type="button" className={primaryButtonClass} onClick={onApply}>
        Apply filters
      </button>
    </div>
  );
}

export function HomePageContent() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-zinc-50 px-4 py-16 text-center text-zinc-500 dark:bg-zinc-950">
          Loading…
        </div>
      }
    >
      <HomeInner />
    </Suspense>
  );
}
