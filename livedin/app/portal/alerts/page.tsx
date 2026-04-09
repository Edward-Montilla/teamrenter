"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { FeedbackPanel } from "@/components/ui/FeedbackPanel";
import { fetchPortfolioProperties } from "@/lib/portal-client";
import type { PortfolioPropertyItem } from "@/lib/types";
import { primaryButtonClass, secondaryButtonClass } from "@/lib/ui";

export default function PortalAlertsPage() {
  const [properties, setProperties] = useState<PortfolioPropertyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchPortfolioProperties();
      setProperties(res.properties);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const gaps = useMemo(
    () => properties.filter((p) => p.review_count < 3),
    [properties],
  );

  const copyInvite = async (propertyId: string) => {
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}/submit-review/${propertyId}`
        : "";
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(propertyId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      /* ignore */
    }
  };

  if (loading) {
    return <p className="text-sm" style={{ color: "var(--theme-muted)" }}>Loading…</p>;
  }

  if (error) {
    return <FeedbackPanel tone="error" title="Error" description={error} />;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Review gap alerts"
        subtitle="Properties with fewer than three reviews may need tenant outreach. Share invite links to collect verified feedback."
      />

      <p className="text-sm" style={{ color: "var(--theme-muted)" }}>
        Stale-review detection uses review count as a proxy; full date-based staleness can be layered on when
        last-review timestamps are exposed to the portal API.
      </p>

      {gaps.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--theme-muted)" }}>
          No properties are flagged for low review volume.
        </p>
      ) : (
        <ul className="space-y-4">
          {gaps.map((p) => {
            const url =
              typeof window !== "undefined"
                ? `${window.location.origin}/submit-review/${p.id}`
                : "";
            return (
              <li
                key={p.id}
                className="flex flex-col gap-3 rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-semibold text-foreground">{p.display_name}</p>
                  <p className="text-sm" style={{ color: "var(--theme-muted)" }}>
                    {p.review_count} {p.review_count === 1 ? "review" : "reviews"} · trust {p.trustscore_display_0_5}/5
                  </p>
                  <p className="mt-2 break-all text-xs font-mono text-zinc-500 dark:text-zinc-400">{url}</p>
                </div>
                <button
                  type="button"
                  className={primaryButtonClass}
                  onClick={() => void copyInvite(p.id)}
                >
                  {copiedId === p.id ? "Copied" : "Copy invite link"}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <div className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="font-semibold text-foreground">All portfolio invite links</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {properties.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-foreground">{p.display_name}</span>
              <button
                type="button"
                className={secondaryButtonClass}
                onClick={() => void copyInvite(p.id)}
              >
                Copy
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
