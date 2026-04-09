"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageHeader } from "@/components/PageHeader";
import { FeedbackPanel } from "@/components/ui/FeedbackPanel";
import { fetchPortfolioAnalytics, fetchPortfolioProperties } from "@/lib/portal-client";
import type { PortfolioPropertyItem } from "@/lib/types";
import { selectClass } from "@/lib/ui";

type Agg = {
  display_management_responsiveness_0_5: number;
  display_maintenance_timeliness_0_5: number;
  display_listing_accuracy_0_5: number;
  display_fee_transparency_0_5: number;
  display_lease_clarity_0_5: number;
  review_count: number;
};

function PerformanceInner() {
  const searchParams = useSearchParams();
  const initialProperty = searchParams.get("property") ?? "";

  const [properties, setProperties] = useState<PortfolioPropertyItem[]>([]);
  const [propertyId, setPropertyId] = useState(initialProperty);
  const [agg, setAgg] = useState<Agg | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const p = await fetchPortfolioProperties();
        setProperties(p.properties);
        const first = initialProperty || p.properties[0]?.id || "";
        setPropertyId(first);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load");
      }
    })();
  }, [initialProperty]);

  useEffect(() => {
    if (!propertyId) {
      setLoading(false);
      setAgg(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetchPortfolioAnalytics(propertyId);
        const a = res.aggregates as Agg | null;
        if (!cancelled) setAgg(a);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load analytics");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [propertyId]);

  const chartData = useMemo(() => {
    if (!agg) return [];
    return [
      { name: "Mgmt", full: "Management responsiveness", v: agg.display_management_responsiveness_0_5 },
      { name: "Maint.", full: "Maintenance timeliness", v: agg.display_maintenance_timeliness_0_5 },
      { name: "Listing", full: "Listing accuracy", v: agg.display_listing_accuracy_0_5 },
      { name: "Fees", full: "Fee transparency", v: agg.display_fee_transparency_0_5 },
      { name: "Lease", full: "Lease clarity", v: agg.display_lease_clarity_0_5 },
    ];
  }, [agg]);

  if (error && properties.length === 0) {
    return <FeedbackPanel tone="error" title="Error" description={error} />;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Category performance"
        subtitle="Public display scores (0–5) for the selected portfolio property."
      />

      <div className="max-w-xs">
        <label className="text-xs font-medium" style={{ color: "var(--theme-muted)" }} htmlFor="perf-prop">
          Property
        </label>
        <select
          id="perf-prop"
          className={`${selectClass} mt-1 w-full`}
          value={propertyId}
          onChange={(e) => setPropertyId(e.target.value)}
        >
          {properties.map((p) => (
            <option key={p.id} value={p.id}>
              {p.display_name}
            </option>
          ))}
        </select>
      </div>

      {loading ? <p className="text-sm" style={{ color: "var(--theme-muted)" }}>Loading…</p> : null}
      {error && properties.length > 0 ? (
        <FeedbackPanel tone="error" title="Could not load analytics" description={error} />
      ) : null}

      {!loading && agg && chartData.length > 0 ? (
        <div className="h-[400px] w-full rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
              <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fill: "var(--chart-axis-text)", fontSize: 12 }} />
              <YAxis domain={[0, 5]} tick={{ fill: "var(--chart-axis-text)", fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  background: "var(--chart-tooltip-bg)",
                  border: "1px solid var(--theme-border)",
                }}
              />
              <Bar dataKey="v" fill="var(--chart-2)" radius={[6, 6, 0, 0]} name="Score" />
            </BarChart>
          </ResponsiveContainer>
          <p className="mt-2 text-xs" style={{ color: "var(--theme-muted)" }}>
            Based on {agg.review_count} approved {agg.review_count === 1 ? "review" : "reviews"} in public aggregates.
          </p>
        </div>
      ) : null}

      {!loading && !agg && propertyId ? (
        <p className="text-sm" style={{ color: "var(--theme-muted)" }}>
          No aggregate data for this property yet.
        </p>
      ) : null}
    </div>
  );
}

export default function PortalPerformancePage() {
  return (
    <Suspense fallback={<p className="text-sm text-zinc-500">Loading…</p>}>
      <PerformanceInner />
    </Suspense>
  );
}
