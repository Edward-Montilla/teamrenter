import { NextResponse, type NextRequest } from "next/server";
import { getAdminFromRequest, insertAdminAuditLog } from "@/lib/admin-auth";
import type {
  AdminRoleRequestQueueItem,
  AdminRoleRequestReviewInput,
  AdminRoleReviewStatus,
} from "@/lib/types";

const REVIEW_STATUSES: AdminRoleReviewStatus[] = ["approved", "rejected"];

function validateBody(
  body: unknown,
):
  | { ok: true; data: AdminRoleRequestReviewInput }
  | { ok: false; status: number; message: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, status: 400, message: "Invalid JSON body." };
  }

  const status = (body as Record<string, unknown>).status;
  const reviewNotes = (body as Record<string, unknown>).review_notes;

  if (!REVIEW_STATUSES.includes(status as AdminRoleReviewStatus)) {
    return {
      ok: false,
      status: 400,
      message: "status must be approved or rejected.",
    };
  }

  if (reviewNotes != null && typeof reviewNotes !== "string") {
    return {
      ok: false,
      status: 400,
      message: "review_notes must be a string when provided.",
    };
  }

  const normalizedReviewNotes = reviewNotes?.trim();
  if (normalizedReviewNotes && normalizedReviewNotes.length > 1000) {
    return {
      ok: false,
      status: 400,
      message: "review_notes must be 1000 characters or fewer.",
    };
  }

  return {
    ok: true,
    data: {
      status: status as AdminRoleReviewStatus,
      review_notes: normalizedReviewNotes || undefined,
    },
  };
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
    return NextResponse.json(
      { message: "Admin access request ID is required." },
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

  const { data, error } = await admin.supabase.rpc("review_admin_role_request", {
    p_request_id: id,
    p_status: validation.data.status,
    p_review_notes: validation.data.review_notes ?? null,
  });

  if (error) {
    const message = error.message.toLowerCase();

    if (message.includes("not found")) {
      return NextResponse.json(
        { message: "Admin access request not found." },
        { status: 404 },
      );
    }

    if (message.includes("only pending")) {
      return NextResponse.json(
        { message: "Only pending requests can be reviewed." },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { message: "Failed to review admin access request." },
      { status: 500 },
    );
  }

  const reviewed = (data as Array<{
    request_id: string;
    user_id: string;
    status: AdminRoleReviewStatus;
    email_snapshot: string;
  }> | null)?.[0];

  if (!reviewed) {
    return NextResponse.json(
      { message: "Admin access request not found." },
      { status: 404 },
    );
  }

  await insertAdminAuditLog(admin, {
    admin_user_id: admin.user.id,
    action_type: `admin_role_request_${validation.data.status}`,
    target_type: "admin_role_request",
    target_id: reviewed.request_id,
    details: {
      requested_user_id: reviewed.user_id,
      email_snapshot: reviewed.email_snapshot,
      status: reviewed.status,
      review_notes: validation.data.review_notes ?? null,
      granted_role: reviewed.status === "approved" ? "admin" : null,
    },
  });

  const { data: requestRow, error: requestError } = await admin.supabase
    .from("admin_role_requests")
    .select(
      "id, user_id, email_snapshot, full_name, role_title, reason, intended_actions, team_context, referral_contact, status, review_notes, reviewed_by, reviewed_at, created_at, updated_at",
    )
    .eq("id", reviewed.request_id)
    .maybeSingle<AdminRoleRequestQueueItem>();

  if (requestError || !requestRow) {
    return NextResponse.json(
      { message: "Request was reviewed but could not be reloaded." },
      { status: 500 },
    );
  }

  return NextResponse.json(requestRow);
}
