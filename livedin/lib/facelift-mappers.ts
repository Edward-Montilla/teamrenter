import type { DisplayScore0_5, PropertyListItem } from "@/lib/types";

/**
 * Facelift mock TrustScore uses a ~0–10 scale with one decimal (e.g. 8.4).
 * Canonical data is display_trustscore_0_5 (integers 0–5). Map here for UI parity.
 */
export function trustScoreDisplayFacelift(score0_5: DisplayScore0_5): number {
  if (score0_5 <= 0) {
    return 0;
  }
  return Number(((score0_5 / 5) * 10).toFixed(1));
}

/** Card subtitle line: city + province when no neighbourhood column exists yet (Phase 5). */
export function propertyCardNeighbourhoodLine(item: PropertyListItem): string {
  const parts = [item.city, item.province].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : "Location TBD";
}

export function propertyCardAddressLine(item: PropertyListItem): string {
  return item.display_name?.trim() || item.address_line1;
}

/** Unit/rent fields not in DB yet — show neutral placeholder until Phase 5 migrations. */
export function propertyCardTypePlaceholder(item: PropertyListItem): string {
  void item;
  return "Rental property";
}

export function propertyCardPricePlaceholder(item: PropertyListItem): string {
  void item;
  return "Rent on request";
}
