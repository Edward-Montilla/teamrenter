"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import { TrustScoreBadge } from "@/components/TrustScoreBadge";
import { PageHeader } from "@/components/PageHeader";
import { FeedbackPanel } from "@/components/ui/FeedbackPanel";
import { fetchPortfolioProperties } from "@/lib/portal-client";
import type { PortfolioPropertyItem } from "@/lib/types";
import { sectionCardClass, primaryButtonClass } from "@/lib/ui";

function TrendIcon({ trend }: { trend: PortfolioPropertyItem["trend"] }) {
  if (trend === "improving") return <TrendingUp className="h-4 w-4 text-[var(--theme-success)]" aria-hidden />;
  if (trend === "declining") return <TrendingDown className="h-4 w-4 text-[var(--theme-warning)]" aria-hidden />;
  return <Minus className="h-4 w-4 text-[var(--theme-muted)]" aria-hidden />;
}

export default function PortalDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [properties, setProperties] = useState<PortfolioPropertyItem[]>([]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetchPortfolioProperties();
        if (!cancelled) setProperties(res.properties);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load portfolio");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const stats = useMemo(() => {
    const n = properties.length;
    const totalReviews = properties.reduce((s, p) => s + p.review_count, 0);
    const avgTrust =
      n === 0
        ? 0
        : properties.reduce((s, p) => s + p.trustscore_display_0_5, 0) / n;
    const attention = properties.filter(
      (p) => p.trustscore_display_0_5 < 3 || p.review_count < 2,
    ).length;
    return { n, totalReviews, avgTrust, attention };
  }, [properties]);

  if (loading) {
    return <p className="text-sm" style={{ color: "var(--theme-muted)" }}>Loading portfolio…</p>;
  }

  if (error) {
    return (
      <FeedbackPanel
        tone="error"
        title="Could not load portal"
        description={error}
      />
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Portfolio overview"
        subtitle="Trust scores, review volume, and quick links to per-property analytics."
      />

      {properties.length === 0 ? (
        <FeedbackPanel
          title="No portfolio properties yet"
          description="Link properties to your landlord account to see them here."
        />
      ) : null}

      {properties.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className={sectionCardClass} style={{ padding: "1.25rem" }}>
            <p className="text-xs uppercase tracking-wider" style={{ color: "var(--theme-muted)" }}>
              Properties
            </p>
            <p className="mt-2 text-3xl font-semibold">{stats.n}</p>
          </div>
          <div className={sectionCardClass} style={{ padding: "1.25rem" }}>
            <p className="text-xs uppercase tracking-wider" style={{ color: "var(--theme-muted)" }}>
              Avg trust
            </p>
            <p className="mt-2 text-3xl font-semibold">{stats.avgTrust.toFixed(1)}</p>
          </div>
          <div className={sectionCardClass} style={{ padding: "1.25rem" }}>
            <p className="text-xs uppercase tracking-wider" style={{ color: "var(--theme-muted)" }}>
              Total reviews
            </p>
            <p className="mt-2 text-3xl font-semibold">{stats.totalReviews}</p>
          </div>
          <div className={sectionCardClass} style={{ padding: "1.25rem" }}>
            <p className="text-xs uppercase tracking-wider" style={{ color: "var(--theme-muted)" }}>
              Needs attention
            </p>
            <p className="mt-2 text-3xl font-semibold">{stats.attention}</p>
            <p className="mt-1 text-xs" style={{ color: "var(--theme-muted)" }}>
              Low trust or few reviews
            </p>
          </div>
        </div>
      ) : null}

      <div className="grid gap-4">
        {properties.map((p) => (
          <Link
            key={p.id}
            href={`/portal/performance?property=${p.id}`}
            className={`${sectionCardClass} flex flex-col gap-4 p-5 transition hover:shadow-md sm:flex-row sm:items-center sm:justify-between`}
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold text-foreground">{p.display_name}</h2>
                <span className="inline-flex items-center gap-1 text-xs font-medium" style={{ color: "var(--theme-muted)" }}>
                  <TrendIcon trend={p.trend} />
                  {p.trend}
                </span>
              </div>
              <p className="mt-1 text-sm" style={{ color: "var(--theme-muted)" }}>
                {[p.address_line1, p.city, p.province].filter(Boolean).join(", ")}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <TrustScoreBadge
                score={p.trustscore_display_0_5}
                reviewCount={p.review_count}
                size="sm"
              />
              <span className={`${primaryButtonClass} pointer-events-none text-xs`}>
                View analytics
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
