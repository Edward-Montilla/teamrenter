"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageHeader } from "@/components/PageHeader";
import { FeedbackPanel } from "@/components/ui/FeedbackPanel";
import { fetchBenchmarks } from "@/lib/portal-client";
import type { BenchmarkData } from "@/lib/types";

const METRIC_LABELS: Array<{ key: keyof BenchmarkData; short: string }> = [
  { key: "avg_management_responsiveness", short: "Mgmt" },
  { key: "avg_maintenance_timeliness", short: "Maint" },
  { key: "avg_listing_accuracy", short: "Listing" },
  { key: "avg_fee_transparency", short: "Fees" },
  { key: "avg_lease_clarity", short: "Lease" },
];

function rowToChartRows(item: BenchmarkData) {
  return METRIC_LABELS.map(({ key, short }) => ({
    name: short,
    value: item[key] != null ? Number(item[key]) : 0,
    scope: `${item.scope_type}: ${item.scope_value}`,
  }));
}

export default function PortalBenchmarksPage() {
  const [items, setItems] = useState<BenchmarkData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const res = await fetchBenchmarks();
        setItems(res.items);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load benchmarks");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const mergedChart = useMemo(() => {
    if (items.length === 0) return [];
    const names = METRIC_LABELS.map((m) => m.short);
    return names.map((short, i) => {
      const row: Record<string, string | number> = { name: short };
      items.forEach((it, idx) => {
        const key = METRIC_LABELS[i]?.key;
        const v = key ? it[key] : null;
        row[`s${idx}`] = v != null ? Number(v) : 0;
      });
      return row;
    });
  }, [items]);

  if (loading) {
    return <p className="text-sm" style={{ color: "var(--theme-muted)" }}>Loading benchmarks…</p>;
  }

  if (error) {
    return <FeedbackPanel tone="error" title="Error" description={error} />;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Benchmarks"
        subtitle="City and neighbourhood averages compared across the five structured categories."
      />

      {items.length === 0 ? (
        <FeedbackPanel
          title="No benchmarks yet"
          description="Benchmarks appear when portfolio cities match seeded scope values."
        />
      ) : null}

      {items.length > 0 ? (
        <div className="h-[420px] w-full rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={mergedChart} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
              <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fill: "var(--chart-axis-text)", fontSize: 11 }} />
              <YAxis domain={[0, 5]} tick={{ fill: "var(--chart-axis-text)", fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  background: "var(--chart-tooltip-bg)",
                  border: "1px solid var(--theme-border)",
                }}
              />
              <Legend />
              {items.map((it, idx) => (
                <Bar
                  key={it.scope_value + it.scope_type}
                  dataKey={`s${idx}`}
                  name={`${it.scope_type}: ${it.scope_value}`}
                  fill={idx === 0 ? "var(--chart-2)" : "var(--chart-3)"}
                  radius={[4, 4, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : null}

      <ul className="space-y-6">
        {items.map((item) => (
          <li
            key={`${item.scope_type}-${item.scope_value}`}
            className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800"
          >
            <h2 className="font-semibold text-foreground">
              {item.scope_type === "city" ? "City" : "Neighbourhood"}: {item.scope_value}
            </h2>
            <p className="text-xs" style={{ color: "var(--theme-muted)" }}>
              {item.property_count} properties · {item.review_count} reviews · updated{" "}
              {new Date(item.computed_at).toLocaleString()}
            </p>
            <div className="mt-4 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rowToChartRows(item)}>
                  <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fill: "var(--chart-axis-text)", fontSize: 11 }} />
                  <YAxis domain={[0, 5]} hide />
                  <Tooltip
                    contentStyle={{
                      background: "var(--chart-tooltip-bg)",
                      border: "1px solid var(--theme-border)",
                    }}
                  />
                  <Bar dataKey="value" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
