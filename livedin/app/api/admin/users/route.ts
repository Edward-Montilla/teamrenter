import { NextResponse, type NextRequest } from "next/server";
import { getAdminFromRequest } from "@/lib/admin-auth";
import type { AdminRoleRequestState, AdminUserListItem } from "@/lib/types";

const USER_ROLES = ["public", "verified", "admin"] as const;
const REQUEST_STATUSES = ["none", "pending", "approved", "rejected"] as const;

type AdminUserRpcRow = Omit<AdminUserListItem, "role" | "latest_admin_request_status"> & {
  role: (typeof USER_ROLES)[number];
  latest_admin_request_status: AdminRoleRequestState;
};

export async function GET(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin) {
    return NextResponse.json(
      { message: "Forbidden. Admin access required." },
      { status: 403 },
    );
  }

  const query = req.nextUrl.searchParams.get("query")?.trim() ?? null;
  const roleParam = req.nextUrl.searchParams.get("role");
  const emailVerifiedParam = req.nextUrl.searchParams.get("email_verified");
  const requestStatusParam = req.nextUrl.searchParams.get("request_status");
  const limitParam = Number.parseInt(
    req.nextUrl.searchParams.get("limit") ?? "100",
    10,
  );
  const limit = Number.isFinite(limitParam)
    ? Math.min(Math.max(limitParam, 1), 200)
    : 100;

  const role =
    roleParam && USER_ROLES.includes(roleParam as (typeof USER_ROLES)[number])
      ? roleParam
      : null;
  const requestStatus =
    requestStatusParam &&
    REQUEST_STATUSES.includes(
      requestStatusParam as (typeof REQUEST_STATUSES)[number],
    )
      ? requestStatusParam
      : null;
  const emailVerified =
    emailVerifiedParam === "true"
      ? true
      : emailVerifiedParam === "false"
        ? false
        : null;

  const { data, error } = await admin.supabase.rpc("admin_list_users", {
    p_query: query,
    p_role: role,
    p_email_verified: emailVerified,
    p_request_status: requestStatus,
    p_limit: limit,
  });

  if (error) {
    return NextResponse.json(
      { message: "Failed to load admin users." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    items: (data ?? []) as AdminUserRpcRow[],
  });
}
