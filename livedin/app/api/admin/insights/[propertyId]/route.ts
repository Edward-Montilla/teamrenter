import { NextResponse, type NextRequest } from "next/server";
import { getAdminFromRequest } from "@/lib/admin-auth";
import type {
  AdminInsightStatusUpdateInput,
  DistilledInsightStatus,
} from "@/lib/types";

const INSIGHT_STATUSES: DistilledInsightStatus[] = [
  "pending",
  "approved",
  "rejected",
  "hidden",
];

function validateBody(
  body: unknown,
):
  | { ok: true; data: AdminInsightStatusUpdateInput }
  | { ok: false; status: number; message: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, status: 400, message: "Invalid JSON body." };
  }

  const status = (body as Record<string, unknown>).status;
  if (!INSIGHT_STATUSES.includes(status as DistilledInsightStatus)) {
    return {
      ok: false,
      status: 400,
      message: "status must be pending, approved, rejected, or hidden.",
    };
  }

  return {
    ok: true,
    data: { status: status as DistilledInsightStatus },
  };
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ propertyId: string }> },
) {
  const admin = await getAdminFromRequest(req);
  if (!admin) {
    return NextResponse.json(
      { message: "Forbidden. Admin access required." },
      { status: 403 },
    );
  }

  const { propertyId } = await context.params;
  if (!propertyId) {
    return NextResponse.json(
      { message: "Property ID required." },
      { status: 400 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body." }, { status: 400 });
  }

  const validation = validateBody(body);
  if (!validation.ok) {
    return NextResponse.json(
      { message: validation.message },
      { status: validation.status },
    );
  }

  const updatePayload = {
    status: validation.data.status,
    screened: true,
    screened_at: new Date().toISOString(),
  };

  const { data: insight, error } = await admin.supabase
    .from("distilled_insights")
    .update(updatePayload as never)
    .eq("property_id", propertyId)
    .select("property_id, status")
    .maybeSingle<{ property_id: string; status: DistilledInsightStatus }>();

  if (error) {
    return NextResponse.json(
      { message: "Failed to update insight." },
      { status: 500 },
    );
  }

  if (!insight) {
    return NextResponse.json({ message: "Insight not found." }, { status: 404 });
  }

  await admin.supabase.from("admin_audit_log").insert({
    admin_user_id: admin.user.id,
    action_type: `insight_${validation.data.status}`,
    target_type: "insight",
    target_id: propertyId,
    details: {
      property_id: propertyId,
      status: validation.data.status,
    },
  } as never);

  return NextResponse.json({
    property_id: insight.property_id,
    status: insight.status,
  });
}
