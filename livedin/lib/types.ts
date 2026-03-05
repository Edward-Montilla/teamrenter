/**
 * Data contracts for public property list (Slice 01).
 * Used by UI components and data access layer; Slice 06 will keep these shapes when wiring Supabase.
 */

export type PropertyListItem = {
  id: string;
  display_name: string;
  address_line1: string;
  city: string;
  province: string;
  management_company: string | null;
  trustscore_display_0_6: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  review_count: number;
};

export type PropertySearchResponse = {
  items: PropertyListItem[];
  total: number;
  query: string;
};

export type UiListState = "loading" | "ready" | "empty" | "error";

/** Display score 0–6; when review_count === 0 all are 0. */
export type DisplayScore0_6 = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/** Property detail aggregates (Slice 02). Public only sees display_*_0_6. */
export type PropertyAggregatePublic = {
  review_count: number;
  display_trustscore_0_6: DisplayScore0_6;
  display_management_responsiveness_0_6: DisplayScore0_6;
  display_maintenance_timeliness_0_6: DisplayScore0_6;
  display_listing_accuracy_0_6: DisplayScore0_6;
  display_fee_transparency_0_6: DisplayScore0_6;
  display_lease_clarity_0_6: DisplayScore0_6;
  last_updated: string; // ISO timestamp
};

/** Approved distilled insight only; never raw review text. */
export type DistilledInsightPublic = {
  insights_text: string;
  last_generated_at: string; // ISO timestamp
};

/** Property detail for public page (Slice 02). insights only when status === 'approved'. */
export type PropertyDetailPublic = {
  property: {
    id: string;
    display_name: string;
    address_line1: string;
    address_line2?: string;
    city: string;
    province: string;
    postal_code: string;
    management_company: string | null;
  };
  aggregates: PropertyAggregatePublic;
  insights: DistilledInsightPublic | null;
};
