"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminAuditFeed } from "@/components/admin/AdminAuditFeed";
import { FeedbackPanel } from "@/components/ui/FeedbackPanel";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import type {
  AdminRoleRequestQueueItem,
  AdminRoleReviewStatus,
} from "@/lib/types";
import { ADMIN_INTENDED_ACTION_LABELS } from "@/lib/types";
import {
  destructiveButtonClass,
  primaryButtonClass,
  sectionCardClass,
  selectClass,
  textareaClass,
} from "@/lib/ui";

const REQUEST_STATUS_OPTIONS = ["pending", "approved", "rejected", "all"] as const;

function formatDateTime(value: string | null): string {
  if (!value) {
    return "Not yet reviewed";
  }

  return new Date(value).toLocaleString();
}

function summarizeUser(userId: string): string {
  return `${userId.slice(0, 8)}…${userId.slice(-4)}`;
}

function statusBadgeClass(status: AdminRoleRequestQueueItem["status"]): string {
  switch (status) {
    case "approved":
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
    case "rejected":
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
    default:
      return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300";
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

export default function AdminAccessRequestsPage() {
  const [filter, setFilter] = useState<(typeof REQUEST_STATUS_OPTIONS)[number]>("pending");
  const [items, setItems] = useState<AdminRoleRequestQueueItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionStatus, setActionStatus] = useState<AdminRoleReviewStatus | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
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

        const res = await fetch(`/api/admin/access-requests?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          throw new Error("Failed to load admin access requests.");
        }

        const data = (await res.json()) as { items?: AdminRoleRequestQueueItem[] };
        if (!active) {
          return;
        }

        const nextItems = data.items ?? [];
        setItems(nextItems);
        setSelectedId((current) => {
          if (current && nextItems.some((item) => item.id === current)) {
            return current;
          }
          return nextItems[0]?.id ?? null;
        });
      } catch (err) {
        if (!active) {
          return;
        }

        setItems([]);
        setSelectedId(null);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load admin access requests.",
        );
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

  const selectedRequest = useMemo(
    () => items.find((item) => item.id === selectedId) ?? null,
    [items, selectedId],
  );

  useEffect(() => {
    setReviewNotes(selectedRequest?.review_notes ?? "");
  }, [selectedRequest]);

  const reviewRequest = async (status: AdminRoleReviewStatus) => {
    if (!selectedRequest) {
      return;
    }

    setActionStatus(status);
    setError(null);

    try {
      const token = await getAccessToken();
      const res = await fetch(`/api/admin/access-requests/${selectedRequest.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status,
          review_notes: reviewNotes || undefined,
        }),
      });

      if (!res.ok) {
        const json = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(json.message ?? "Failed to review admin access request.");
      }

      setRefreshKey((value) => value + 1);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to review admin access request.",
      );
    } finally {
      setActionStatus(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Admin access requests</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Review restricted admin upgrade requests and promote accounts only
            after an explicit approval decision.
          </p>
        </div>
        <label className="block text-sm">
          <span className="mb-2 block font-medium text-foreground">Filter</span>
          <select
            value={filter}
            onChange={(event) =>
              setFilter(event.target.value as (typeof REQUEST_STATUS_OPTIONS)[number])
            }
            className={selectClass}
          >
            {REQUEST_STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status === "all" ? "All statuses" : status}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error ? <FeedbackPanel tone="error" description={error} /> : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,1fr)]">
        <section className={`${sectionCardClass} overflow-hidden`}>
          <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
            <h2 className="text-lg font-semibold text-foreground">Review queue</h2>
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
              No admin access requests match the current filter.
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
                      Requester
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                      Role
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
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-foreground">{item.full_name}</p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">{item.email_snapshot}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">
                        {item.role_title}
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

        <section className={`${sectionCardClass} p-6`}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Request detail</h2>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Approval promotes the requester to the `admin` role immediately.
              </p>
            </div>
            {selectedRequest ? (
              <span
                className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass(selectedRequest.status)}`}
              >
                {selectedRequest.status}
              </span>
            ) : null}
          </div>

          {!selectedRequest ? (
            <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
              Select a request to review it.
            </p>
          ) : (
            <div className="mt-6 space-y-6">
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">Full name</p>
                  <p className="mt-1 font-medium text-foreground">
                    {selectedRequest.full_name}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">Role / position</p>
                  <p className="mt-1 text-foreground">
                    {selectedRequest.role_title}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">Email</p>
                  <p className="mt-1 font-medium text-foreground">
                    {selectedRequest.email_snapshot}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">User ID</p>
                  <p className="mt-1 font-mono text-xs text-foreground">
                    {selectedRequest.user_id}
                  </p>
                </div>
                {selectedRequest.intended_actions?.length > 0 ? (
                  <div>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">Requested capabilities</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {selectedRequest.intended_actions.map((action) => (
                        <span
                          key={action}
                          className="inline-flex rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                        >
                          {ADMIN_INTENDED_ACTION_LABELS[action] ?? action}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
                {selectedRequest.team_context ? (
                  <div>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">Team / org context</p>
                    <p className="mt-1 text-foreground">{selectedRequest.team_context}</p>
                  </div>
                ) : null}
                {selectedRequest.referral_contact ? (
                  <div>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">Referral / sponsor</p>
                    <p className="mt-1 text-foreground">{selectedRequest.referral_contact}</p>
                  </div>
                ) : null}
                <div>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">Reason</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-7 text-foreground">
                    {selectedRequest.reason}
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">Submitted</p>
                  <p className="mt-1 text-sm font-medium text-foreground">
                    {formatDateTime(selectedRequest.created_at)}
                  </p>
                </div>
                <div className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">Reviewed</p>
                  <p className="mt-1 text-sm font-medium text-foreground">
                    {formatDateTime(selectedRequest.reviewed_at)}
                  </p>
                </div>
              </div>

              <div>
                <label
                  htmlFor="admin-request-review-notes"
                  className="block text-sm font-medium text-foreground"
                >
                  Review notes
                </label>
                <textarea
                  id="admin-request-review-notes"
                  value={reviewNotes}
                  onChange={(event) => setReviewNotes(event.target.value)}
                  className={`${textareaClass} mt-1`}
                  placeholder="Optional internal note to record with the review decision."
                  maxLength={1000}
                  disabled={selectedRequest.status !== "pending"}
                />
              </div>

              {selectedRequest.review_notes && selectedRequest.status !== "pending" ? (
                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
                  <p className="text-sm font-medium text-foreground">
                    Recorded review note
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-zinc-700 dark:text-zinc-300">
                    {selectedRequest.review_notes}
                  </p>
                </div>
              ) : null}

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  disabled={actionStatus !== null || selectedRequest.status !== "pending"}
                  onClick={() => void reviewRequest("approved")}
                  className={primaryButtonClass}
                >
                  {actionStatus === "approved" ? "Approving…" : "Approve and promote"}
                </button>
                <button
                  type="button"
                  disabled={actionStatus !== null || selectedRequest.status !== "pending"}
                  onClick={() => void reviewRequest("rejected")}
                  className={destructiveButtonClass}
                >
                  {actionStatus === "rejected" ? "Rejecting…" : "Reject request"}
                </button>
              </div>
            </div>
          )}
        </section>
      </div>

      <AdminAuditFeed
        title="Recent admin access decisions"
        targetTypes={["admin_role_request"]}
        refreshKey={refreshKey}
      />
    </div>
  );
}
