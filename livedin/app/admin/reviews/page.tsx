"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AdminAuditFeed } from "@/components/admin/AdminAuditFeed";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import type { AdminReviewModerationItem, ReviewStatus } from "@/lib/types";

const REVIEW_STATUS_OPTIONS: Array<"all" | ReviewStatus> = [
  "all",
  "pending",
  "approved",
  "rejected",
  "removed",
];

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString();
}

function formatDate(value: string | null): string {
  return value ? new Date(value).toLocaleDateString() : "—";
}

function summarizeUser(userId: string): string {
  return `${userId.slice(0, 8)}…${userId.slice(-4)}`;
}

function statusBadgeClass(status: ReviewStatus): string {
  switch (status) {
    case "approved":
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
    case "pending":
      return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300";
    case "rejected":
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
    case "removed":
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

export default function AdminReviewsPage() {
  const [filter, setFilter] = useState<"all" | ReviewStatus>("pending");
  const [items, setItems] = useState<AdminReviewModerationItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionStatus, setActionStatus] = useState<ReviewStatus | null>(null);
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

        const res = await fetch(`/api/admin/reviews?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          throw new Error("Failed to load reviews.");
        }

        const data = (await res.json()) as { items?: AdminReviewModerationItem[] };
        if (!active) return;

        const nextItems = data.items ?? [];
        setItems(nextItems);
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

  const selectedReview = useMemo(
    () => items.find((item) => item.id === selectedId) ?? null,
    [items, selectedId],
  );

  const updateStatus = async (status: ReviewStatus) => {
    if (!selectedReview) return;

    setActionStatus(status);
    setError(null);

    try {
      const token = await getAccessToken();
      const res = await fetch(`/api/admin/reviews/${selectedReview.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) {
        const json = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(json.message ?? "Failed to update review.");
      }

      setRefreshKey((value) => value + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update review.");
    } finally {
      setActionStatus(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Review moderation</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Review private submission text, moderation status, and score changes
            before content affects public trust signals.
          </p>
        </div>
        <label className="block text-sm">
          <span className="mb-2 block font-medium text-foreground">Filter</span>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as "all" | ReviewStatus)}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-foreground dark:border-zinc-600 dark:bg-zinc-900"
          >
            {REVIEW_STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status === "all" ? "All statuses" : status}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">
          {error}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,1fr)]">
        <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-950">
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
          ) : items.length === 0 ? (
            <p className="p-4 text-sm text-zinc-500 dark:text-zinc-400">
              No reviews match the current filter.
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
                      User
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                      Submitted
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {items.map((item) => (
                    <tr
                      key={item.id}
                      className={`cursor-pointer transition hover:bg-zinc-50 dark:hover:bg-zinc-900 ${
                        item.id === selectedId ? "bg-zinc-50 dark:bg-zinc-900" : ""
                      }`}
                      onClick={() => setSelectedId(item.id)}
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
          <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-950">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Review detail
                </h2>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  Private renter text is only visible here in the admin area.
                </p>
              </div>
              {selectedReview && (
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass(selectedReview.status)}`}
                >
                  {selectedReview.status}
                </span>
              )}
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
                    onClick={() => void updateStatus("approved")}
                    className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-500 disabled:pointer-events-none disabled:opacity-50"
                  >
                    {actionStatus === "approved" ? "Approving…" : "Approve"}
                  </button>
                  <button
                    type="button"
                    disabled={actionStatus !== null || selectedReview.status === "rejected"}
                    onClick={() => void updateStatus("rejected")}
                    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 disabled:pointer-events-none disabled:opacity-50"
                  >
                    {actionStatus === "rejected" ? "Rejecting…" : "Reject"}
                  </button>
                  <button
                    type="button"
                    disabled={actionStatus !== null || selectedReview.status === "removed"}
                    onClick={() => void updateStatus("removed")}
                    className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-foreground hover:bg-zinc-50 disabled:pointer-events-none disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-900 dark:hover:bg-zinc-800"
                  >
                    {actionStatus === "removed" ? "Removing…" : "Remove"}
                  </button>
                  <button
                    type="button"
                    disabled={actionStatus !== null || selectedReview.status === "pending"}
                    onClick={() => void updateStatus("pending")}
                    className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-foreground hover:bg-zinc-50 disabled:pointer-events-none disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-900 dark:hover:bg-zinc-800"
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
