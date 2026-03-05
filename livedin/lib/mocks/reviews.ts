/**
 * Mock review storage for submit flow (Slice 03). localStorage only; no Supabase.
 * text_input is never persisted or exposed in stored shape.
 */

import type { ReviewCreateInput } from "@/lib/types";

export const REVIEWS_STORAGE_KEY = "reviews_mock_v1";

export type StoredReviewRecord = {
  property_id: string;
  review_id: string;
  management_responsiveness: number;
  maintenance_timeliness: number;
  listing_accuracy: number;
  fee_transparency: number;
  lease_clarity: number;
  tenancy_start: string | null;
  tenancy_end: string | null;
  created_at: string; // ISO
};

function getStoredRaw(): StoredReviewRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(REVIEWS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Returns all stored review records (for "already reviewed" check).
 * Does not include text_input.
 */
export function getStoredReviews(): StoredReviewRecord[] {
  return getStoredRaw();
}

/**
 * Appends a review to localStorage. Does not store text_input.
 */
export function storeReview(
  review: ReviewCreateInput & { review_id: string }
): void {
  const records = getStoredRaw();
  const record: StoredReviewRecord = {
    property_id: review.property_id,
    review_id: review.review_id,
    management_responsiveness: review.management_responsiveness,
    maintenance_timeliness: review.maintenance_timeliness,
    listing_accuracy: review.listing_accuracy,
    fee_transparency: review.fee_transparency,
    lease_clarity: review.lease_clarity,
    tenancy_start: review.tenancy_start ?? null,
    tenancy_end: review.tenancy_end ?? null,
    created_at: new Date().toISOString(),
  };
  records.push(record);
  if (typeof window !== "undefined") {
    window.localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(records));
  }
}

/**
 * Returns true if the current mock storage has a review for this property.
 * Used for optional "already reviewed" auto-detection; explicit gate toggle takes priority.
 */
export function hasStoredReviewForProperty(propertyId: string): boolean {
  return getStoredRaw().some((r) => r.property_id === propertyId);
}
