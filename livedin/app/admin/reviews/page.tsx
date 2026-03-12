"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AdminAuditFeed } from "@/components/admin/AdminAuditFeed";
import { AdminSummaryCard } from "@/components/admin/AdminSummaryCard";
import { FeedbackPanel } from "@/components/ui/FeedbackPanel";
import { adminFetch } from "@/lib/admin-client";
import {
  formatDate,
  formatDateTime,
  reviewStatusBadgeClass,
  summarizeUser,
} from "@/lib/admin-display";
import type { AdminReviewModerationItem, ReviewStatus } from "@/lib/types";
import {
  destructiveButtonClass,
  inputClass,
  primaryButtonClass,
  secondaryButtonClass,
  sectionCardClass,
  selectClass,
} from "@/lib/ui";

const REVIEW_STATUS_OPTIONS: Array<"all" | ReviewStatus> = [
  "all",
  "pending",
  "approved",
  "rejected",
  "removed",
];

type SortOption = "created_desc" | "created_asc" | "updated_desc";

export default function AdminReviewsPage() {
  const [filter, setFilter] = useState<"all" | ReviewStatus>("pending");
  const [sortBy, setSortBy] = useState<SortOption>("created_desc");
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<AdminReviewModerationItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionStatus, setActionStatus] = useState<ReviewStatus | "batch" | null>(
    null,
  );
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

        const data = await adminFetch<{ items?: AdminReviewModerationItem[] }>(
          `/api/admin/reviews?${params.toString()}`,
        );
        if (!active) return;

        const nextItems = data.items ?? [];
        setItems(nextItems);
        setSelectedIds((current) =>
          current.filter((id) => nextItems.some((item) => item.id === id)),
        );
        setSelectedId((current) => {
          if (current && nextItems.some((item) => item.id === current)) {
            return current;
          }
          return nextItems[0]?.id ?? null;
        });
      } catch (err) {
        if (!active) return;
        setItems([]);
        setSelectedId(null);
        setSelectedIds([]);
        setError(err instanceof Error ? err.message : "Failed to load reviews.");
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
        item.user_id.toLowerCase().includes(normalizedQuery) ||
        (item.text_input ?? "").toLowerCase().includes(normalizedQuery)
      );
    });

    return nextItems.toSorted((left, right) => {
      switch (sortBy) {
        case "created_asc":
          return left.created_at.localeCompare(right.created_at);
        case "updated_desc":
          return right.updated_at.localeCompare(left.updated_at);
        default:
          return right.created_at.localeCompare(left.created_at);
      }
    });
  }, [items, query, sortBy]);

  const selectedReview = useMemo(
    () => filteredItems.find((item) => item.id === selectedId) ?? null,
    [filteredItems, selectedId],
  );

  const summary = useMemo(
    () => ({
      pending: items.filter((item) => item.status === "pending").length,
      approved: items.filter((item) => item.status === "approved").length,
      removed: items.filter((item) => item.status === "removed").length,
      selected: selectedIds.length,
    }),
    [items, selectedIds.length],
  );

  const toggleSelected = (id: string) => {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id],
    );
  };

  const updateStatus = async (
    status: ReviewStatus,
    targetIds: string[],
    mode: "single" | "batch",
  ) => {
    if (targetIds.length === 0) return;

    setActionStatus(mode === "single" ? status : "batch");
    setError(null);

    try {
      await Promise.all(
        targetIds.map((id) =>
          adminFetch(`/api/admin/reviews/${id}`, {
            method: "PATCH",
            body: JSON.stringify({ status }),
          }),
        ),
      );

      setSelectedIds([]);
      setRefreshKey((value) => value + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update review.");
    } finally {
      setActionStatus(null);
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
              Review queue
            </h1>
            <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              Search private submissions, batch common moderation decisions, and
              inspect the history for a selected review before it changes public trust
              signals.
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
          description="Reviews currently waiting for a moderation decision."
        />
        <AdminSummaryCard
          label="Approved"
          value={summary.approved}
          description="Moderated reviews that already influence public scores."
        />
        <AdminSummaryCard
          label="Removed"
          value={summary.removed}
          description="Submissions excluded from public aggregates and publication."
        />
        <AdminSummaryCard
          label="Selected"
          value={summary.selected}
          description="Rows currently selected for batch moderation actions."
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
              placeholder="Property, user ID, or private text"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-2 block font-medium text-foreground">Filter</span>
            <select
              value={filter}
              onChange={(event) =>
                setFilter(event.target.value as "all" | ReviewStatus)
              }
              className={selectClass}
            >
              {REVIEW_STATUS_OPTIONS.map((status) => (
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
              <option value="created_desc">Newest first</option>
              <option value="created_asc">Oldest first</option>
              <option value="updated_desc">Recently updated</option>
            </select>
          </label>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            disabled={actionStatus !== null || selectedIds.length === 0}
            onClick={() => void updateStatus("approved", selectedIds, "batch")}
            className={primaryButtonClass}
          >
            {actionStatus === "batch" ? "Applying…" : "Approve selected"}
          </button>
          <button
            type="button"
            disabled={actionStatus !== null || selectedIds.length === 0}
            onClick={() => void updateStatus("rejected", selectedIds, "batch")}
            className={destructiveButtonClass}
          >
            {actionStatus === "batch" ? "Applying…" : "Reject selected"}
          </button>
          <button
            type="button"
            disabled={actionStatus !== null || selectedIds.length === 0}
            onClick={() => void updateStatus("pending", selectedIds, "batch")}
            className={secondaryButtonClass}
          >
            {actionStatus === "batch" ? "Applying…" : "Reset selected"}
          </button>
        </div>
      </section>

      {error ? <FeedbackPanel tone="error" description={error} /> : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,1fr)]">
        <section className={`${sectionCardClass} overflow-hidden`}>
          <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
            <h2 className="text-lg font-semibold text-foreground">
              Moderation queue
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
              No reviews match the current filter.
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
                      User
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                      Submitted
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {filteredItems.map((item) => (
                    <tr
                      key={item.id}
                      className={`cursor-pointer transition hover:bg-zinc-50 dark:hover:bg-zinc-900 ${
                        item.id === selectedId ? "bg-zinc-50 dark:bg-zinc-900" : ""
                      }`}
                      onClick={() => setSelectedId(item.id)}
                    >
                      <td className="px-4 py-3" onClick={(event) => event.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(item.id)}
                          onChange={() => toggleSelected(item.id)}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${reviewStatusBadgeClass(item.status)}`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-foreground">
                        {item.property_display_name}
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">
                        {summarizeUser(item.user_id)}
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">
                        {formatDateTime(item.created_at)}
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
                  Review detail
                </h2>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  Private renter text is only visible here in the admin area.
                </p>
              </div>
              {selectedReview ? (
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${reviewStatusBadgeClass(selectedReview.status)}`}
                >
                  {selectedReview.status}
                </span>
              ) : null}
            </div>

            {!selectedReview ? (
              <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
                Select a review to inspect its metrics and moderation actions.
              </p>
            ) : (
              <div className="mt-6 space-y-6">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {selectedReview.property_display_name}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-3 text-sm text-zinc-500 dark:text-zinc-400">
                    <span>User {summarizeUser(selectedReview.user_id)}</span>
                    <span>Created {formatDateTime(selectedReview.created_at)}</span>
                    <span>Updated {formatDateTime(selectedReview.updated_at)}</span>
                  </div>
                  <div className="mt-3">
                    <Link
                      href={`/properties/${selectedReview.property_id}`}
                      className="text-sm font-medium text-foreground underline underline-offset-4"
                    >
                      Open public property page
                    </Link>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
                    <p className="text-zinc-500 dark:text-zinc-400">
                      Management responsiveness
                    </p>
                    <p className="mt-1 text-lg font-semibold text-foreground">
                      {selectedReview.management_responsiveness} / 5
                    </p>
                  </div>
                  <div className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
                    <p className="text-zinc-500 dark:text-zinc-400">
                      Maintenance timeliness
                    </p>
                    <p className="mt-1 text-lg font-semibold text-foreground">
                      {selectedReview.maintenance_timeliness} / 5
                    </p>
                  </div>
                  <div className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
                    <p className="text-zinc-500 dark:text-zinc-400">
                      Listing accuracy
                    </p>
                    <p className="mt-1 text-lg font-semibold text-foreground">
                      {selectedReview.listing_accuracy} / 5
                    </p>
                  </div>
                  <div className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
                    <p className="text-zinc-500 dark:text-zinc-400">
                      Fee transparency
                    </p>
                    <p className="mt-1 text-lg font-semibold text-foreground">
                      {selectedReview.fee_transparency} / 5
                    </p>
                  </div>
                  <div className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
                    <p className="text-zinc-500 dark:text-zinc-400">
                      Lease clarity
                    </p>
                    <p className="mt-1 text-lg font-semibold text-foreground">
                      {selectedReview.lease_clarity} / 5
                    </p>
                  </div>
                  <div className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
                    <p className="text-zinc-500 dark:text-zinc-400">Tenancy</p>
                    <p className="mt-1 text-sm text-foreground">
                      {formatDate(selectedReview.tenancy_start)} to{" "}
                      {formatDate(selectedReview.tenancy_end)}
                    </p>
                  </div>
                </div>

                <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
                  <p className="text-sm font-medium text-foreground">
                    Private text input
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-zinc-700 dark:text-zinc-300">
                    {selectedReview.text_input?.trim() || "No private text provided."}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    disabled={actionStatus !== null || selectedReview.status === "approved"}
                    onClick={() => void updateStatus("approved", [selectedReview.id], "single")}
                    className={primaryButtonClass}
                  >
                    {actionStatus === "approved" ? "Approving…" : "Approve"}
                  </button>
                  <button
                    type="button"
                    disabled={actionStatus !== null || selectedReview.status === "rejected"}
                    onClick={() => void updateStatus("rejected", [selectedReview.id], "single")}
                    className={destructiveButtonClass}
                  >
                    {actionStatus === "rejected" ? "Rejecting…" : "Reject"}
                  </button>
                  <button
                    type="button"
                    disabled={actionStatus !== null || selectedReview.status === "removed"}
                    onClick={() => void updateStatus("removed", [selectedReview.id], "single")}
                    className={secondaryButtonClass}
                  >
                    {actionStatus === "removed" ? "Removing…" : "Remove"}
                  </button>
                  <button
                    type="button"
                    disabled={actionStatus !== null || selectedReview.status === "pending"}
                    onClick={() => void updateStatus("pending", [selectedReview.id], "single")}
                    className={secondaryButtonClass}
                  >
                    {actionStatus === "pending" ? "Resetting…" : "Reset to pending"}
                  </button>
                </div>
              </div>
            )}
          </div>

          <AdminAuditFeed
            title="Selected review history"
            targetTypes={["review"]}
            targetId={selectedReview?.id ?? null}
            refreshKey={refreshKey}
            emptyMessage="No admin history exists yet for the selected review."
          />
        </section>
      </div>
    </div>
  );
}
