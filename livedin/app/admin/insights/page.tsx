"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AdminAuditFeed } from "@/components/admin/AdminAuditFeed";
import { FeedbackPanel } from "@/components/ui/FeedbackPanel";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import type {
  AdminInsightModerationItem,
  DistilledInsightStatus,
} from "@/lib/types";
import {
  destructiveButtonClass,
  primaryButtonClass,
  secondaryButtonClass,
  sectionCardClass,
  selectClass,
} from "@/lib/ui";

const INSIGHT_STATUS_OPTIONS: Array<"all" | DistilledInsightStatus> = [
  "all",
  "pending",
  "approved",
  "rejected",
  "hidden",
];

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString();
}

function statusBadgeClass(status: DistilledInsightStatus): string {
  switch (status) {
    case "approved":
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
    case "pending":
      return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300";
    case "rejected":
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
    case "hidden":
      return "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300";
  }
}

async function getAccessToken(): Promise<string> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    throw new Error("Supabase auth is not configured.");
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error("Not signed in.");
  }

  return session.access_token;
}

export default function AdminInsightsPage() {
  const [filter, setFilter] = useState<"all" | DistilledInsightStatus>("pending");
  const [items, setItems] = useState<AdminInsightModerationItem[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRecomputing, setIsRecomputing] = useState(false);
  const [actionStatus, setActionStatus] = useState<DistilledInsightStatus | null>(
    null,
  );
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const token = await getAccessToken();
        const params = new URLSearchParams();
        if (filter !== "all") {
          params.set("status", filter);
        }

        const res = await fetch(`/api/admin/insights?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          throw new Error("Failed to load insights.");
        }

        const data = (await res.json()) as { items?: AdminInsightModerationItem[] };
        if (!active) return;

        const nextItems = data.items ?? [];
        setItems(nextItems);
        setSelectedPropertyId((current) => {
          if (current && nextItems.some((item) => item.property_id === current)) {
            return current;
          }
          return nextItems[0]?.property_id ?? null;
        });
      } catch (err) {
        if (!active) return;
        setItems([]);
        setSelectedPropertyId(null);
        setError(err instanceof Error ? err.message : "Failed to load insights.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [filter, refreshKey]);

  const selectedInsight = useMemo(
    () => items.find((item) => item.property_id === selectedPropertyId) ?? null,
    [items, selectedPropertyId],
  );

  const updateStatus = async (status: DistilledInsightStatus) => {
    if (!selectedInsight) return;

    setActionStatus(status);
    setError(null);

    try {
      const token = await getAccessToken();
      const res = await fetch(
        `/api/admin/insights/${selectedInsight.property_id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status }),
        },
      );

      if (!res.ok) {
        const json = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(json.message ?? "Failed to update insight.");
      }

      setRefreshKey((value) => value + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update insight.");
    } finally {
      setActionStatus(null);
    }
  };

  const recomputeInsight = async () => {
    if (!selectedInsight) return;

    setIsRecomputing(true);
    setError(null);

    try {
      const token = await getAccessToken();
      const res = await fetch(
        `/api/admin/properties/${selectedInsight.property_id}/insights/recompute`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!res.ok) {
        const json = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(json.message ?? "Failed to recompute insight.");
      }

      setRefreshKey((value) => value + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to recompute insight.");
    } finally {
      setIsRecomputing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Insight moderation</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Approve, reject, or hide distilled property summaries before they
            appear on public detail pages.
          </p>
        </div>
        <label className="block text-sm">
          <span className="mb-2 block font-medium text-foreground">Filter</span>
          <select
            value={filter}
            onChange={(e) =>
              setFilter(e.target.value as "all" | DistilledInsightStatus)
            }
            className={selectClass}
          >
            {INSIGHT_STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status === "all" ? "All statuses" : status}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error && (
        <FeedbackPanel tone="error" description={error} />
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,1fr)]">
        <section className={`${sectionCardClass} overflow-hidden`}>
          <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
            <h2 className="text-lg font-semibold text-foreground">
              Insight queue
            </h2>
          </div>

          {loading ? (
            <div className="space-y-3 p-4">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-20 animate-pulse rounded-lg border border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800"
                  aria-hidden
                />
              ))}
            </div>
          ) : items.length === 0 ? (
            <p className="p-4 text-sm text-zinc-500 dark:text-zinc-400">
              No insights match the current filter.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
                <thead className="bg-zinc-50 dark:bg-zinc-900">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                      Property
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                      Updated
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {items.map((item) => (
                    <tr
                      key={item.property_id}
                      className={`cursor-pointer transition hover:bg-zinc-50 dark:hover:bg-zinc-900 ${
                        item.property_id === selectedPropertyId
                          ? "bg-zinc-50 dark:bg-zinc-900"
                          : ""
                      }`}
                      onClick={() => setSelectedPropertyId(item.property_id)}
                    >
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass(item.status)}`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-foreground">
                        {item.property_display_name}
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">
                        {formatDateTime(item.updated_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="space-y-6">
          <div className={`${sectionCardClass} p-6`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Insight detail
                </h2>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  Public pages only read insights after they are approved.
                </p>
              </div>
              {selectedInsight && (
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass(selectedInsight.status)}`}
                >
                  {selectedInsight.status}
                </span>
              )}
            </div>

            {!selectedInsight ? (
              <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
                Select an insight to inspect and moderate it.
              </p>
            ) : (
              <div className="mt-6 space-y-6">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {selectedInsight.property_display_name}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-3 text-sm text-zinc-500 dark:text-zinc-400">
                    <span>Generated {formatDateTime(selectedInsight.last_generated_at)}</span>
                    <span>Updated {formatDateTime(selectedInsight.updated_at)}</span>
                    <span>
                      Screened {selectedInsight.screened ? "yes" : "no"}
                    </span>
                  </div>
                  <div className="mt-3">
                    <Link
                      href={`/properties/${selectedInsight.property_id}`}
                      className="text-sm font-medium text-foreground underline underline-offset-4"
                    >
                      Open public property page
                    </Link>
                  </div>
                </div>

                <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
                  <p className="text-sm font-medium text-foreground">
                    Distilled summary text
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-zinc-700 dark:text-zinc-300">
                    {selectedInsight.insights_text}
                  </p>
                </div>

                <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
                  <p className="text-sm font-medium text-foreground">
                    Screening metadata
                  </p>
                  <pre className="mt-3 overflow-x-auto rounded bg-zinc-950/95 p-3 text-xs text-zinc-100 dark:bg-black">
                    {JSON.stringify(
                      {
                        screened: selectedInsight.screened,
                        screened_at: selectedInsight.screened_at,
                        screening_flags: selectedInsight.screening_flags,
                      },
                      null,
                      2,
                    )}
                  </pre>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    disabled={actionStatus !== null || isRecomputing}
                    onClick={() => void recomputeInsight()}
                    className={primaryButtonClass}
                  >
                    {isRecomputing ? "Recomputing…" : "Recompute insight"}
                  </button>
                  <button
                    type="button"
                    disabled={
                      actionStatus !== null ||
                      isRecomputing ||
                      selectedInsight.status === "approved"
                    }
                    onClick={() => void updateStatus("approved")}
                    className={primaryButtonClass}
                  >
                    {actionStatus === "approved" ? "Approving…" : "Approve"}
                  </button>
                  <button
                    type="button"
                    disabled={
                      actionStatus !== null ||
                      isRecomputing ||
                      selectedInsight.status === "rejected"
                    }
                    onClick={() => void updateStatus("rejected")}
                    className={destructiveButtonClass}
                  >
                    {actionStatus === "rejected" ? "Rejecting…" : "Reject"}
                  </button>
                  <button
                    type="button"
                    disabled={
                      actionStatus !== null ||
                      isRecomputing ||
                      selectedInsight.status === "hidden"
                    }
                    onClick={() => void updateStatus("hidden")}
                    className={secondaryButtonClass}
                  >
                    {actionStatus === "hidden" ? "Hiding…" : "Hide"}
                  </button>
                  <button
                    type="button"
                    disabled={
                      actionStatus !== null ||
                      isRecomputing ||
                      selectedInsight.status === "pending"
                    }
                    onClick={() => void updateStatus("pending")}
                    className={secondaryButtonClass}
                  >
                    {actionStatus === "pending" ? "Resetting…" : "Reset to pending"}
                  </button>
                </div>
              </div>
            )}
          </div>

          <AdminAuditFeed refreshKey={refreshKey} />
        </section>
      </div>
    </div>
  );
}
