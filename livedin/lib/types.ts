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
  trustscore_display_0_5: 0 | 1 | 2 | 3 | 4 | 5;
  review_count: number;
};

export type PropertySearchResponse = {
  items: PropertyListItem[];
  total: number;
  query: string;
};

export type UiListState = "loading" | "ready" | "empty" | "error";
export type UiFeedbackTone = "info" | "success" | "warning" | "error";
export type UiSurfaceState =
  | "idle"
  | "loading"
  | "empty"
  | "error"
  | "success";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

export type ReviewableProperty = {
  id: string;
  display_name: string;
  address_line1: string;
  city: string;
  province: string;
  management_company: string | null;
};

/** Display score 0–5; when review_count === 0 all are 0. */
export type DisplayScore0_5 = 0 | 1 | 2 | 3 | 4 | 5;

/** Property detail aggregates (Slice 02). Public only sees display_*_0_5. */
export type PropertyAggregatePublic = {
  review_count: number;
  display_trustscore_0_5: DisplayScore0_5;
  display_management_responsiveness_0_5: DisplayScore0_5;
  display_maintenance_timeliness_0_5: DisplayScore0_5;
  display_listing_accuracy_0_5: DisplayScore0_5;
  display_fee_transparency_0_5: DisplayScore0_5;
  display_lease_clarity_0_5: DisplayScore0_5;
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

export type ReviewScore =
  | 0
  | 0.5
  | 1
  | 1.5
  | 2
  | 2.5
  | 3
  | 3.5
  | 4
  | 4.5
  | 5;

export type ReviewCreateInput = {
  property_id: string;
  management_responsiveness: ReviewScore;
  maintenance_timeliness: ReviewScore;
  listing_accuracy: ReviewScore;
  fee_transparency: ReviewScore;
  lease_clarity: ReviewScore;
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
  management_responsiveness: ReviewScore;
  maintenance_timeliness: ReviewScore;
  listing_accuracy: ReviewScore;
  fee_transparency: ReviewScore;
  lease_clarity: ReviewScore;
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

// --- Slice 14: Admin access requests ---

export type CurrentUserRole = "public" | "verified" | "admin";
export type AdminRoleRequestState = "none" | "pending" | "approved" | "rejected";
export type AdminRoleReviewStatus = Exclude<AdminRoleRequestState, "none" | "pending">;

export type AdminRoleRequestCreateInput = {
  reason: string;
  team_context?: string;
};

export type AdminRoleRequestCreateResponse =
  | {
      status: "pending";
      submittedAt: string;
    }
  | {
      status: "approved";
      promotedImmediately: true;
    };

export type AdminRoleRequestSummary = {
  id: string;
  reason: string;
  team_context: string | null;
  status: Exclude<AdminRoleRequestState, "none">;
  review_notes: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type AdminRoleRequestStatusResponse = {
  eligible: boolean;
  hasActiveRequest: boolean;
  requestStatus: AdminRoleRequestState;
  currentRole: CurrentUserRole;
  bootstrapRequired: boolean;
  bootstrapEligible: boolean;
  latestRequest: AdminRoleRequestSummary | null;
};

export type AdminRoleRequestQueueItem = {
  id: string;
  user_id: string;
  email_snapshot: string;
  reason: string;
  team_context: string | null;
  status: Exclude<AdminRoleRequestState, "none">;
  review_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type AdminRoleRequestReviewInput = {
  status: AdminRoleReviewStatus;
  review_notes?: string;
};
