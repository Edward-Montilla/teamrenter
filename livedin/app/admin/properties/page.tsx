"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FeedbackPanel } from "@/components/ui/FeedbackPanel";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import type { AdminPropertyListItem } from "@/lib/types";
import { primaryButtonClass, sectionCardClass } from "@/lib/ui";

function formatAddress(p: AdminPropertyListItem): string {
  const parts = [
    p.address_line1,
    p.address_line2,
    [p.city, p.province].filter(Boolean).join(" "),
    p.postal_code,
  ].filter(Boolean);
  return parts.join(", ");
}

export default function AdminPropertiesPage() {
  const [items, setItems] = useState<AdminPropertyListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchList = async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setError("Not configured");
      setLoading(false);
      return;
    }
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.access_token) {
      setError("Not signed in");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/properties", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) {
        if (res.status === 403) setError("Forbidden");
        else setError("Failed to load properties");
        setItems([]);
        return;
      }
      const data = (await res.json()) as { items: AdminPropertyListItem[] };
      setItems(data.items ?? []);
    } catch {
      setError("Failed to load properties");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  const toggleStatus = async (p: AdminPropertyListItem) => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase?.auth) return;
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.access_token) return;

    setTogglingId(p.id);
    try {
      const res = await fetch(`/api/admin/properties/${p.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          status: p.status === "active" ? "inactive" : "active",
        }),
      });
      if (res.ok) await fetchList();
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Properties</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Keep the property catalog easy to scan, update, and activate or deactivate.
          </p>
        </div>
        <Link
          href="/admin/properties/new"
          className={primaryButtonClass}
        >
          New property
        </Link>
      </div>

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-lg border border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800"
              aria-hidden
            />
          ))}
        </div>
      )}

      {error && !loading && (
        <FeedbackPanel
          tone="error"
          description={error}
          primaryAction={{ label: "Retry", onClick: fetchList }}
        />
      )}

      {!loading && !error && items.length === 0 && (
        <FeedbackPanel
          title="No properties yet"
          description="Create the first property so it can appear on the public site and in the review flow."
          primaryAction={{ label: "New property", href: "/admin/properties/new" }}
        />
      )}

      {!loading && !error && items.length > 0 && (
        <div className={`${sectionCardClass} overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-700">
              <thead className="bg-zinc-50 dark:bg-zinc-900">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                    Address
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                    Management
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 bg-white dark:divide-zinc-700 dark:bg-zinc-950">
                {items.map((p) => (
                  <tr key={p.id}>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          p.status === "active"
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground">
                      {p.display_name}
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">
                      {formatAddress(p)}
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">
                      {p.management_company ?? "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <Link
                        href={`/admin/properties/${p.id}/edit`}
                        className="mr-2 inline-flex rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-900"
                      >
                        Edit
                      </Link>
                      <button
                        type="button"
                        onClick={() => toggleStatus(p)}
                        disabled={togglingId === p.id}
                        className={`${p.status === "active" ? "text-red-700 dark:text-red-300" : "text-foreground"} rounded-lg px-3 py-2 text-sm font-medium hover:bg-zinc-100 disabled:opacity-50 dark:hover:bg-zinc-900`}
                      >
                        {togglingId === p.id
                          ? "…"
                          : p.status === "active"
                            ? "Deactivate"
                            : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
