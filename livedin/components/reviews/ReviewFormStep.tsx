"use client";

import { useState } from "react";
import type { ReviewCreateInput } from "@/lib/types";
import type { MockPropertyForReview } from "@/lib/mocks/properties";
import {
  validateReviewCreateInput,
  TEXT_INPUT_MAX,
  type ReviewValidationErrors,
} from "@/lib/validation/review";

const METRIC_KEYS = [
  "management_responsiveness",
  "maintenance_timeliness",
  "listing_accuracy",
  "fee_transparency",
  "lease_clarity",
] as const;

const METRIC_LABELS: Record<(typeof METRIC_KEYS)[number], string> = {
  management_responsiveness: "Management responsiveness",
  maintenance_timeliness: "Maintenance timeliness",
  listing_accuracy: "Listing accuracy",
  fee_transparency: "Fee transparency",
  lease_clarity: "Lease clarity",
};

type ReviewFormStepProps = {
  property: MockPropertyForReview;
  onSubmit: (data: ReviewCreateInput) => void | Promise<void>;
  onBack?: () => void;
};

function formatAddress(p: MockPropertyForReview): string {
  const parts = [p.address_line1, p.city, p.province].filter(Boolean);
  return parts.join(", ");
}

export function ReviewFormStep({
  property,
  onSubmit,
  onBack,
}: ReviewFormStepProps) {
  const [metrics, setMetrics] = useState<Record<(typeof METRIC_KEYS)[number], number | "">>({
    management_responsiveness: "",
    maintenance_timeliness: "",
    listing_accuracy: "",
    fee_transparency: "",
    lease_clarity: "",
  });
  const [textInput, setTextInput] = useState("");
  const [tenancyStart, setTenancyStart] = useState("");
  const [tenancyEnd, setTenancyEnd] = useState("");
  const [errors, setErrors] = useState<ReviewValidationErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const handleMetricChange = (key: (typeof METRIC_KEYS)[number], value: string) => {
    const num = value === "" ? "" : parseInt(value, 10);
    if (num === "" || (Number.isInteger(num) && num >= 0 && num <= 5)) {
      setMetrics((prev) => ({ ...prev, [key]: num }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Partial<ReviewCreateInput> = {
      property_id: property.id,
      management_responsiveness:
        metrics.management_responsiveness === ""
          ? undefined
          : (metrics.management_responsiveness as 0 | 1 | 2 | 3 | 4 | 5),
      maintenance_timeliness:
        metrics.maintenance_timeliness === ""
          ? undefined
          : (metrics.maintenance_timeliness as 0 | 1 | 2 | 3 | 4 | 5),
      listing_accuracy:
        metrics.listing_accuracy === ""
          ? undefined
          : (metrics.listing_accuracy as 0 | 1 | 2 | 3 | 4 | 5),
      fee_transparency:
        metrics.fee_transparency === ""
          ? undefined
          : (metrics.fee_transparency as 0 | 1 | 2 | 3 | 4 | 5),
      lease_clarity:
        metrics.lease_clarity === ""
          ? undefined
          : (metrics.lease_clarity as 0 | 1 | 2 | 3 | 4 | 5),
      text_input: textInput.trim() || null,
      tenancy_start: tenancyStart.trim() || null,
      tenancy_end: tenancyEnd.trim() || null,
    };

    const { valid, errors: nextErrors } = validateReviewCreateInput(payload);
    setErrors(nextErrors);
    if (!valid) return;

    setSubmitting(true);
    try {
      const fullPayload: ReviewCreateInput = {
        property_id: property.id,
        management_responsiveness: (payload.management_responsiveness ?? 0) as 0 | 1 | 2 | 3 | 4 | 5,
        maintenance_timeliness: (payload.maintenance_timeliness ?? 0) as 0 | 1 | 2 | 3 | 4 | 5,
        listing_accuracy: (payload.listing_accuracy ?? 0) as 0 | 1 | 2 | 3 | 4 | 5,
        fee_transparency: (payload.fee_transparency ?? 0) as 0 | 1 | 2 | 3 | 4 | 5,
        lease_clarity: (payload.lease_clarity ?? 0) as 0 | 1 | 2 | 3 | 4 | 5,
        text_input: payload.text_input ?? null,
        tenancy_start: payload.tenancy_start ?? null,
        tenancy_end: payload.tenancy_end ?? null,
      };
      await Promise.resolve(onSubmit(fullPayload));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-foreground">Review — Form</h2>
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-900">
        <p className="font-medium text-foreground">{property.display_name}</p>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {formatAddress(property)}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <p className="mb-3 text-sm font-medium text-foreground">
            Rate the following (0–5, required)
          </p>
          <div className="space-y-4">
            {METRIC_KEYS.map((key) => (
              <div key={key}>
                <label
                  htmlFor={`metric-${key}`}
                  className="block text-sm text-zinc-700 dark:text-zinc-300"
                >
                  {METRIC_LABELS[key]}
                </label>
                <input
                  id={`metric-${key}`}
                  type="number"
                  min={0}
                  max={5}
                  step={1}
                  value={metrics[key] === "" ? "" : metrics[key]}
                  onChange={(e) => handleMetricChange(key, e.target.value)}
                  className="mt-1 w-20 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-600 dark:bg-zinc-900 dark:focus:ring-zinc-500"
                  aria-invalid={Boolean(errors[key])}
                  aria-describedby={errors[key] ? `error-${key}` : undefined}
                />
                {errors[key] && (
                  <p
                    id={`error-${key}`}
                    className="mt-1 text-sm text-red-600 dark:text-red-400"
                    role="alert"
                  >
                    {errors[key]}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        <div>
          <label
            htmlFor="text_input"
            className="block text-sm font-medium text-foreground"
          >
            Private notes (optional, max {TEXT_INPUT_MAX} characters)
          </label>
          <textarea
            id="text_input"
            value={textInput}
            onChange={(e) =>
              setTextInput(e.target.value.slice(0, TEXT_INPUT_MAX))
            }
            maxLength={TEXT_INPUT_MAX}
            rows={4}
            className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-600 dark:bg-zinc-900 dark:focus:ring-zinc-500"
            aria-invalid={Boolean(errors.text_input)}
            aria-describedby={errors.text_input ? "error-text_input" : undefined}
          />
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            {textInput.length}/{TEXT_INPUT_MAX}
          </p>
          {errors.text_input && (
            <p
              id="error-text_input"
              className="mt-1 text-sm text-red-600 dark:text-red-400"
              role="alert"
            >
              {errors.text_input}
            </p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="tenancy_start"
              className="block text-sm font-medium text-foreground"
            >
              Tenancy start (optional)
            </label>
            <input
              id="tenancy_start"
              type="date"
              value={tenancyStart}
              onChange={(e) => setTenancyStart(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-600 dark:bg-zinc-900 dark:focus:ring-zinc-500"
              aria-invalid={Boolean(errors.tenancy_start)}
            />
            {errors.tenancy_start && (
              <p
                className="mt-1 text-sm text-red-600 dark:text-red-400"
                role="alert"
              >
                {errors.tenancy_start}
              </p>
            )}
          </div>
          <div>
            <label
              htmlFor="tenancy_end"
              className="block text-sm font-medium text-foreground"
            >
              Tenancy end (optional)
            </label>
            <input
              id="tenancy_end"
              type="date"
              value={tenancyEnd}
              onChange={(e) => setTenancyEnd(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-600 dark:bg-zinc-900 dark:focus:ring-zinc-500"
              aria-invalid={Boolean(errors.tenancy_end)}
            />
            {errors.tenancy_end && (
              <p
                className="mt-1 text-sm text-red-600 dark:text-red-400"
                role="alert"
              >
                {errors.tenancy_end}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-foreground hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:hover:bg-zinc-800"
            >
              Back
            </button>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50 disabled:pointer-events-none"
          >
            {submitting ? "Submitting…" : "Submit review"}
          </button>
        </div>
      </form>
    </div>
  );
}
