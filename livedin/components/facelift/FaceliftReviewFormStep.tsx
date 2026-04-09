"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  DEFAULT_SEVEN_SLIDER_VALUES,
  FACELIFT_CATEGORY_LABELS,
  sevenSlidersToFiveMetrics,
  type SevenSliderValues,
} from "@/lib/facelift-seven-categories";
import { CategoryStarRating } from "@/components/facelift/CategoryStarRating";
import type { ReviewCreateInput, ReviewableProperty } from "@/lib/types";
import {
  validateReviewCreateInput,
  TEXT_INPUT_MAX,
  type ReviewValidationErrors,
} from "@/lib/validation/review";

type FaceliftReviewFormStepProps = {
  property: ReviewableProperty;
  onSubmit: (data: ReviewCreateInput) => void | Promise<void>;
  onBack?: () => void;
  submitError?: string | null;
};

function formatAddress(p: ReviewableProperty): string {
  const parts = [p.address_line1, p.city, p.province].filter(Boolean);
  return parts.join(", ");
}

export function FaceliftReviewFormStep({
  property,
  onSubmit,
  onBack,
  submitError,
}: FaceliftReviewFormStepProps) {
  const [sliders, setSliders] = useState<SevenSliderValues>({
    ...DEFAULT_SEVEN_SLIDER_VALUES,
  });
  const [textInput, setTextInput] = useState("");
  const [tenancyStart, setTenancyStart] = useState("");
  const [tenancyEnd, setTenancyEnd] = useState("");
  const [errors, setErrors] = useState<ReviewValidationErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const five = sevenSlidersToFiveMetrics(sliders);
    const payload: Partial<ReviewCreateInput> = {
      property_id: property.id,
      ...five,
      text_input: textInput.trim() || null,
      tenancy_start: tenancyStart.trim() || null,
      tenancy_end: tenancyEnd.trim() || null,
    };

    const { valid, errors: nextErrors } = validateReviewCreateInput(payload);
    setErrors(nextErrors);
    if (!valid) {
      toast.error("Please fix the highlighted fields.");
      return;
    }

    setSubmitting(true);
    try {
      const fullPayload: ReviewCreateInput = {
        property_id: property.id,
        management_responsiveness: five.management_responsiveness,
        maintenance_timeliness: five.maintenance_timeliness,
        listing_accuracy: five.listing_accuracy,
        fee_transparency: five.fee_transparency,
        lease_clarity: five.lease_clarity,
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
      <div className="border-b border-[#E2DDD6] pb-6">
        <p className="text-sm font-medium uppercase tracking-[0.22em] text-[#717182]">
          Step 2 of 3
        </p>
        <h2
          className="mt-3 text-3xl font-bold text-[#0F1F38]"
          style={{ fontFamily: "var(--font-lora), ui-serif, Georgia, serif" }}
        >
          Rate your experience
        </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#717182]">
          Each category uses a 0–5 star scale. Your answers are combined into the five metrics our
          system stores (see{" "}
          <code className="rounded bg-[#F7F4EF] px-1 text-xs">lib/facelift-seven-categories.ts</code>
          ).
        </p>
      </div>

      {submitError ? (
        <div
          className="rounded-[12px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
        >
          {submitError}
        </div>
      ) : null}

      <div className="rounded-[16px] border border-[#E2DDD6] bg-[#F7F4EF] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-semibold text-[#0F1F38]">{property.display_name}</p>
            <p className="mt-1 text-sm text-[#717182]">{formatAddress(property)}</p>
          </div>
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="rounded-[12px] border border-[#E2DDD6] bg-white px-4 py-2 text-sm font-semibold text-[#0F1F38] transition-colors hover:bg-[#F7F4EF]"
            >
              Change property
            </button>
          ) : null}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="rounded-[16px] border border-[#E2DDD6] bg-white p-6">
          <h3 className="text-lg font-semibold text-[#0F1F38]">Categories</h3>
          <p className="mt-1 text-sm text-[#717182]">Click stars to rate each category from 0 to 5.</p>
          <div className="mt-6 space-y-6">
            {FACELIFT_CATEGORY_LABELS.map((label) => (
              <CategoryStarRating
                key={label}
                label={label}
                value={sliders[label]}
                onChange={(value) =>
                  setSliders((prev) => ({
                    ...prev,
                    [label]: value,
                  }))
                }
              />
            ))}
          </div>
        </section>

        <section className="rounded-[16px] border border-[#E2DDD6] bg-white p-6">
          <h3 className="text-lg font-semibold text-[#0F1F38]">Private notes</h3>
          <p className="mt-1 text-sm text-[#717182]">
            Optional. Used by moderators only; not shown on the public property page.
          </p>
          <label htmlFor="text_input" className="mt-4 block text-sm font-semibold text-[#0F1F38]">
            Notes (max {TEXT_INPUT_MAX} characters)
          </label>
          <textarea
            id="text_input"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value.slice(0, TEXT_INPUT_MAX))}
            maxLength={TEXT_INPUT_MAX}
            rows={4}
            className="mt-2 w-full rounded-[12px] border border-[#E2DDD6] px-4 py-3 text-[#0F1F38] outline-none focus:ring-2 focus:ring-[#E8913A]/40"
          />
          <p className="mt-1 text-xs text-[#717182]">
            {textInput.length}/{TEXT_INPUT_MAX}
          </p>
        </section>

        <section className="rounded-[16px] border border-[#E2DDD6] bg-white p-6">
          <h3 className="text-lg font-semibold text-[#0F1F38]">Tenancy dates</h3>
          <p className="mt-1 text-sm text-[#717182]">Optional context for moderators.</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="tenancy_start" className="block text-sm font-semibold text-[#0F1F38]">
                Start
              </label>
              <input
                id="tenancy_start"
                type="date"
                value={tenancyStart}
                onChange={(e) => setTenancyStart(e.target.value)}
                className="mt-2 w-full rounded-[12px] border border-[#E2DDD6] px-4 py-3 outline-none focus:ring-2 focus:ring-[#E8913A]/40"
              />
              {errors.tenancy_start ? (
                <p className="mt-1 text-sm text-red-600" role="alert">
                  {errors.tenancy_start}
                </p>
              ) : null}
            </div>
            <div>
              <label htmlFor="tenancy_end" className="block text-sm font-semibold text-[#0F1F38]">
                End
              </label>
              <input
                id="tenancy_end"
                type="date"
                value={tenancyEnd}
                onChange={(e) => setTenancyEnd(e.target.value)}
                className="mt-2 w-full rounded-[12px] border border-[#E2DDD6] px-4 py-3 outline-none focus:ring-2 focus:ring-[#E8913A]/40"
              />
              {errors.tenancy_end ? (
                <p className="mt-1 text-sm text-red-600" role="alert">
                  {errors.tenancy_end}
                </p>
              ) : null}
            </div>
          </div>
        </section>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-[12px] bg-[#E8913A] py-3 font-semibold text-white transition-colors hover:bg-[#d17f2f] disabled:opacity-60"
        >
          {submitting ? "Submitting…" : "Submit review"}
        </button>
      </form>
    </div>
  );
}
