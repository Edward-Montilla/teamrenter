/**
 * Client-side validation for review submission (Slice 03).
 * Pure functions; no external deps.
 */

import type { ReviewCreateInput, ReviewScore } from "@/lib/types";

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

const TEXT_INPUT_MAX = 500;

export type ReviewValidationErrors = Partial<Record<keyof ReviewCreateInput, string>>;

export function isValidReviewScore(value: unknown): value is ReviewScore {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 0 &&
    value <= 5 &&
    Number.isInteger(value * 2)
  );
}

export function validateReviewCreateInput(
  input: Partial<ReviewCreateInput>
): { valid: boolean; errors: ReviewValidationErrors } {
  const errors: ReviewValidationErrors = {};

  if (!input.property_id?.trim()) {
    errors.property_id = "Please select a property.";
  }

  for (const key of METRIC_KEYS) {
    const value = input[key];
    if (value === undefined || value === null) {
      errors[key] = `Please rate ${METRIC_LABELS[key].toLowerCase()} (0-5 in 0.5 increments).`;
    } else if (!isValidReviewScore(value)) {
      errors[key] = `${METRIC_LABELS[key]} must be between 0 and 5 in 0.5 increments.`;
    }
  }

  if (input.text_input != null && input.text_input.length > TEXT_INPUT_MAX) {
    errors.text_input = "Private notes must be 500 characters or less.";
  }

  if (input.tenancy_start != null && input.tenancy_end != null) {
    const start = input.tenancy_start.trim();
    const end = input.tenancy_end.trim();
    if (start && end) {
      const startDate = new Date(start);
      const endDate = new Date(end);
      if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
        if (!errors.tenancy_start) errors.tenancy_start = "Please enter valid dates.";
        if (!errors.tenancy_end) errors.tenancy_end = "Please enter valid dates.";
      } else if (startDate > endDate) {
        errors.tenancy_end = "End date must be on or after start date.";
      }
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export { TEXT_INPUT_MAX };
