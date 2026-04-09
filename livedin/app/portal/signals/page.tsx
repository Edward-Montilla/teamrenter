"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { FeedbackPanel } from "@/components/ui/FeedbackPanel";
import { fetchSignals } from "@/lib/portal-client";
import type { RenterSignal } from "@/lib/types";

function toneClass(signalType: string): string {
  if (signalType.includes("fee") || signalType.includes("lease")) {
    return "border-[color-mix(in_srgb,var(--theme-warning)_45%,var(--theme-border))] bg-[color-mix(in_srgb,var(--theme-warning)_10%,var(--theme-surface))]";
  }
  if (signalType.includes("management") || signalType.includes("maintenance")) {
    return "border-[color-mix(in_srgb,var(--theme-error)_40%,var(--theme-border))] bg-[color-mix(in_srgb,var(--theme-error)_8%,var(--theme-surface))]";
  }
  return "border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/40";
}

export default function PortalSignalsPage() {
  const [signals, setSignals] = useState<RenterSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const res = await fetchSignals();
        setSignals(res.signals);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load signals");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return <p className="text-sm" style={{ color: "var(--theme-muted)" }}>Loading signals…</p>;
  }

  if (error) {
    return <FeedbackPanel tone="error" title="Error" description={error} />;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Renter sentiment signals"
        subtitle="Heuristic flags when category averages fall below expectations."
      />

      {signals.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--theme-muted)" }}>
          No negative signals detected for your portfolio right now.
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {signals.map((s, i) => (
            <li
              key={`${s.property_id}-${s.signal_type}-${i}`}
              className={`rounded-2xl border p-4 ${toneClass(s.signal_type)}`}
            >
              <p className="font-semibold text-foreground">{s.display_name}</p>
              <p className="mt-1 text-sm text-foreground">{s.signal_label}</p>
              <p className="mt-2 text-xs" style={{ color: "var(--theme-muted)" }}>
                Type: {s.signal_type}
                {s.confidence != null ? ` · confidence ${(s.confidence * 100).toFixed(0)}%` : ""}
              </p>
              <p className="mt-1 text-xs" style={{ color: "var(--theme-muted)" }}>
                {new Date(s.detected_at).toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
