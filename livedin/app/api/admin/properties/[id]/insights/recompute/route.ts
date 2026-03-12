import { NextResponse, type NextRequest } from "next/server";
import { getAdminFromRequest, insertAdminAuditLog } from "@/lib/admin-auth";
import { recomputeDistilledInsightForProperty } from "@/lib/distilled-insights";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminFromRequest(req);
  if (!admin) {
    return NextResponse.json(
      { message: "Forbidden. Admin access required." },
      { status: 403 }
    );
  }

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ message: "Property ID required." }, { status: 400 });
  }

  try {
    const result = await recomputeDistilledInsightForProperty(admin.supabase, id);

    if (!result.ok) {
      const status = result.code === "property_not_found" ? 404 : 422;
      return NextResponse.json({ message: result.message }, { status });
    }

    await insertAdminAuditLog(admin, {
      admin_user_id: admin.user.id,
      action_type: "insight_recompute",
      target_type: "insight",
      target_id: id,
      details: {
        property_id: id,
        source_review_count: result.source_review_count,
        status: result.insight.status,
      },
    });

    return NextResponse.json({
      property_id: result.insight.property_id,
      insights_text: result.insight.insights_text,
      status: result.insight.status,
      screened: result.insight.screened,
      screening_flags: result.insight.screening_flags,
      last_generated_at: result.insight.last_generated_at,
      screened_at: result.insight.screened_at,
      updated_at: result.insight.updated_at,
      source_review_count: result.source_review_count,
    });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Failed to recompute distilled insight.",
      },
      { status: 500 }
    );
  }
}
