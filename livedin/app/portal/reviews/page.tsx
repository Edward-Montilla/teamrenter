"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { FeedbackPanel } from "@/components/ui/FeedbackPanel";
import {
  fetchPortfolioProperties,
  fetchPortfolioReviews,
  submitReviewResponse,
} from "@/lib/portal-client";
import type { PortfolioPropertyItem } from "@/lib/types";
import { inputClass, primaryButtonClass, secondaryButtonClass, selectClass, textareaClass } from "@/lib/ui";

type ReviewRow = {
  id: string;
  property_id: string;
  status: string;
  management_responsiveness: number;
  maintenance_timeliness: number;
  listing_accuracy: number;
  fee_transparency: number;
  lease_clarity: number;
  text_input: string | null;
  created_at: string;
};

type MergedReview = ReviewRow & { property_name: string };

function avgScore(r: ReviewRow): number {
  return (
    (r.management_responsiveness +
      r.maintenance_timeliness +
      r.listing_accuracy +
      r.fee_transparency +
      r.lease_clarity) /
    5
  );
}

export default function PortalReviewsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [properties, setProperties] = useState<PortfolioPropertyItem[]>([]);
  const [reviews, setReviews] = useState<MergedReview[]>([]);
  const [filterProperty, setFilterProperty] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [minRating, setMinRating] = useState("");
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [responseBody, setResponseBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const portfolio = await fetchPortfolioProperties();
      setProperties(portfolio.properties);
      const lists = await Promise.all(
        portfolio.properties.map(async (p) => {
          const { items } = await fetchPortfolioReviews(p.id);
          return (items as ReviewRow[]).map((r) => ({
            ...r,
            property_name: p.display_name,
          }));
        }),
      );
      const merged = lists.flat().sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
      setReviews(merged);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load reviews");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    return reviews.filter((r) => {
      if (filterProperty && r.property_id !== filterProperty) return false;
      const t = new Date(r.created_at).getTime();
      if (dateFrom && t < new Date(dateFrom).getTime()) return false;
      if (dateTo && t > new Date(dateTo).getTime() + 86400000) return false;
      if (minRating) {
        const min = Number.parseFloat(minRating);
        if (!Number.isNaN(min) && avgScore(r) < min) return false;
      }
      return true;
    });
  }, [reviews, filterProperty, dateFrom, dateTo, minRating]);

  const handleSubmitResponse = async (reviewId: string) => {
    const body = responseBody.trim();
    if (body.length === 0 || body.length > 1000) return;
    setSubmitting(true);
    try {
      await submitReviewResponse(reviewId, { body });
      setRespondingId(null);
      setResponseBody("");
    } catch {
      /* keep form open */
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <p className="text-sm" style={{ color: "var(--theme-muted)" }}>Loading reviews…</p>;
  }

  if (error) {
    return (
      <FeedbackPanel
        tone="error"
        title="Could not load reviews"
        description={error}
        primaryAction={{ label: "Retry", onClick: () => void load() }}
      />
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Review feed"
        subtitle="Portfolio reviews with filters and draft responses for moderation."
      />

      <div className="grid gap-4 rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="text-xs font-medium" style={{ color: "var(--theme-muted)" }} htmlFor="rev-prop">
            Property
          </label>
          <select
            id="rev-prop"
            className={`${selectClass} mt-1 w-full`}
            value={filterProperty}
            onChange={(e) => setFilterProperty(e.target.value)}
          >
            <option value="">All</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.display_name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium" style={{ color: "var(--theme-muted)" }} htmlFor="rev-from">
            From
          </label>
          <input
            id="rev-from"
            type="date"
            className={`${inputClass} mt-1`}
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs font-medium" style={{ color: "var(--theme-muted)" }} htmlFor="rev-to">
            To
          </label>
          <input
            id="rev-to"
            type="date"
            className={`${inputClass} mt-1`}
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs font-medium" style={{ color: "var(--theme-muted)" }} htmlFor="rev-min">
            Min avg score (0–5)
          </label>
          <input
            id="rev-min"
            type="number"
            min={0}
            max={5}
            step={0.5}
            className={`${inputClass} mt-1`}
            value={minRating}
            onChange={(e) => setMinRating(e.target.value)}
            placeholder="Any"
          />
        </div>
      </div>

      <ul className="space-y-4">
        {filtered.map((r) => (
          <li
            key={r.id}
            className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-foreground">{r.property_name}</p>
                <p className="text-xs" style={{ color: "var(--theme-muted)" }}>
                  Verified renter · {new Date(r.created_at).toLocaleString()} · Status: {r.status}
                </p>
              </div>
              <p className="text-sm tabular-nums" style={{ color: "var(--theme-muted)" }}>
                Avg {avgScore(r).toFixed(1)}/5
              </p>
            </div>
            <p className="mt-3 line-clamp-3 text-sm text-foreground">
              {r.text_input ? `“${r.text_input.slice(0, 280)}${r.text_input.length > 280 ? "…" : ""}”` : "No private text on file."}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                className={secondaryButtonClass}
                onClick={() => {
                  setRespondingId(respondingId === r.id ? null : r.id);
                  setResponseBody("");
                }}
              >
                Respond
              </button>
            </div>
            {respondingId === r.id ? (
              <div className="mt-4 space-y-3 border-t border-zinc-200 pt-4 dark:border-zinc-800">
                <label htmlFor={`resp-${r.id}`} className="text-sm font-medium">
                  Draft response (max 1000 characters, submitted as pending)
                </label>
                <textarea
                  id={`resp-${r.id}`}
                  className={textareaClass}
                  rows={4}
                  maxLength={1000}
                  value={responseBody}
                  onChange={(e) => setResponseBody(e.target.value)}
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className={primaryButtonClass}
                    disabled={submitting || responseBody.trim().length === 0}
                    onClick={() => void handleSubmitResponse(r.id)}
                  >
                    Submit draft
                  </button>
                  <button
                    type="button"
                    className={secondaryButtonClass}
                    onClick={() => setRespondingId(null)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : null}
          </li>
        ))}
      </ul>

      {filtered.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--theme-muted)" }}>
          No reviews match your filters.
        </p>
      ) : null}
    </div>
  );
}
