import { NextResponse, type NextRequest } from "next/server";
import { getAdminFromRequest, insertAdminAuditLog } from "@/lib/admin-auth";
import { recomputeDistilledInsightForProperty } from "@/lib/distilled-insights";
import type {
  AdminReviewStatusUpdateInput,
  ReviewStatus,
} from "@/lib/types";

const REVIEW_STATUSES: ReviewStatus[] = [
  "pending",
  "approved",
  "rejected",
  "removed",
];

function validateBody(
  body: unknown,
):
  | { ok: true; data: AdminReviewStatusUpdateInput }
  | { ok: false; status: number; message: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, status: 400, message: "Invalid JSON body." };
  }

  const status = (body as Record<string, unknown>).status;
  if (!REVIEW_STATUSES.includes(status as ReviewStatus)) {
    return {
      ok: false,
      status: 400,
      message: "status must be pending, approved, rejected, or removed.",
    };
  }

  return { ok: true, data: { status: status as ReviewStatus } };
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const admin = await getAdminFromRequest(req);
  if (!admin) {
    return NextResponse.json(
      { message: "Forbidden. Admin access required." },
      { status: 403 },
    );
  }

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ message: "Review ID required." }, { status: 400 });
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

  const {
    data: review,
    error,
  } = await admin.supabase
    .from("reviews")
    .update({ status: validation.data.status } as never)
    .eq("id", id)
    .select("id, property_id, status, text_input")
    .maybeSingle<{
      id: string;
      property_id: string;
      status: ReviewStatus;
      text_input: string | null;
    }>();

  if (error) {
    return NextResponse.json(
      { message: "Failed to update review." },
      { status: 500 },
    );
  }

  if (!review) {
    return NextResponse.json({ message: "Review not found." }, { status: 404 });
  }

  await insertAdminAuditLog(admin, {
    admin_user_id: admin.user.id,
    action_type: `review_${validation.data.status}`,
    target_type: "review",
    target_id: id,
    details: {
      property_id: review.property_id,
      status: validation.data.status,
    },
  });

  let recomputeWarning: string | null = null;

  if (validation.data.status === "approved" && review.text_input?.trim()) {
    try {
      const recomputeResult = await recomputeDistilledInsightForProperty(
        admin.supabase,
        review.property_id
      );

      if (!recomputeResult.ok) {
        recomputeWarning = recomputeResult.message;
      }
    } catch (recomputeError) {
      recomputeWarning =
        recomputeError instanceof Error
          ? recomputeError.message
          : "Failed to recompute distilled insight.";
    }

    if (recomputeWarning) {
      await insertAdminAuditLog(admin, {
        admin_user_id: admin.user.id,
        action_type: "insight_recompute_failed",
        target_type: "insight",
        target_id: review.property_id,
        details: {
          property_id: review.property_id,
          review_id: review.id,
          message: recomputeWarning,
        },
      });
    }
  }

  return NextResponse.json({
    id: review.id,
    status: review.status,
    warning: recomputeWarning,
  });
}
