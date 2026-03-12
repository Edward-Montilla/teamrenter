"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AdminAuditFeed } from "@/components/admin/AdminAuditFeed";
import { AdminSummaryCard } from "@/components/admin/AdminSummaryCard";
import { FeedbackPanel } from "@/components/ui/FeedbackPanel";
import { adminFetch } from "@/lib/admin-client";
import {
  formatDateTime,
  insightStatusBadgeClass,
} from "@/lib/admin-display";
import type {
  AdminInsightModerationItem,
  DistilledInsightStatus,
} from "@/lib/types";
import {
  destructiveButtonClass,
  inputClass,
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

type SortOption = "updated_desc" | "generated_desc" | "name_asc";

export default function AdminInsightsPage() {
  const [filter, setFilter] = useState<"all" | DistilledInsightStatus>("pending");
  const [sortBy, setSortBy] = useState<SortOption>("updated_desc");
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<AdminInsightModerationItem[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [selectedPropertyIds, setSelectedPropertyIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRecomputing, setIsRecomputing] = useState(false);
  const [actionStatus, setActionStatus] = useState<
    DistilledInsightStatus | "batch" | null
  >(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (filter !== "all") {
          params.set("status", filter);
        }

        const data = await adminFetch<{ items?: AdminInsightModerationItem[] }>(
          `/api/admin/insights?${params.toString()}`,
        );
        if (!active) return;

        const nextItems = data.items ?? [];
        setItems(nextItems);
        setSelectedPropertyIds((current) =>
          current.filter((id) => nextItems.some((item) => item.property_id === id)),
        );
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
        setSelectedPropertyIds([]);
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

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const nextItems = items.filter((item) => {
      if (!normalizedQuery) {
        return true;
      }

      return (
        item.property_display_name.toLowerCase().includes(normalizedQuery) ||
        item.insights_text.toLowerCase().includes(normalizedQuery)
      );
    });

    return nextItems.toSorted((left, right) => {
      switch (sortBy) {
        case "generated_desc":
          return right.last_generated_at.localeCompare(left.last_generated_at);
        case "name_asc":
          return left.property_display_name.localeCompare(right.property_display_name);
        default:
          return right.updated_at.localeCompare(left.updated_at);
      }
    });
  }, [items, query, sortBy]);

  const selectedInsight = useMemo(
    () => filteredItems.find((item) => item.property_id === selectedPropertyId) ?? null,
    [filteredItems, selectedPropertyId],
  );

  const summary = useMemo(
    () => ({
      pending: items.filter((item) => item.status === "pending").length,
      approved: items.filter((item) => item.status === "approved").length,
      hidden: items.filter((item) => item.status === "hidden").length,
      selected: selectedPropertyIds.length,
    }),
    [items, selectedPropertyIds.length],
  );

  const toggleSelected = (propertyId: string) => {
    setSelectedPropertyIds((current) =>
      current.includes(propertyId)
        ? current.filter((value) => value !== propertyId)
        : [...current, propertyId],
    );
  };

  const updateStatus = async (
    status: DistilledInsightStatus,
    propertyIds: string[],
    mode: "single" | "batch",
  ) => {
    if (propertyIds.length === 0) return;

    setActionStatus(mode === "single" ? status : "batch");
    setError(null);

    try {
      await Promise.all(
        propertyIds.map((propertyId) =>
          adminFetch(`/api/admin/insights/${propertyId}`, {
            method: "PATCH",
            body: JSON.stringify({ status }),
          }),
        ),
      );

      setSelectedPropertyIds([]);
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
      await adminFetch(
        `/api/admin/properties/${selectedInsight.property_id}/insights/recompute`,
        { method: "POST" },
      );
      setRefreshKey((value) => value + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to recompute insight.");
    } finally {
      setIsRecomputing(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className={`${sectionCardClass} p-6 sm:p-8`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500 dark:text-zinc-400">
              Moderation
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
              Insight queue
            </h1>
            <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              Search generated renter insight text, batch moderation changes, and
              inspect screening context before publishing summaries publicly.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/admin" className={secondaryButtonClass}>
              Dashboard
            </Link>
            <Link href="/admin/audit" className={secondaryButtonClass}>
              Audit history
            </Link>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminSummaryCard
          label="Pending"
          value={summary.pending}
          description="Generated summaries currently waiting on moderation."
        />
        <AdminSummaryCard
          label="Approved"
          value={summary.approved}
          description="Insight rows that are already visible on public property pages."
        />
        <AdminSummaryCard
          label="Hidden"
          value={summary.hidden}
          description="Summaries kept out of public property detail pages."
        />
        <AdminSummaryCard
          label="Selected"
          value={summary.selected}
          description="Rows currently selected for a batch moderation action."
        />
      </div>

      <section className={`${sectionCardClass} p-6`}>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_220px_220px]">
          <label className="block text-sm">
            <span className="mb-2 block font-medium text-foreground">Search</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className={inputClass}
              placeholder="Property name or insight text"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-2 block font-medium text-foreground">Filter</span>
            <select
              value={filter}
              onChange={(event) =>
                setFilter(event.target.value as "all" | DistilledInsightStatus)
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
          <label className="block text-sm">
            <span className="mb-2 block font-medium text-foreground">Sort</span>
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as SortOption)}
              className={selectClass}
            >
              <option value="updated_desc">Recently updated</option>
              <option value="generated_desc">Recently generated</option>
              <option value="name_asc">Property name A-Z</option>
            </select>
          </label>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            disabled={actionStatus !== null || selectedPropertyIds.length === 0}
            onClick={() => void updateStatus("approved", selectedPropertyIds, "batch")}
            className={primaryButtonClass}
          >
            {actionStatus === "batch" ? "Applying…" : "Approve selected"}
          </button>
          <button
            type="button"
            disabled={actionStatus !== null || selectedPropertyIds.length === 0}
            onClick={() => void updateStatus("rejected", selectedPropertyIds, "batch")}
            className={destructiveButtonClass}
          >
            {actionStatus === "batch" ? "Applying…" : "Reject selected"}
          </button>
          <button
            type="button"
            disabled={actionStatus !== null || selectedPropertyIds.length === 0}
            onClick={() => void updateStatus("pending", selectedPropertyIds, "batch")}
            className={secondaryButtonClass}
          >
            {actionStatus === "batch" ? "Applying…" : "Reset selected"}
          </button>
        </div>
      </section>

      {error ? <FeedbackPanel tone="error" description={error} /> : null}

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
          ) : filteredItems.length === 0 ? (
            <p className="p-4 text-sm text-zinc-500 dark:text-zinc-400">
              No insights match the current filter.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
                <thead className="bg-zinc-50 dark:bg-zinc-900">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                      Select
                    </th>
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
                  {filteredItems.map((item) => (
                    <tr
                      key={item.property_id}
                      className={`cursor-pointer transition hover:bg-zinc-50 dark:hover:bg-zinc-900 ${
                        item.property_id === selectedPropertyId
                          ? "bg-zinc-50 dark:bg-zinc-900"
                          : ""
                      }`}
                      onClick={() => setSelectedPropertyId(item.property_id)}
                    >
                      <td className="px-4 py-3" onClick={(event) => event.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedPropertyIds.includes(item.property_id)}
                          onChange={() => toggleSelected(item.property_id)}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${insightStatusBadgeClass(item.status)}`}
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
              {selectedInsight ? (
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${insightStatusBadgeClass(selectedInsight.status)}`}
                >
                  {selectedInsight.status}
                </span>
              ) : null}
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
                    onClick={() =>
                      void updateStatus("approved", [selectedInsight.property_id], "single")
                    }
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
                    onClick={() =>
                      void updateStatus("rejected", [selectedInsight.property_id], "single")
                    }
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
                    onClick={() =>
                      void updateStatus("hidden", [selectedInsight.property_id], "single")
                    }
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
                    onClick={() =>
                      void updateStatus("pending", [selectedInsight.property_id], "single")
                    }
                    className={secondaryButtonClass}
                  >
                    {actionStatus === "pending" ? "Resetting…" : "Reset to pending"}
                  </button>
                </div>
              </div>
            )}
          </div>

          <AdminAuditFeed
            title="Selected insight history"
            targetTypes={["insight"]}
            targetId={selectedInsight?.property_id ?? null}
            refreshKey={refreshKey}
            emptyMessage="No admin history exists yet for the selected insight."
          />
        </section>
      </div>
    </div>
  );
}
