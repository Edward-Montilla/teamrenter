"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AdminAuditFeed } from "@/components/admin/AdminAuditFeed";
import { AdminSummaryCard } from "@/components/admin/AdminSummaryCard";
import { PropertyForm } from "@/components/admin/PropertyForm";
import { FeedbackPanel } from "@/components/ui/FeedbackPanel";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import type {
  AdminOverviewResponse,
  AdminPropertyCreateInput,
  AdminPropertyListItem,
  AdminReviewModerationItem,
  ReviewStatus,
} from "@/lib/types";
import {
  destructiveButtonClass,
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

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString();
}

function formatDate(value: string | null): string {
  return value ? new Date(value).toLocaleDateString() : "—";
}

function summarizeUser(userId: string): string {
  return `${userId.slice(0, 8)}…${userId.slice(-4)}`;
}

function formatAddress(property: AdminPropertyListItem): string {
  const parts = [
    property.address_line1,
    property.address_line2,
    [property.city, property.province].filter(Boolean).join(" "),
    property.postal_code,
  ].filter(Boolean);
  return parts.join(", ");
}

function reviewStatusBadgeClass(status: ReviewStatus): string {
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

function propertyStatusBadgeClass(status: AdminPropertyListItem["status"]): string {
  return status === "active"
    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
    : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300";
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

export default function AdminCommandCenterPage() {
  const [reviewFilter, setReviewFilter] = useState<"all" | ReviewStatus>("pending");
  const [reviews, setReviews] = useState<AdminReviewModerationItem[]>([]);
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsError, setReviewsError] = useState<string | null>(null);
  const [reviewActionStatus, setReviewActionStatus] = useState<ReviewStatus | null>(null);
  const [reviewRefreshKey, setReviewRefreshKey] = useState(0);

  const [properties, setProperties] = useState<AdminPropertyListItem[]>([]);
  const [propertiesLoading, setPropertiesLoading] = useState(true);
  const [propertiesError, setPropertiesError] = useState<string | null>(null);
  const [propertyBanner, setPropertyBanner] = useState<{
    tone: "success" | "error";
    message: string;
  } | null>(null);
  const [propertyRefreshKey, setPropertyRefreshKey] = useState(0);
  const [propertyFormKey, setPropertyFormKey] = useState(0);
  const [togglingPropertyId, setTogglingPropertyId] = useState<string | null>(null);
  const [deletingPropertyId, setDeletingPropertyId] = useState<string | null>(null);

  const [activityRefreshKey, setActivityRefreshKey] = useState(0);
  const [overview, setOverview] = useState<AdminOverviewResponse["counts"] | null>(null);
  const [overviewError, setOverviewError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadReviews = async () => {
      setReviewsLoading(true);
      setReviewsError(null);

      try {
        const token = await getAccessToken();
        const params = new URLSearchParams();
        if (reviewFilter !== "all") {
          params.set("status", reviewFilter);
        }

        const res = await fetch(`/api/admin/reviews?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          throw new Error("Failed to load reviews.");
        }

        const data = (await res.json()) as { items?: AdminReviewModerationItem[] };
        if (!active) return;

        const nextReviews = data.items ?? [];
        setReviews(nextReviews);
        setSelectedReviewId((current) => {
          if (current && nextReviews.some((item) => item.id === current)) {
            return current;
          }
          return nextReviews[0]?.id ?? null;
        });
      } catch (error) {
        if (!active) return;
        setReviews([]);
        setSelectedReviewId(null);
        setReviewsError(
          error instanceof Error ? error.message : "Failed to load reviews.",
        );
      } finally {
        if (active) {
          setReviewsLoading(false);
        }
      }
    };

    void loadReviews();

    return () => {
      active = false;
    };
  }, [reviewFilter, reviewRefreshKey]);

  useEffect(() => {
    let active = true;

    const loadProperties = async () => {
      setPropertiesLoading(true);
      setPropertiesError(null);

      try {
        const token = await getAccessToken();
        const res = await fetch("/api/admin/properties", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          throw new Error(
            res.status === 403
              ? "Admin access is required."
              : "Failed to load properties.",
          );
        }

        const data = (await res.json()) as { items?: AdminPropertyListItem[] };
        if (!active) return;
        setProperties(data.items ?? []);
      } catch (error) {
        if (!active) return;
        setProperties([]);
        setPropertiesError(
          error instanceof Error ? error.message : "Failed to load properties.",
        );
      } finally {
        if (active) {
          setPropertiesLoading(false);
        }
      }
    };

    void loadProperties();

    return () => {
      active = false;
    };
  }, [propertyRefreshKey]);

  useEffect(() => {
    let active = true;

    const loadOverview = async () => {
      setOverviewError(null);

      try {
        const token = await getAccessToken();
        const res = await fetch("/api/admin/overview", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          throw new Error("Failed to load admin overview.");
        }

        const data = (await res.json()) as AdminOverviewResponse;
        if (!active) return;
        setOverview(data.counts);
      } catch (error) {
        if (!active) return;
        setOverview(null);
        setOverviewError(
          error instanceof Error ? error.message : "Failed to load admin overview.",
        );
      }
    };

    void loadOverview();

    return () => {
      active = false;
    };
  }, [activityRefreshKey]);

  const selectedReview = useMemo(
    () => reviews.find((item) => item.id === selectedReviewId) ?? null,
    [reviews, selectedReviewId],
  );

  const refreshPropertyArea = () => {
    setPropertyRefreshKey((value) => value + 1);
    setActivityRefreshKey((value) => value + 1);
  };

  const refreshReviewArea = () => {
    setReviewRefreshKey((value) => value + 1);
    setActivityRefreshKey((value) => value + 1);
  };

  const handleCreateProperty = async (
    data: AdminPropertyCreateInput | Record<string, unknown>,
  ) => {
    const token = await getAccessToken();
    const res = await fetch("/api/admin/properties", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data as AdminPropertyCreateInput),
    });

    if (!res.ok) {
      const json = (await res.json().catch(() => ({}))) as { message?: string };
      throw new Error(json.message ?? "Failed to create property.");
    }

    const propertyName =
      typeof data.display_name === "string" && data.display_name.trim()
        ? data.display_name.trim()
        : "Property";

    setPropertyBanner({ tone: "success", message: `Created ${propertyName}.` });
    setPropertyFormKey((value) => value + 1);
    refreshPropertyArea();
  };

  const handleToggleProperty = async (property: AdminPropertyListItem) => {
    setPropertyBanner(null);
    setTogglingPropertyId(property.id);

    try {
      const token = await getAccessToken();
      const nextStatus = property.status === "active" ? "inactive" : "active";
      const res = await fetch(`/api/admin/properties/${property.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (!res.ok) {
        const json = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(json.message ?? "Failed to update property.");
      }

      setPropertyBanner({
        tone: "success",
        message: `${property.display_name} is now ${
          nextStatus === "active" ? "active" : "inactive"
        }.`,
      });
      refreshPropertyArea();
    } catch (error) {
      setPropertyBanner({
        tone: "error",
        message:
          error instanceof Error ? error.message : "Failed to update property.",
      });
    } finally {
      setTogglingPropertyId(null);
    }
  };

  const handleDeleteProperty = async (property: AdminPropertyListItem) => {
    const confirmed = window.confirm(
      `Delete "${property.display_name}"? This also removes its reviews, aggregates, and related admin records.`,
    );

    if (!confirmed) {
      return;
    }

    setPropertyBanner(null);
    setDeletingPropertyId(property.id);

    try {
      const token = await getAccessToken();
      const res = await fetch(`/api/admin/properties/${property.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const json = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(json.message ?? "Failed to delete property.");
      }

      setPropertyBanner({
        tone: "success",
        message: `Deleted ${property.display_name}.`,
      });
      refreshPropertyArea();
    } catch (error) {
      setPropertyBanner({
        tone: "error",
        message:
          error instanceof Error ? error.message : "Failed to delete property.",
      });
    } finally {
      setDeletingPropertyId(null);
    }
  };

  const handleReviewStatusUpdate = async (status: ReviewStatus) => {
    if (!selectedReview) {
      return;
    }

    setReviewActionStatus(status);
    setReviewsError(null);

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

      refreshReviewArea();
    } catch (error) {
      setReviewsError(
        error instanceof Error ? error.message : "Failed to update review.",
      );
    } finally {
      setReviewActionStatus(null);
    }
  };

  return (
    <div className="space-y-8">
      <section className={`${sectionCardClass} p-6 sm:p-8`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500 dark:text-zinc-400">
              Admin workspace
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
              Command center
            </h1>
            <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              Audit incoming reviews, create verified property records, and
              remove listings that should no longer appear in the product.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/admin/users" className={secondaryButtonClass}>
              Users
            </Link>
            <Link href="/admin/audit" className={secondaryButtonClass}>
              Audit history
            </Link>
            <Link href="/admin/reviews" className={secondaryButtonClass}>
              Full review queue
            </Link>
            <Link href="/admin/properties" className={secondaryButtonClass}>
              Full property catalog
            </Link>
          </div>
        </div>
      </section>

      {overviewError ? (
        <FeedbackPanel tone="error" description={overviewError} />
      ) : overview ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <AdminSummaryCard
            label="Pending reviews"
            value={overview.pending_reviews}
            description="Submissions waiting for a moderation decision."
            href="/admin/reviews"
            ctaLabel="Review queue"
          />
          <AdminSummaryCard
            label="Pending insights"
            value={overview.pending_insights}
            description="Generated public summaries that still need approval."
            href="/admin/insights"
            ctaLabel="Moderate insights"
          />
          <AdminSummaryCard
            label="Pending access"
            value={overview.pending_access_requests}
            description="Users waiting on an explicit admin-role decision."
            href="/admin/access-requests"
            ctaLabel="Access requests"
          />
          <AdminSummaryCard
            label="Inactive properties"
            value={overview.inactive_properties}
            description={`${
              overview.active_properties
            } active properties are live in browse and review flows.`}
            href="/admin/properties"
            ctaLabel="Property catalog"
          />
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(360px,0.9fr)]">
        <section className={`${sectionCardClass} p-6`}>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                Review audit
              </h2>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Inspect private review text and moderate trust-signal changes
                without leaving this workspace.
              </p>
            </div>
            <label className="block text-sm">
              <span className="mb-2 block font-medium text-foreground">
                Filter
              </span>
              <select
                value={reviewFilter}
                onChange={(event) =>
                  setReviewFilter(event.target.value as "all" | ReviewStatus)
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
          </div>

          {reviewsError ? (
            <div className="mt-6">
              <FeedbackPanel tone="error" description={reviewsError} />
            </div>
          ) : null}

          {reviewsLoading ? (
            <div className="mt-6 space-y-3">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-20 animate-pulse rounded-2xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900"
                  aria-hidden
                />
              ))}
            </div>
          ) : reviews.length === 0 ? (
            <div className="mt-6">
              <FeedbackPanel
                description="No reviews match the current filter."
                primaryAction={{ label: "Open full queue", href: "/admin/reviews" }}
              />
            </div>
          ) : (
            <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(300px,0.9fr)]">
              <div className="overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800">
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
                      {reviews.map((review) => (
                        <tr
                          key={review.id}
                          className={`cursor-pointer transition hover:bg-zinc-50 dark:hover:bg-zinc-900 ${
                            review.id === selectedReviewId
                              ? "bg-zinc-50 dark:bg-zinc-900"
                              : ""
                          }`}
                          onClick={() => setSelectedReviewId(review.id)}
                        >
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${reviewStatusBadgeClass(review.status)}`}
                            >
                              {review.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-foreground">
                            {review.property_display_name}
                          </td>
                          <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">
                            {summarizeUser(review.user_id)}
                          </td>
                          <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">
                            {formatDateTime(review.created_at)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-200 p-5 dark:border-zinc-800">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">
                      Review detail
                    </h3>
                    <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                      Private renter text stays visible only in admin tools.
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
                  <p className="mt-6 text-sm text-zinc-500 dark:text-zinc-400">
                    Select a review to inspect and moderate it.
                  </p>
                ) : (
                  <div className="mt-6 space-y-5">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {selectedReview.property_display_name}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-3 text-sm text-zinc-500 dark:text-zinc-400">
                        <span>User {summarizeUser(selectedReview.user_id)}</span>
                        <span>Created {formatDateTime(selectedReview.created_at)}</span>
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
                      <div className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
                        <p className="text-zinc-500 dark:text-zinc-400">
                          Management
                        </p>
                        <p className="mt-1 font-semibold text-foreground">
                          {selectedReview.management_responsiveness} / 5
                        </p>
                      </div>
                      <div className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
                        <p className="text-zinc-500 dark:text-zinc-400">
                          Maintenance
                        </p>
                        <p className="mt-1 font-semibold text-foreground">
                          {selectedReview.maintenance_timeliness} / 5
                        </p>
                      </div>
                      <div className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
                        <p className="text-zinc-500 dark:text-zinc-400">
                          Listing accuracy
                        </p>
                        <p className="mt-1 font-semibold text-foreground">
                          {selectedReview.listing_accuracy} / 5
                        </p>
                      </div>
                      <div className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
                        <p className="text-zinc-500 dark:text-zinc-400">Fees</p>
                        <p className="mt-1 font-semibold text-foreground">
                          {selectedReview.fee_transparency} / 5
                        </p>
                      </div>
                      <div className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
                        <p className="text-zinc-500 dark:text-zinc-400">Lease</p>
                        <p className="mt-1 font-semibold text-foreground">
                          {selectedReview.lease_clarity} / 5
                        </p>
                      </div>
                      <div className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
                        <p className="text-zinc-500 dark:text-zinc-400">Tenancy</p>
                        <p className="mt-1 text-foreground">
                          {formatDate(selectedReview.tenancy_start)} to{" "}
                          {formatDate(selectedReview.tenancy_end)}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
                      <p className="text-sm font-medium text-foreground">
                        Private text input
                      </p>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-zinc-700 dark:text-zinc-300">
                        {selectedReview.text_input?.trim() ||
                          "No private text provided."}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        disabled={
                          reviewActionStatus !== null ||
                          selectedReview.status === "approved"
                        }
                        onClick={() => void handleReviewStatusUpdate("approved")}
                        className={primaryButtonClass}
                      >
                        {reviewActionStatus === "approved"
                          ? "Approving…"
                          : "Approve"}
                      </button>
                      <button
                        type="button"
                        disabled={
                          reviewActionStatus !== null ||
                          selectedReview.status === "rejected"
                        }
                        onClick={() => void handleReviewStatusUpdate("rejected")}
                        className={destructiveButtonClass}
                      >
                        {reviewActionStatus === "rejected"
                          ? "Rejecting…"
                          : "Reject"}
                      </button>
                      <button
                        type="button"
                        disabled={
                          reviewActionStatus !== null ||
                          selectedReview.status === "removed"
                        }
                        onClick={() => void handleReviewStatusUpdate("removed")}
                        className={secondaryButtonClass}
                      >
                        {reviewActionStatus === "removed"
                          ? "Removing…"
                          : "Remove"}
                      </button>
                      <button
                        type="button"
                        disabled={
                          reviewActionStatus !== null ||
                          selectedReview.status === "pending"
                        }
                        onClick={() => void handleReviewStatusUpdate("pending")}
                        className={secondaryButtonClass}
                      >
                        {reviewActionStatus === "pending"
                          ? "Resetting…"
                          : "Reset to pending"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>

        <section className={`${sectionCardClass} p-6`}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                Create property
              </h2>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Add a new listing without leaving the admin command center.
              </p>
            </div>
            <Link href="/admin/properties/new" className={secondaryButtonClass}>
              Full-page form
            </Link>
          </div>

          {propertyBanner ? (
            <div className="mt-6">
              <FeedbackPanel
                tone={propertyBanner.tone}
                description={propertyBanner.message}
              />
            </div>
          ) : null}

          <div className="mt-6">
            <PropertyForm
              key={propertyFormKey}
              mode="create"
              cancelHref="/admin"
              onSubmit={handleCreateProperty}
            />
          </div>
        </section>
      </div>

      <section className={`${sectionCardClass} p-6`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              Property management
            </h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Activate, deactivate, edit, or permanently delete property
              records from the live catalog.
            </p>
          </div>
          <Link href="/admin/properties" className={secondaryButtonClass}>
            Open full catalog
          </Link>
        </div>

        {propertiesLoading ? (
          <div className="mt-6 space-y-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-20 animate-pulse rounded-2xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900"
                aria-hidden
              />
            ))}
          </div>
        ) : propertiesError ? (
          <div className="mt-6">
            <FeedbackPanel tone="error" description={propertiesError} />
          </div>
        ) : properties.length === 0 ? (
          <div className="mt-6">
            <FeedbackPanel
              title="No properties yet"
              description="Create the first property so it appears in browse and review flows."
            />
          </div>
        ) : (
          <div className="mt-6 overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800">
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
                  {properties.map((property) => (
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
                            href={`/admin/properties/${property.id}/edit`}
                            className={secondaryButtonClass}
                          >
                            Edit
                          </Link>
                          <button
                            type="button"
                            onClick={() => void handleToggleProperty(property)}
                            disabled={
                              togglingPropertyId === property.id ||
                              deletingPropertyId === property.id
                            }
                            className={secondaryButtonClass}
                          >
                            {togglingPropertyId === property.id
                              ? "Saving…"
                              : property.status === "active"
                                ? "Deactivate"
                                : "Activate"}
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDeleteProperty(property)}
                            disabled={
                              deletingPropertyId === property.id ||
                              togglingPropertyId === property.id
                            }
                            className={destructiveButtonClass}
                          >
                            {deletingPropertyId === property.id
                              ? "Deleting…"
                              : "Delete"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      <AdminAuditFeed
        title="Recent admin activity"
        targetTypes={["review", "property"]}
        refreshKey={activityRefreshKey}
      />
    </div>
  );
}
