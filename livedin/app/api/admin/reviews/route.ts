import { NextResponse, type NextRequest } from "next/server";
import { getAdminFromRequest } from "@/lib/admin-auth";
import type { AdminReviewModerationItem, ReviewScore, ReviewStatus } from "@/lib/types";

type ReviewRow = {
  id: string;
  property_id: string;
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

type PropertyRow = {
  id: string;
  display_name: string;
};

const REVIEW_STATUSES: ReviewStatus[] = [
  "pending",
  "approved",
  "rejected",
  "removed",
];

export async function GET(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin) {
    return NextResponse.json(
      { message: "Forbidden. Admin access required." },
      { status: 403 },
    );
  }

  const statusParam = req.nextUrl.searchParams.get("status");
  const status =
    statusParam && REVIEW_STATUSES.includes(statusParam as ReviewStatus)
      ? (statusParam as ReviewStatus)
      : null;

  let query = admin.supabase
    .from("reviews")
    .select(
      "id, property_id, user_id, status, management_responsiveness, maintenance_timeliness, listing_accuracy, fee_transparency, lease_clarity, text_input, tenancy_start, tenancy_end, created_at, updated_at",
    )
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json(
      { message: "Failed to load reviews." },
      { status: 500 },
    );
  }

  const rows = (data ?? []) as ReviewRow[];
  const propertyIds = [...new Set(rows.map((row) => row.property_id))];

  const { data: propertyRows, error: propertyError } = propertyIds.length
    ? await admin.supabase
        .from("properties")
        .select("id, display_name")
        .in("id", propertyIds)
    : { data: [], error: null };

  if (propertyError) {
    return NextResponse.json(
      { message: "Failed to load related properties." },
      { status: 500 },
    );
  }

  const propertyNameById = new Map(
    ((propertyRows ?? []) as PropertyRow[]).map((row) => [row.id, row.display_name]),
  );

  const items: AdminReviewModerationItem[] = rows.map((row) => ({
    id: row.id,
    property_id: row.property_id,
    property_display_name: propertyNameById.get(row.property_id) ?? "Unknown property",
    user_id: row.user_id,
    status: row.status,
    management_responsiveness: row.management_responsiveness,
    maintenance_timeliness: row.maintenance_timeliness,
    listing_accuracy: row.listing_accuracy,
    fee_transparency: row.fee_transparency,
    lease_clarity: row.lease_clarity,
    text_input: row.text_input,
    tenancy_start: row.tenancy_start,
    tenancy_end: row.tenancy_end,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }));

  return NextResponse.json({ items });
}
