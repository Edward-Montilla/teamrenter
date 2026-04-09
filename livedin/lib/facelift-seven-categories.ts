/**
 * Facelift UI shows seven category labels; the product stores five review metrics
 * (`management_responsiveness`, `maintenance_timeliness`, `listing_accuracy`,
 * `fee_transparency`, `lease_clarity`). This module documents how we bridge them.
 *
 * DISPLAY (aggregates → seven bars, 0–10 scale for CategoryScoreBar):
 * | Facelift bar            | Source (from PropertyAggregatePublic display_*_0_5)     |
 * |-------------------------|--------------------------------------------------------|
 * | Landlord Responsiveness | display_management_responsiveness_0_5                  |
 * | Maintenance             | display_maintenance_timeliness_0_5                     |
 * | Value for Money         | mean(fee, listing) — fee + listing_accuracy            |
 * | Cleanliness             | display_listing_accuracy_0_5                         |
 * | Location                | display_lease_clarity_0_5 (proxy until neighbourhood) |
 * | Safety                  | mean(maintenance, management)                          |
 * | Amenities               | mean(fee, lease)                                       |
 *
 * SUBMIT (seven 1–10 sliders → five ReviewCreateInput metrics):
 * | Stored metric               | Derived from sliders (same Facelift labels)              |
 * |-----------------------------|----------------------------------------------------------|
 * | management_responsiveness   | Landlord Responsiveness                                  |
 * | maintenance_timeliness    | Maintenance                                              |
 * | listing_accuracy            | mean(Value, Cleanliness, Location)                       |
 * | fee_transparency            | mean(Value for Money, Amenities)                         |
 * | lease_clarity               | mean(Location, Safety, Amenities)                        |
 */

import type { PropertyAggregatePublic, ReviewScore } from "@/lib/types";
import { trustScoreDisplayFacelift } from "@/lib/facelift-mappers";

export const FACELIFT_CATEGORY_LABELS = [
  "Landlord Responsiveness",
  "Maintenance",
  "Value for Money",
  "Cleanliness",
  "Location",
  "Safety",
  "Amenities",
] as const;

export type FaceliftCategoryLabel = (typeof FACELIFT_CATEGORY_LABELS)[number];

export type FaceliftCategoryBarDisplay = {
  label: FaceliftCategoryLabel;
  /** 0–10 scale for UI; NaN when no review data */
  score10: number | null;
};

function mean0_5(a: number, b: number): number {
  return (a + b) / 2;
}

/** Convert stored 0–5 display aggregate to Facelift’s 0–10 bar scale. */
export function display0_5ToBar10(score: number): number {
  return trustScoreDisplayFacelift(score as PropertyAggregatePublic["display_trustscore_0_5"]);
}

/**
 * Build seven category rows from public aggregates (five stored metrics).
 * When `review_count === 0`, returns `score10: null` for every bar.
 */
export function aggregatesToSevenCategoryBars(
  aggregates: PropertyAggregatePublic,
): FaceliftCategoryBarDisplay[] {
  if (aggregates.review_count <= 0) {
    return FACELIFT_CATEGORY_LABELS.map((label) => ({ label, score10: null }));
  }

  const m = aggregates.display_management_responsiveness_0_5;
  const t = aggregates.display_maintenance_timeliness_0_5;
  const l = aggregates.display_listing_accuracy_0_5;
  const f = aggregates.display_fee_transparency_0_5;
  const c = aggregates.display_lease_clarity_0_5;

  const scores: Record<FaceliftCategoryLabel, number> = {
    "Landlord Responsiveness": m,
    Maintenance: t,
    "Value for Money": mean0_5(f, l),
    Cleanliness: l,
    Location: c,
    Safety: mean0_5(t, m),
    Amenities: mean0_5(f, c),
  };

  return FACELIFT_CATEGORY_LABELS.map((label) => ({
    label,
    score10: display0_5ToBar10(scores[label]),
  }));
}

const SLIDER_MIN = 1;
const SLIDER_MAX = 10;

/** Map Facelift slider (1–10) to canonical ReviewScore (0–5, 0.5 steps). */
export function slider10ToReviewScore(value: number): ReviewScore {
  const clamped = Math.min(SLIDER_MAX, Math.max(SLIDER_MIN, value));
  const scaled = ((clamped - SLIDER_MIN) / (SLIDER_MAX - SLIDER_MIN)) * 5;
  const stepped = Math.round(scaled * 2) / 2;
  return stepped as ReviewScore;
}

export type SevenSliderValues = Record<FaceliftCategoryLabel, number>;

export const DEFAULT_SEVEN_SLIDER_VALUES: SevenSliderValues = {
  "Landlord Responsiveness": 7,
  Maintenance: 7,
  "Value for Money": 7,
  Cleanliness: 7,
  Location: 7,
  Safety: 7,
  Amenities: 7,
};

function averageToReviewScore(...parts: number[]): ReviewScore {
  const raw = parts.reduce((s, n) => s + n, 0) / parts.length;
  const stepped = Math.round(raw * 2) / 2;
  const clamped = Math.min(5, Math.max(0, stepped));
  return clamped as ReviewScore;
}

/** Combine seven UI sliders into the five API payload fields. */
export function sevenSlidersToFiveMetrics(values: SevenSliderValues): {
  management_responsiveness: ReviewScore;
  maintenance_timeliness: ReviewScore;
  listing_accuracy: ReviewScore;
  fee_transparency: ReviewScore;
  lease_clarity: ReviewScore;
} {
  const v = values;
  const landlord = slider10ToReviewScore(v["Landlord Responsiveness"]);
  const maint = slider10ToReviewScore(v.Maintenance);
  const valueMoney = slider10ToReviewScore(v["Value for Money"]);
  const clean = slider10ToReviewScore(v.Cleanliness);
  const loc = slider10ToReviewScore(v.Location);
  const safety = slider10ToReviewScore(v.Safety);
  const amen = slider10ToReviewScore(v.Amenities);

  return {
    management_responsiveness: landlord,
    maintenance_timeliness: maint,
    listing_accuracy: averageToReviewScore(valueMoney, clean, loc),
    fee_transparency: averageToReviewScore(valueMoney, amen),
    lease_clarity: averageToReviewScore(loc, safety, amen),
  };
}
