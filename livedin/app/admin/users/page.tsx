"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AdminSummaryCard } from "@/components/admin/AdminSummaryCard";
import { FeedbackPanel } from "@/components/ui/FeedbackPanel";
import { adminFetch } from "@/lib/admin-client";
import {
  formatDateTime,
  requestStatusBadgeClass,
  roleBadgeClass,
  summarizeUser,
} from "@/lib/admin-display";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import type {
  AdminRoleRequestState,
  AdminUserListItem,
  CurrentUserRole,
} from "@/lib/types";
import {
  primaryButtonClass,
  secondaryButtonClass,
  sectionCardClass,
  inputClass,
  selectClass,
} from "@/lib/ui";

const ROLE_FILTERS: Array<"all" | CurrentUserRole> = [
  "all",
  "admin",
  "verified",
  "public",
];
const REQUEST_FILTERS: Array<"all" | AdminRoleRequestState> = [
  "all",
  "none",
  "pending",
  "approved",
  "rejected",
];
type VerificationFilter = "all" | "true" | "false";
const ROLE_OPTIONS: CurrentUserRole[] = ["public", "verified", "admin"];

export default function AdminUsersPage() {
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | CurrentUserRole>("all");
  const [verificationFilter, setVerificationFilter] =
    useState<VerificationFilter>("all");
  const [requestFilter, setRequestFilter] =
    useState<"all" | AdminRoleRequestState>("all");
  const [items, setItems] = useState<AdminUserListItem[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [banner, setBanner] = useState<{
    tone: "success" | "error";
    message: string;
  } | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;

    const syncCurrentUser = async () => {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!active) {
        return;
      }

      setCurrentUserId(session?.user.id ?? null);
    };

    void syncCurrentUser();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    const loadUsers = async () => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (query.trim()) {
          params.set("query", query.trim());
        }
        if (roleFilter !== "all") {
          params.set("role", roleFilter);
        }
        if (verificationFilter !== "all") {
          params.set("email_verified", verificationFilter);
        }
        if (requestFilter !== "all") {
          params.set("request_status", requestFilter);
        }

        const data = await adminFetch<{ items: AdminUserListItem[] }>(
          `/api/admin/users?${params.toString()}`,
        );
        if (!active) {
          return;
        }

        const nextItems = data.items ?? [];
        setItems(nextItems);
        setSelectedUserId((current) => {
          if (current && nextItems.some((item) => item.user_id === current)) {
            return current;
          }

          return nextItems[0]?.user_id ?? null;
        });
      } catch (err) {
        if (!active) {
          return;
        }

        setItems([]);
        setSelectedUserId(null);
        setError(err instanceof Error ? err.message : "Failed to load users.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadUsers();

    return () => {
      active = false;
    };
  }, [query, roleFilter, verificationFilter, requestFilter, refreshKey]);

  const selectedUser = useMemo(
    () => items.find((item) => item.user_id === selectedUserId) ?? null,
    [items, selectedUserId],
  );
  const counts = useMemo(
    () => ({
      admins: items.filter((item) => item.role === "admin").length,
      verified: items.filter((item) => item.role === "verified").length,
      publicUsers: items.filter((item) => item.role === "public").length,
      pendingRequests: items.filter(
        (item) => item.latest_admin_request_status === "pending",
      ).length,
    }),
    [items],
  );

  const [draftRole, setDraftRole] = useState<CurrentUserRole>("public");
  const [draftEmailVerified, setDraftEmailVerified] = useState(false);

  useEffect(() => {
    setDraftRole(selectedUser?.role ?? "public");
    setDraftEmailVerified(selectedUser?.email_verified ?? false);
  }, [selectedUser]);

  const hasUnsavedChanges =
    !!selectedUser &&
    (draftRole !== selectedUser.role ||
      draftEmailVerified !== selectedUser.email_verified);

  const handleSave = async () => {
    if (!selectedUser) {
      return;
    }

    setSaving(true);
    setBanner(null);
    setError(null);

    try {
      await adminFetch(`/api/admin/users/${selectedUser.user_id}`, {
        method: "PATCH",
        body: JSON.stringify({
          role: draftRole,
          email_verified: draftEmailVerified,
        }),
      });

      setBanner({
        tone: "success",
        message: `Updated ${selectedUser.email ?? summarizeUser(selectedUser.user_id)}.`,
      });
      setRefreshKey((value) => value + 1);
    } catch (err) {
      setBanner({
        tone: "error",
        message: err instanceof Error ? err.message : "Failed to update user.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className={`${sectionCardClass} p-6 sm:p-8`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500 dark:text-zinc-400">
              Admin console
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
              Users and roles
            </h1>
            <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              Search the user base, inspect admin-request context, and promote,
              demote, or repair account state without leaving the admin area.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/admin/access-requests" className={secondaryButtonClass}>
              Access requests
            </Link>
            <Link href="/admin/audit" className={secondaryButtonClass}>
              Audit history
            </Link>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminSummaryCard
          label="Admins"
          value={counts.admins}
          description="Accounts that currently have access to the admin console."
        />
        <AdminSummaryCard
          label="Verified users"
          value={counts.verified}
          description="Signed-in users who can submit reviews and be promoted."
        />
        <AdminSummaryCard
          label="Public users"
          value={counts.publicUsers}
          description="Accounts that still need verified-email status."
        />
        <AdminSummaryCard
          label="Pending requests"
          value={counts.pendingRequests}
          description="Users waiting on explicit admin-review approval."
          href="/admin/access-requests"
          ctaLabel="Review queue"
        />
      </div>

      <section className={`${sectionCardClass} p-6`}>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <label className="block text-sm">
            <span className="mb-2 block font-medium text-foreground">Search</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className={inputClass}
              placeholder="Email, latest request email, or user ID"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-2 block font-medium text-foreground">Role</span>
            <select
              value={roleFilter}
              onChange={(event) =>
                setRoleFilter(event.target.value as "all" | CurrentUserRole)
              }
              className={selectClass}
            >
              {ROLE_FILTERS.map((option) => (
                <option key={option} value={option}>
                  {option === "all" ? "All roles" : option}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-2 block font-medium text-foreground">
              Email verified
            </span>
            <select
              value={verificationFilter}
              onChange={(event) =>
                setVerificationFilter(
                  event.target.value as VerificationFilter,
                )
              }
              className={selectClass}
            >
              <option value="all">All states</option>
              <option value="true">Verified</option>
              <option value="false">Unverified</option>
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-2 block font-medium text-foreground">
              Latest request
            </span>
            <select
              value={requestFilter}
              onChange={(event) =>
                setRequestFilter(
                  event.target.value as "all" | AdminRoleRequestState,
                )
              }
              className={selectClass}
            >
              {REQUEST_FILTERS.map((option) => (
                <option key={option} value={option}>
                  {option === "all" ? "All request states" : option}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {error ? <FeedbackPanel tone="error" description={error} /> : null}
      {banner ? (
        <FeedbackPanel tone={banner.tone} description={banner.message} />
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(340px,1fr)]">
        <section className={`${sectionCardClass} overflow-hidden`}>
          <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
            <h2 className="text-lg font-semibold text-foreground">Directory</h2>
          </div>

          {loading ? (
            <div className="space-y-3 p-4">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-20 animate-pulse rounded-2xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900"
                  aria-hidden
                />
              ))}
            </div>
          ) : items.length === 0 ? (
            <p className="p-4 text-sm text-zinc-500 dark:text-zinc-400">
              No users match the current filters.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
                <thead className="bg-zinc-50 dark:bg-zinc-900">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                      Role
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                      Verified
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                      Latest request
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {items.map((item) => (
                    <tr
                      key={item.user_id}
                      className={`cursor-pointer transition hover:bg-zinc-50 dark:hover:bg-zinc-900 ${
                        item.user_id === selectedUserId
                          ? "bg-zinc-50 dark:bg-zinc-900"
                          : ""
                      }`}
                      onClick={() => setSelectedUserId(item.user_id)}
                    >
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${roleBadgeClass(item.role)}`}
                        >
                          {item.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-foreground">
                        {item.email ?? item.latest_admin_request_email ?? summarizeUser(item.user_id)}
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">
                        {item.email_verified ? "Yes" : "No"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${requestStatusBadgeClass(item.latest_admin_request_status)}`}
                        >
                          {item.latest_admin_request_status}
                        </span>
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
              <h2 className="text-lg font-semibold text-foreground">User detail</h2>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Change roles carefully. Every update is audit-logged.
              </p>
            </div>
            {selectedUser ? (
              <span
                className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${roleBadgeClass(selectedUser.role)}`}
              >
                {selectedUser.role}
              </span>
            ) : null}
          </div>

          {!selectedUser ? (
            <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
              Select a user to inspect and update their account state.
            </p>
          ) : (
            <div className="mt-6 space-y-6">
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">Email</p>
                  <p className="mt-1 font-medium text-foreground">
                    {selectedUser.email ??
                      selectedUser.latest_admin_request_email ??
                      "Email unavailable"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">User ID</p>
                  <p className="mt-1 font-mono text-xs text-foreground">
                    {selectedUser.user_id}
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Created
                  </p>
                  <p className="mt-1 text-sm font-medium text-foreground">
                    {formatDateTime(selectedUser.created_at)}
                  </p>
                </div>
                <div className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Latest request
                  </p>
                  <p className="mt-1 text-sm font-medium text-foreground">
                    {formatDateTime(selectedUser.latest_admin_request_created_at)}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm">
                  <span className="mb-2 block font-medium text-foreground">
                    Role
                  </span>
                  <select
                    value={draftRole}
                    onChange={(event) =>
                      setDraftRole(event.target.value as CurrentUserRole)
                    }
                    className={selectClass}
                    disabled={saving}
                  >
                    {ROLE_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex items-center gap-3 rounded-2xl border border-zinc-200 px-4 py-3 text-sm dark:border-zinc-800">
                  <input
                    type="checkbox"
                    checked={draftEmailVerified}
                    onChange={(event) =>
                      setDraftEmailVerified(event.target.checked)
                    }
                    disabled={saving}
                  />
                  <span className="font-medium text-foreground">
                    Email verified
                  </span>
                </label>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${requestStatusBadgeClass(selectedUser.latest_admin_request_status)}`}
                  >
                    {selectedUser.latest_admin_request_status}
                  </span>
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    Latest admin-request state
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                  {selectedUser.latest_admin_request_status === "none"
                    ? "This user has not submitted an admin access request yet."
                    : `Most recent request captured ${
                        selectedUser.latest_admin_request_email ??
                        "the account email"
                      } and was created ${formatDateTime(
                        selectedUser.latest_admin_request_created_at,
                      )}.`}
                </p>
                {selectedUser.latest_admin_request_status !== "none" ? (
                  <div className="mt-4">
                    <Link
                      href="/admin/access-requests"
                      className={secondaryButtonClass}
                    >
                      Open access-request queue
                    </Link>
                  </div>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => void handleSave()}
                  disabled={saving || !hasUnsavedChanges}
                  className={primaryButtonClass}
                >
                  {saving ? "Saving…" : "Save changes"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDraftRole(selectedUser.role);
                    setDraftEmailVerified(selectedUser.email_verified);
                  }}
                  disabled={saving || !hasUnsavedChanges}
                  className={secondaryButtonClass}
                >
                  Reset draft
                </button>
              </div>

              {currentUserId === selectedUser.user_id ? (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  This is your current account. Self-demotion is blocked.
                </p>
              ) : null}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
