"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { PublicSiteHeader } from "@/components/auth/PublicSiteHeader";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { PageHeader } from "@/components/PageHeader";
import { PropertyCard } from "@/components/PropertyCard";
import { FeedbackPanel } from "@/components/ui/FeedbackPanel";
import { fetchShortlist } from "@/lib/portal-client";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import type { ReviewStatus, UserShortlistItem } from "@/lib/types";
import type { UiListState } from "@/lib/types";
import { pageContainerClass, sectionCardClass, secondaryButtonClass } from "@/lib/ui";

type ReviewRow = {
  id: string;
  property_id: string;
  property_display_name: string;
  status: ReviewStatus;
  created_at: string;
  updated_at: string;
};

function statusLabel(s: ReviewStatus): string {
  switch (s) {
    case "pending":
      return "Pending moderation";
    case "approved":
      return "Approved";
    case "rejected":
      return "Rejected";
    case "removed":
      return "Removed";
    default:
      return s;
  }
}

export default function DashboardPage() {
  const [reviewsState, setReviewsState] = useState<UiListState>("loading");
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [shortState, setShortState] = useState<UiListState>("loading");
  const [shortlist, setShortlist] = useState<UserShortlistItem[]>([]);

  const loadReviews = useCallback(async () => {
    setReviewsState("loading");
    const supabase = getSupabaseBrowserClient();
    const {
      data: { session },
    } = await supabase?.auth.getSession() ?? { data: { session: null } };
    if (!session?.access_token) {
      setReviewsState("error");
      return;
    }
    try {
      const res = await fetch("/api/user/reviews", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) {
        setReviewsState("error");
        return;
      }
      const body = (await res.json()) as { items: ReviewRow[] };
      setReviews(body.items ?? []);
      setReviewsState((body.items ?? []).length > 0 ? "ready" : "empty");
    } catch {
      setReviewsState("error");
    }
  }, []);

  const loadShortlist = useCallback(async () => {
    setShortState("loading");
    try {
      const { items } = await fetchShortlist();
      setShortlist(items);
      setShortState(items.length > 0 ? "ready" : "empty");
    } catch {
      setShortState("error");
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void loadReviews();
      void loadShortlist();
    });
  }, [loadReviews, loadShortlist]);

  return (
    <div className="min-h-screen bg-zinc-50 text-foreground dark:bg-zinc-950">
      <PublicSiteHeader />
      <main className={`${pageContainerClass} py-8 sm:py-10`}>
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Dashboard" },
          ]}
        />

        <div className="mt-6 space-y-10">
          <PageHeader
            title="Dashboard"
            subtitle="Your submitted reviews and shortlisted properties."
          />

          <section className={`${sectionCardClass} p-6 sm:p-8`}>
            <h2 className="text-xl font-semibold text-foreground">My reviews</h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Status reflects moderation on your structured renter submissions.
            </p>

            {reviewsState === "loading" ? (
              <p className="mt-6 text-sm text-zinc-500">Loading…</p>
            ) : null}
            {reviewsState === "error" ? (
              <div className="mt-6">
                <FeedbackPanel
                  tone="error"
                  title="Could not load reviews"
                  description="Try again in a moment."
                  primaryAction={{ label: "Retry", onClick: () => void loadReviews() }}
                />
              </div>
            ) : null}
            {reviewsState === "empty" ? (
              <p className="mt-6 text-sm text-zinc-600 dark:text-zinc-400">
                You have not submitted a review yet.{" "}
                <Link href="/submit-review/new" className="font-medium text-[var(--theme-primary)] hover:underline">
                  Start one
                </Link>
                .
              </p>
            ) : null}
            {reviewsState === "ready" ? (
              <ul className="mt-6 space-y-4">
                {reviews.map((r) => (
                  <li
                    key={r.id}
                    className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Link
                        href={`/properties/${r.property_id}`}
                        className="font-medium text-[var(--theme-primary)] hover:underline"
                      >
                        {r.property_display_name}
                      </Link>
                      <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                        {statusLabel(r.status)}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                      Updated {new Date(r.updated_at).toLocaleDateString()}
                    </p>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>

          <section className={`${sectionCardClass} p-6 sm:p-8`}>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-foreground">My shortlist</h2>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  Properties you saved with the heart icon on listing cards.
                </p>
              </div>
              <Link href="/" className={secondaryButtonClass}>
                Browse more
              </Link>
            </div>

            {shortState === "loading" ? (
              <p className="mt-6 text-sm text-zinc-500">Loading…</p>
            ) : null}
            {shortState === "error" ? (
              <div className="mt-6">
                <FeedbackPanel
                  tone="error"
                  title="Could not load shortlist"
                  description="Try again in a moment."
                  primaryAction={{ label: "Retry", onClick: () => void loadShortlist() }}
                />
              </div>
            ) : null}
            {shortState === "empty" ? (
              <p className="mt-6 text-sm text-zinc-600 dark:text-zinc-400">
                No saved properties yet. Tap the heart on a property card while signed in.
              </p>
            ) : null}
            {shortState === "ready" ? (
              <div className="mt-6 space-y-4">
                {shortlist.map((s) => (
                  <PropertyCard
                    key={s.property_id}
                    item={{
                      id: s.property_id,
                      display_name: s.display_name,
                      address_line1: s.address_line1,
                      city: s.city,
                      province: "",
                      management_company: null,
                      trustscore_display_0_5: s.trustscore_display_0_5,
                      review_count: 0,
                    }}
                    initialShortlisted
                  />
                ))}
              </div>
            ) : null}
          </section>
        </div>
      </main>
    </div>
  );
}
