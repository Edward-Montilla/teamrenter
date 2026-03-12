import { NextResponse, type NextRequest } from "next/server";
import { getAdminFromRequest } from "@/lib/admin-auth";
import type { AdminRoleRequestQueueItem, AdminRoleReviewStatus } from "@/lib/types";

const REVIEW_STATUSES: AdminRoleReviewStatus[] = ["approved", "rejected"];

export async function GET(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin) {
    return NextResponse.json(
      { message: "Forbidden. Admin access required." },
      { status: 403 },
    );
  }

  const statusParam = req.nextUrl.searchParams.get("status");
  const limitParam = Number.parseInt(req.nextUrl.searchParams.get("limit") ?? "50", 10);
  const limit = Number.isFinite(limitParam)
    ? Math.min(Math.max(limitParam, 1), 100)
    : 50;

  let query = admin.supabase
    .from("admin_role_requests")
    .select(
      "id, user_id, email_snapshot, full_name, role_title, reason, intended_actions, team_context, referral_contact, status, review_notes, reviewed_by, reviewed_at, created_at, updated_at",
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (statusParam === "pending" || REVIEW_STATUSES.includes(statusParam as AdminRoleReviewStatus)) {
    query = query.eq("status", statusParam);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json(
      { message: "Failed to load admin access requests." },
      { status: 500 },
    );
  }

  return NextResponse.json({ items: (data ?? []) as AdminRoleRequestQueueItem[] });
}
