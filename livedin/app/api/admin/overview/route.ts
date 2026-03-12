import { NextResponse, type NextRequest } from "next/server";
import { getAdminFromRequest } from "@/lib/admin-auth";
import type { AdminOverviewResponse } from "@/lib/types";

async function countRows(
  promise: PromiseLike<{ count: number | null; error: { message: string } | null }>,
): Promise<number> {
  const result = await promise;
  if (result.error) {
    throw new Error(result.error.message);
  }

  return result.count ?? 0;
}

export async function GET(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin) {
    return NextResponse.json(
      { message: "Forbidden. Admin access required." },
      { status: 403 },
    );
  }

  try {
    const [
      pendingReviews,
      approvedReviews,
      pendingInsights,
      pendingAccessRequests,
      activeProperties,
      inactiveProperties,
      adminUsers,
      verifiedUsers,
      publicUsers,
    ] = await Promise.all([
      countRows(
        admin.supabase
          .from("reviews")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending"),
      ),
      countRows(
        admin.supabase
          .from("reviews")
          .select("id", { count: "exact", head: true })
          .eq("status", "approved"),
      ),
      countRows(
        admin.supabase
          .from("distilled_insights")
          .select("property_id", { count: "exact", head: true })
          .eq("status", "pending"),
      ),
      countRows(
        admin.supabase
          .from("admin_role_requests")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending"),
      ),
      countRows(
        admin.supabase
          .from("properties")
          .select("id", { count: "exact", head: true })
          .eq("status", "active"),
      ),
      countRows(
        admin.supabase
          .from("properties")
          .select("id", { count: "exact", head: true })
          .eq("status", "inactive"),
      ),
      countRows(
        admin.supabase
          .from("profiles")
          .select("user_id", { count: "exact", head: true })
          .eq("role", "admin"),
      ),
      countRows(
        admin.supabase
          .from("profiles")
          .select("user_id", { count: "exact", head: true })
          .eq("role", "verified"),
      ),
      countRows(
        admin.supabase
          .from("profiles")
          .select("user_id", { count: "exact", head: true })
          .eq("role", "public"),
      ),
    ]);

    const payload: AdminOverviewResponse = {
      counts: {
        pending_reviews: pendingReviews,
        approved_reviews: approvedReviews,
        pending_insights: pendingInsights,
        pending_access_requests: pendingAccessRequests,
        active_properties: activeProperties,
        inactive_properties: inactiveProperties,
        admin_users: adminUsers,
        verified_users: verifiedUsers,
        public_users: publicUsers,
      },
    };

    return NextResponse.json(payload);
  } catch {
    return NextResponse.json(
      { message: "Failed to load admin overview." },
      { status: 500 },
    );
  }
}
