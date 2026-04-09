"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { PublicSiteHeader } from "@/components/auth/PublicSiteHeader";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { ComparisonTable } from "@/components/ComparisonTable";
import { PageHeader } from "@/components/PageHeader";
import { FeedbackPanel } from "@/components/ui/FeedbackPanel";
import type { ComparisonPropertyItem, UiListState } from "@/lib/types";
import { pageContainerClass, sectionCardClass, secondaryButtonClass } from "@/lib/ui";

function parseIds(raw: string | null): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 3);
}

function ComparisonContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const ids = useMemo(
    () => parseIds(searchParams.get("ids")),
    [searchParams],
  );

  const [state, setState] = useState<UiListState>("loading");
  const [items, setItems] = useState<ComparisonPropertyItem[]>([]);

  const load = useCallback(async (propertyIds: string[]) => {
    if (propertyIds.length === 0) {
      setItems([]);
      setState("empty");
      return;
    }

    setState("loading");
    try {
      const results = await Promise.all(
        propertyIds.map(async (id) => {
          const res = await fetch(`/api/properties/${id}`);
          if (!res.ok) return null;
          const data = (await res.json()) as ComparisonPropertyItem;
          return {
            ...data,
            neighbourhood: data.neighbourhood ?? null,
          };
        }),
      );
      const ok = results.filter(Boolean) as ComparisonPropertyItem[];
      setItems(ok);
      setState(ok.length > 0 ? "ready" : "empty");
    } catch {
      setState("error");
    }
  }, []);

  useEffect(() => {
    void load(ids);
  }, [ids, load]);

  const handleRemove = (propertyId: string) => {
    const next = ids.filter((id) => id !== propertyId);
    const q = new URLSearchParams(searchParams.toString());
    if (next.length) {
      q.set("ids", next.join(","));
    } else {
      q.delete("ids");
    }
    router.replace(`/comparison?${q.toString()}`);
  };

  const showLoading = state === "loading" && ids.length > 0;

  return (
    <div className="min-h-screen bg-zinc-50 text-foreground dark:bg-zinc-950">
      <PublicSiteHeader />
      <main className={`${pageContainerClass} py-8 sm:py-10`}>
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Comparison" },
          ]}
        />

        <div className="mt-6 space-y-6">
          <PageHeader
            title="Compare properties"
            subtitle="Side-by-side trust scores and the five structured rating categories. Up to three properties."
          />

          <div className="flex flex-wrap gap-3">
            <Link href="/" className={secondaryButtonClass}>
              Back to browse
            </Link>
          </div>

          {state === "error" ? (
            <FeedbackPanel
              tone="error"
              title="Could not load comparison"
              description="One or more properties failed to load."
              primaryAction={{ label: "Retry", onClick: () => void load(ids) }}
            />
          ) : null}

          {showLoading ? (
            <div className={`${sectionCardClass} p-10 text-center text-zinc-500 dark:text-zinc-400`}>
              Loading property details…
            </div>
          ) : (
            <div className={`${sectionCardClass} p-4 sm:p-6`}>
              <ComparisonTable properties={items} onRemove={handleRemove} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function ComparisonPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-zinc-50 px-4 py-16 text-center text-zinc-500 dark:bg-zinc-950 dark:text-zinc-400">
          Loading…
        </div>
      }
    >
      <ComparisonContent />
    </Suspense>
  );
}
