"use client";

import { useState } from "react";
import { FeedbackPanel } from "@/components/ui/FeedbackPanel";
import type { ReviewCreateInput, ReviewableProperty } from "@/lib/types";
import {
  inputClass,
  primaryButtonClass,
  secondaryButtonClass,
  textareaClass,
} from "@/lib/ui";
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
  property: ReviewableProperty;
  onSubmit: (data: ReviewCreateInput) => void | Promise<void>;
  onBack?: () => void;
  submitError?: string | null;
};

function formatAddress(p: ReviewableProperty): string {
  const parts = [p.address_line1, p.city, p.province].filter(Boolean);
  return parts.join(", ");
}

export function ReviewFormStep({
  property,
  onSubmit,
  onBack,
  submitError,
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
      <div className="border-b border-zinc-200 pb-6 dark:border-zinc-800">
        <p className="text-sm font-medium uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-400">
          Step 2 of 3
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
          Complete your renter review
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-600 dark:text-zinc-400">
          Keep feedback specific to this property. Required ratings stay inline so you can fix issues without leaving the form.
        </p>
      </div>

      <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-medium text-foreground">{property.display_name}</p>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              {formatAddress(property)}
            </p>
          </div>
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className={secondaryButtonClass}
            >
              Change property
            </button>
          ) : null}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {submitError && (
          <FeedbackPanel tone="error" description={submitError} />
        )}
        <section className="rounded-3xl border border-zinc-200 p-5 dark:border-zinc-800">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-foreground">
              Ratings
            </h3>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Score each category from 0 to 5. Enter whole numbers only.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {METRIC_KEYS.map((key) => (
              <div key={key} className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
                <label
                  htmlFor={`metric-${key}`}
                  className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
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
                  className={`${inputClass} mt-3 w-24`}
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
        </section>

        <section className="rounded-3xl border border-zinc-200 p-5 dark:border-zinc-800">
          <h3 className="text-lg font-semibold text-foreground">Private notes</h3>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            This text is reviewed in the admin area and is not shown directly on the public property page.
          </p>
          <label
            htmlFor="text_input"
            className="mt-4 block text-sm font-medium text-foreground"
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
            className={`${textareaClass} mt-1`}
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
        </section>

        <section className="rounded-3xl border border-zinc-200 p-5 dark:border-zinc-800">
          <h3 className="text-lg font-semibold text-foreground">Tenancy dates</h3>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Add dates if you want to give moderators more context for when this experience happened.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
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
              className={`${inputClass} mt-1`}
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
              className={`${inputClass} mt-1`}
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
        </section>

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={submitting}
            className={primaryButtonClass}
          >
            {submitting ? "Submitting…" : "Submit review"}
          </button>
        </div>
      </form>
    </div>
  );
}
