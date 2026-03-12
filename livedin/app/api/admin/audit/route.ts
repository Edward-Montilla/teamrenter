import { NextResponse, type NextRequest } from "next/server";
import { getAdminFromRequest } from "@/lib/admin-auth";
import type { AdminAuditLogItem } from "@/lib/types";

export async function GET(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin) {
    return NextResponse.json(
      { message: "Forbidden. Admin access required." },
      { status: 403 },
    );
  }

  const limitParam = Number.parseInt(
    req.nextUrl.searchParams.get("limit") ?? "20",
    10,
  );
  const limit = Number.isFinite(limitParam)
    ? Math.min(Math.max(limitParam, 1), 50)
    : 20;

  const targetTypeParam = req.nextUrl.searchParams.get("target_type");
  const targetTypes = targetTypeParam
    ? targetTypeParam
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean)
    : [];
  const targetId = req.nextUrl.searchParams.get("target_id")?.trim() ?? null;
  const actionType = req.nextUrl.searchParams.get("action_type")?.trim() ?? null;
  const adminUserId = req.nextUrl.searchParams.get("admin_user_id")?.trim() ?? null;

  let query = admin.supabase
    .from("admin_audit_log")
    .select(
      "id, admin_user_id, action_type, target_type, target_id, details, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (targetTypes.length === 1) {
    query = query.eq("target_type", targetTypes[0]);
  } else if (targetTypes.length > 1) {
    query = query.in("target_type", targetTypes);
  }

  if (targetId) {
    query = query.eq("target_id", targetId);
  }

  if (actionType) {
    query = query.eq("action_type", actionType);
  }

  if (adminUserId) {
    query = query.eq("admin_user_id", adminUserId);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json(
      { message: "Failed to load audit log." },
      { status: 500 },
    );
  }

  return NextResponse.json({ items: (data ?? []) as AdminAuditLogItem[] });
}
