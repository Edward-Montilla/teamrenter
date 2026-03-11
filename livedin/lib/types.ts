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

export type ReviewableProperty = {
  id: string;
  display_name: string;
  address_line1: string;
  city: string;
  province: string;
  management_company: string | null;
};

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

// --- Slice 03: Review submission ---

export type ReviewCreateInput = {
  property_id: string;
  management_responsiveness: 0 | 1 | 2 | 3 | 4 | 5;
  maintenance_timeliness: 0 | 1 | 2 | 3 | 4 | 5;
  listing_accuracy: 0 | 1 | 2 | 3 | 4 | 5;
  fee_transparency: 0 | 1 | 2 | 3 | 4 | 5;
  lease_clarity: 0 | 1 | 2 | 3 | 4 | 5;
  text_input: string | null; // max 500 chars, private
  tenancy_start: string | null; // ISO date
  tenancy_end: string | null; // ISO date, >= tenancy_start
};

export type ReviewGateState =
  | "unauthenticated"
  | "unverified"
  | "limit_reached"
  | "already_reviewed"
  | "allowed";

export type ReviewSubmitResult =
  | { ok: true; review_id: string }
  | { ok: false; code: 401 | 403 | 409 | 429; message: string };

// --- Slice 08: Admin property CRUD ---

export type AdminPropertyListItem = {
  id: string;
  display_name: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  province: string;
  postal_code: string;
  management_company: string | null;
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
};

export type AdminPropertyCreateInput = {
  display_name: string;
  address_line1: string;
  address_line2?: string | null;
  city: string;
  province: string;
  postal_code: string;
  management_company?: string | null;
  status?: "active" | "inactive";
};

export type AdminPropertyUpdateInput = {
  display_name?: string;
  address_line1?: string;
  address_line2?: string | null;
  city?: string;
  province?: string;
  postal_code?: string;
  management_company?: string | null;
  status?: "active" | "inactive";
};

// --- Slice 09: Admin moderation + audit ---

export type ReviewStatus = "pending" | "approved" | "rejected" | "removed";

export type DistilledInsightStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "hidden";

export type AdminReviewModerationItem = {
  id: string;
  property_id: string;
  property_display_name: string;
  user_id: string;
  status: ReviewStatus;
  management_responsiveness: 0 | 1 | 2 | 3 | 4 | 5;
  maintenance_timeliness: 0 | 1 | 2 | 3 | 4 | 5;
  listing_accuracy: 0 | 1 | 2 | 3 | 4 | 5;
  fee_transparency: 0 | 1 | 2 | 3 | 4 | 5;
  lease_clarity: 0 | 1 | 2 | 3 | 4 | 5;
  text_input: string | null;
  tenancy_start: string | null;
  tenancy_end: string | null;
  created_at: string;
  updated_at: string;
};

export type AdminReviewStatusUpdateInput = {
  status: ReviewStatus;
};

export type AdminInsightModerationItem = {
  property_id: string;
  property_display_name: string;
  insights_text: string;
  status: DistilledInsightStatus;
  screened: boolean;
  screening_flags: Record<string, unknown> | null;
  last_generated_at: string;
  screened_at: string | null;
  updated_at: string;
};

export type AdminInsightStatusUpdateInput = {
  status: DistilledInsightStatus;
};

export type AdminAuditLogItem = {
  id: string;
  admin_user_id: string;
  action_type: string;
  target_type: string;
  target_id: string;
  details: Record<string, unknown> | null;
  created_at: string;
};
