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
 * SUBMIT (seven 0–5 category ratings → five ReviewCreateInput metrics):
 * | Stored metric               | Derived from category ratings (same Facelift labels)      |
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

const STAR_MIN = 0;
const STAR_MAX = 5;

/** Map 0–5 star selection to canonical ReviewScore (0.5 increments). */
export function starsToReviewScore(value: number): ReviewScore {
  const clamped = Math.min(STAR_MAX, Math.max(STAR_MIN, value));
  const stepped = Math.round(clamped * 2) / 2;
  return stepped as ReviewScore;
}

export type SevenSliderValues = Record<FaceliftCategoryLabel, number>;

export const DEFAULT_SEVEN_SLIDER_VALUES: SevenSliderValues = {
  "Landlord Responsiveness": 0,
  Maintenance: 0,
  "Value for Money": 0,
  Cleanliness: 0,
  Location: 0,
  Safety: 0,
  Amenities: 0,
};

function averageToReviewScore(...parts: number[]): ReviewScore {
  const raw = parts.reduce((s, n) => s + n, 0) / parts.length;
  const stepped = Math.round(raw * 2) / 2;
  const clamped = Math.min(5, Math.max(0, stepped));
  return clamped as ReviewScore;
}

/** Combine seven UI category ratings into the five API payload fields. */
export function sevenSlidersToFiveMetrics(values: SevenSliderValues): {
  management_responsiveness: ReviewScore;
  maintenance_timeliness: ReviewScore;
  listing_accuracy: ReviewScore;
  fee_transparency: ReviewScore;
  lease_clarity: ReviewScore;
} {
  const v = values;
  const landlord = starsToReviewScore(v["Landlord Responsiveness"]);
  const maint = starsToReviewScore(v.Maintenance);
  const valueMoney = starsToReviewScore(v["Value for Money"]);
  const clean = starsToReviewScore(v.Cleanliness);
  const loc = starsToReviewScore(v.Location);
  const safety = starsToReviewScore(v.Safety);
  const amen = starsToReviewScore(v.Amenities);

  return {
    management_responsiveness: landlord,
    maintenance_timeliness: maint,
    listing_accuracy: averageToReviewScore(valueMoney, clean, loc),
    fee_transparency: averageToReviewScore(valueMoney, amen),
    lease_clarity: averageToReviewScore(loc, safety, amen),
  };
}
