"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AdminSummaryCard } from "@/components/admin/AdminSummaryCard";
import { FeedbackPanel } from "@/components/ui/FeedbackPanel";
import { adminFetch } from "@/lib/admin-client";
import {
  formatDateTime,
  propertyStatusBadgeClass,
} from "@/lib/admin-display";
import type { AdminPropertyListItem } from "@/lib/types";
import {
  destructiveButtonClass,
  inputClass,
  primaryButtonClass,
  sectionCardClass,
  secondaryButtonClass,
  selectClass,
} from "@/lib/ui";

function formatAddress(p: AdminPropertyListItem): string {
  const parts = [
    p.address_line1,
    p.address_line2,
    [p.city, p.province].filter(Boolean).join(" "),
    p.postal_code,
  ].filter(Boolean);
  return parts.join(", ");
}

type SortOption = "updated_desc" | "updated_asc" | "name_asc";

export default function AdminPropertiesPage() {
  const [items, setItems] = useState<AdminPropertyListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{
    tone: "success" | "error";
    message: string;
  } | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">(
    "all",
  );
  const [sortBy, setSortBy] = useState<SortOption>("updated_desc");

  const fetchList = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminFetch<{ items: AdminPropertyListItem[] }>(
        "/api/admin/properties",
      );
      setItems(data.items ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load properties");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchList();
  }, []);

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const nextItems = items.filter((item) => {
      if (statusFilter !== "all" && item.status !== statusFilter) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      return (
        item.display_name.toLowerCase().includes(normalizedQuery) ||
        formatAddress(item).toLowerCase().includes(normalizedQuery) ||
        (item.management_company ?? "").toLowerCase().includes(normalizedQuery)
      );
    });

    return nextItems.toSorted((left, right) => {
      switch (sortBy) {
        case "updated_asc":
          return left.updated_at.localeCompare(right.updated_at);
        case "name_asc":
          return left.display_name.localeCompare(right.display_name);
        default:
          return right.updated_at.localeCompare(left.updated_at);
      }
    });
  }, [items, query, sortBy, statusFilter]);

  const summary = useMemo(
    () => ({
      total: items.length,
      active: items.filter((item) => item.status === "active").length,
      inactive: items.filter((item) => item.status === "inactive").length,
      visible: filteredItems.length,
    }),
    [filteredItems.length, items],
  );

  const toggleStatus = async (property: AdminPropertyListItem) => {
    setStatusMessage(null);
    setTogglingId(property.id);
    try {
      const nextStatus = property.status === "active" ? "inactive" : "active";
      await adminFetch(`/api/admin/properties/${property.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      });
      await fetchList();
      setStatusMessage({
        tone: "success",
        message: `${property.display_name} is now ${nextStatus}.`,
      });
    } catch (err) {
      setStatusMessage({
        tone: "error",
        message: err instanceof Error ? err.message : "Failed to update property.",
      });
    } finally {
      setTogglingId(null);
    }
  };

  const deleteProperty = async (property: AdminPropertyListItem) => {
    const confirmed = window.confirm(
      `Delete "${property.display_name}"? This also removes its reviews, aggregates, and related admin records.`,
    );
    if (!confirmed) return;

    setStatusMessage(null);
    setDeletingId(property.id);
    try {
      await adminFetch(`/api/admin/properties/${property.id}`, {
        method: "DELETE",
      });
      await fetchList();
      setStatusMessage({
        tone: "success",
        message: `Deleted ${property.display_name}.`,
      });
    } catch (err) {
      setStatusMessage({
        tone: "error",
        message: err instanceof Error ? err.message : "Failed to delete property.",
      });
    } finally {
      setDeletingId(null);
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
              Property catalog
            </h1>
            <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              Search the catalog, manage visibility, and jump directly into photo
              registration or record edits from one operational view.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/admin/audit" className={secondaryButtonClass}>
              Audit history
            </Link>
            <Link href="/admin/properties/new" className={primaryButtonClass}>
              New property
            </Link>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminSummaryCard
          label="Total properties"
          value={summary.total}
          description="Every property record currently in the admin catalog."
        />
        <AdminSummaryCard
          label="Active"
          value={summary.active}
          description="Properties that are visible on the public browse and detail pages."
        />
        <AdminSummaryCard
          label="Inactive"
          value={summary.inactive}
          description="Properties hidden from public flows until an admin reactivates them."
        />
        <AdminSummaryCard
          label="Filtered view"
          value={summary.visible}
          description="Rows visible after applying the current search and status filters."
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
              placeholder="Property name, address, or management company"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-2 block font-medium text-foreground">Status</span>
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as "all" | "active" | "inactive")
              }
              className={selectClass}
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
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
              <option value="updated_asc">Oldest updates</option>
              <option value="name_asc">Name A-Z</option>
            </select>
          </label>
        </div>
      </section>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-20 animate-pulse rounded-2xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900"
              aria-hidden
            />
          ))}
        </div>
      ) : null}

      {error && !loading ? (
        <FeedbackPanel
          tone="error"
          description={error}
          primaryAction={{ label: "Retry", onClick: fetchList }}
        />
      ) : null}

      {statusMessage && !loading ? (
        <FeedbackPanel
          tone={statusMessage.tone}
          description={statusMessage.message}
        />
      ) : null}

      {!loading && !error && items.length === 0 ? (
        <FeedbackPanel
          title="No properties yet"
          description="Create the first property so it can appear on the public site and in the review flow."
          primaryAction={{ label: "New property", href: "/admin/properties/new" }}
        />
      ) : null}

      {!loading && !error && items.length > 0 ? (
        <div className={`${sectionCardClass} overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
              <thead className="bg-zinc-50 dark:bg-zinc-900">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                    Address
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                    Management
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                    Updated
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {filteredItems.map((property) => (
                  <tr key={property.id} className="bg-white dark:bg-zinc-950">
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${propertyStatusBadgeClass(property.status)}`}
                      >
                        {property.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-foreground">
                      {property.display_name}
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">
                      {formatAddress(property)}
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">
                      {property.management_company ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">
                      {formatDateTime(property.updated_at)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex flex-wrap justify-end gap-2">
                        <Link
                          href={`/properties/${property.id}`}
                          className={secondaryButtonClass}
                        >
                          View
                        </Link>
                        <Link
                          href={`/admin/properties/${property.id}/photos`}
                          className={secondaryButtonClass}
                        >
                          Photos
                        </Link>
                        <Link
                          href={`/admin/properties/${property.id}/edit`}
                          className={secondaryButtonClass}
                        >
                          Edit
                        </Link>
                        <button
                          type="button"
                          onClick={() => void toggleStatus(property)}
                          disabled={
                            togglingId === property.id || deletingId === property.id
                          }
                          className={secondaryButtonClass}
                        >
                          {togglingId === property.id
                            ? "Saving…"
                            : property.status === "active"
                              ? "Deactivate"
                              : "Activate"}
                        </button>
                        <button
                          type="button"
                          onClick={() => void deleteProperty(property)}
                          disabled={
                            deletingId === property.id || togglingId === property.id
                          }
                          className={destructiveButtonClass}
                        >
                          {deletingId === property.id ? "Deleting…" : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}
