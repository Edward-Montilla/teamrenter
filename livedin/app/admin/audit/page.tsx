"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AdminSummaryCard } from "@/components/admin/AdminSummaryCard";
import { FeedbackPanel } from "@/components/ui/FeedbackPanel";
import { adminFetch } from "@/lib/admin-client";
import { formatDateTime, summarizeUser } from "@/lib/admin-display";
import type { AdminAuditLogItem } from "@/lib/types";
import {
  inputClass,
  sectionCardClass,
  secondaryButtonClass,
  selectClass,
} from "@/lib/ui";

const TARGET_FILTERS = [
  "all",
  "property",
  "review",
  "insight",
  "admin_role_request",
  "property_photo",
  "profile",
] as const;

export default function AdminAuditPage() {
  const [items, setItems] = useState<AdminAuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [targetFilter, setTargetFilter] =
    useState<(typeof TARGET_FILTERS)[number]>("all");

  useEffect(() => {
    let active = true;

    const loadAudit = async () => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        params.set("limit", "100");
        if (targetFilter !== "all") {
          params.set("target_type", targetFilter);
        }

        const data = await adminFetch<{ items: AdminAuditLogItem[] }>(
          `/api/admin/audit?${params.toString()}`,
        );
        if (!active) {
          return;
        }

        setItems(data.items ?? []);
      } catch (err) {
        if (!active) {
          return;
        }

        setItems([]);
        setError(
          err instanceof Error ? err.message : "Failed to load audit history.",
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadAudit();

    return () => {
      active = false;
    };
  }, [targetFilter]);

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return items;
    }

    return items.filter((item) => {
      const details = item.details ? JSON.stringify(item.details).toLowerCase() : "";
      return (
        item.action_type.toLowerCase().includes(normalizedQuery) ||
        item.target_type.toLowerCase().includes(normalizedQuery) ||
        item.target_id.toLowerCase().includes(normalizedQuery) ||
        item.admin_user_id.toLowerCase().includes(normalizedQuery) ||
        details.includes(normalizedQuery)
      );
    });
  }, [items, query]);

  const summary = useMemo(
    () => ({
      total: filteredItems.length,
      reviewActions: filteredItems.filter((item) => item.target_type === "review")
        .length,
      propertyActions: filteredItems.filter(
        (item) => item.target_type === "property",
      ).length,
      accessDecisions: filteredItems.filter(
        (item) => item.target_type === "admin_role_request",
      ).length,
    }),
    [filteredItems],
  );

  return (
    <div className="space-y-6">
      <section className={`${sectionCardClass} p-6 sm:p-8`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500 dark:text-zinc-400">
              Admin console
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
              Audit history
            </h1>
            <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              Inspect administrative changes across moderation, property updates,
              photo registration, and user-role decisions from one place.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/admin" className={secondaryButtonClass}>
              Dashboard
            </Link>
            <Link href="/admin/users" className={secondaryButtonClass}>
              Users
            </Link>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminSummaryCard
          label="Visible events"
          value={summary.total}
          description="Audit rows that match the current target filter and search."
        />
        <AdminSummaryCard
          label="Review actions"
          value={summary.reviewActions}
          description="Moderation decisions affecting private renter reviews."
        />
        <AdminSummaryCard
          label="Property actions"
          value={summary.propertyActions}
          description="Property create, update, delete, and photo-management changes."
        />
        <AdminSummaryCard
          label="Access decisions"
          value={summary.accessDecisions}
          description="Admin-access approval and rejection decisions."
        />
      </div>

      <section className={`${sectionCardClass} p-6`}>
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
          <label className="block text-sm">
            <span className="mb-2 block font-medium text-foreground">Search</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className={inputClass}
              placeholder="Action, target ID, actor, or JSON detail"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-2 block font-medium text-foreground">
              Target type
            </span>
            <select
              value={targetFilter}
              onChange={(event) =>
                setTargetFilter(
                  event.target.value as (typeof TARGET_FILTERS)[number],
                )
              }
              className={selectClass}
            >
              {TARGET_FILTERS.map((option) => (
                <option key={option} value={option}>
                  {option === "all" ? "All targets" : option}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {error ? <FeedbackPanel tone="error" description={error} /> : null}

      <section className={`${sectionCardClass} p-6`}>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-foreground">
            Recent events
          </h2>
          <span className="text-xs uppercase tracking-[0.2em] text-zinc-400">
            Last 100
          </span>
        </div>

        {loading ? (
          <div className="mt-4 space-y-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-24 animate-pulse rounded-2xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900"
                aria-hidden
              />
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="mt-4">
            <FeedbackPanel description="No audit events match the current filters." />
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {filteredItems.map((item) => (
              <article
                key={item.id}
                className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {item.action_type.replaceAll("_", " ")}
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
                      {item.target_type} · {item.target_id}
                    </p>
                  </div>
                  <div className="text-right text-xs text-zinc-500 dark:text-zinc-400">
                    <p>{formatDateTime(item.created_at)}</p>
                    <p className="mt-1">
                      Admin {summarizeUser(item.admin_user_id)}
                    </p>
                  </div>
                </div>
                {item.details ? (
                  <pre className="mt-4 overflow-x-auto rounded-xl bg-zinc-950 p-3 text-xs text-zinc-100 dark:bg-black">
                    {JSON.stringify(item.details, null, 2)}
                  </pre>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
