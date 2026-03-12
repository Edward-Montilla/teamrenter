import { NextResponse, type NextRequest } from "next/server";
import { getAdminFromRequest, insertAdminAuditLog } from "@/lib/admin-auth";
import type {
  AdminUserUpdateInput,
  CurrentUserRole,
} from "@/lib/types";

const USER_ROLES: CurrentUserRole[] = ["public", "verified", "admin"];

type ProfileRow = {
  user_id: string;
  role: CurrentUserRole;
  email_verified: boolean;
};

function validateBody(
  body: unknown,
):
  | { ok: true; data: AdminUserUpdateInput }
  | { ok: false; status: number; message: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, status: 400, message: "Invalid JSON body." };
  }

  const candidate = body as Record<string, unknown>;
  const data: AdminUserUpdateInput = {};

  if (candidate.role !== undefined) {
    if (!USER_ROLES.includes(candidate.role as CurrentUserRole)) {
      return {
        ok: false,
        status: 400,
        message: "role must be public, verified, or admin.",
      };
    }

    data.role = candidate.role as CurrentUserRole;
  }

  if (candidate.email_verified !== undefined) {
    if (typeof candidate.email_verified !== "boolean") {
      return {
        ok: false,
        status: 400,
        message: "email_verified must be a boolean when provided.",
      };
    }

    data.email_verified = candidate.email_verified;
  }

  if (Object.keys(data).length === 0) {
    return { ok: false, status: 400, message: "No valid fields to update." };
  }

  return { ok: true, data };
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
    return NextResponse.json({ message: "User ID is required." }, { status: 400 });
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

  const { data: currentProfile, error: currentError } = await admin.supabase
    .from("profiles")
    .select("user_id, role, email_verified")
    .eq("user_id", id)
    .maybeSingle<ProfileRow>();

  if (currentError) {
    return NextResponse.json(
      { message: "Failed to load the target user." },
      { status: 500 },
    );
  }

  if (!currentProfile) {
    return NextResponse.json({ message: "User not found." }, { status: 404 });
  }

  const nextRole = validation.data.role ?? currentProfile.role;
  const nextEmailVerified =
    validation.data.email_verified ?? currentProfile.email_verified;

  if (id === admin.user.id && nextRole !== "admin") {
    return NextResponse.json(
      { message: "You cannot remove your own admin role." },
      { status: 409 },
    );
  }

  if (currentProfile.role === "admin" && nextRole !== "admin") {
    const { count, error: adminCountError } = await admin.supabase
      .from("profiles")
      .select("user_id", { count: "exact", head: true })
      .eq("role", "admin");

    if (adminCountError) {
      return NextResponse.json(
        { message: "Failed to validate remaining admin users." },
        { status: 500 },
      );
    }

    if ((count ?? 0) <= 1) {
      return NextResponse.json(
        { message: "At least one admin account must remain." },
        { status: 409 },
      );
    }
  }

  if (nextRole === "admin" && !nextEmailVerified) {
    return NextResponse.json(
      { message: "Only email-verified users can hold the admin role." },
      { status: 409 },
    );
  }

  const updatePayload: AdminUserUpdateInput = {};
  if (validation.data.role !== undefined) {
    updatePayload.role = validation.data.role;
  }
  if (validation.data.email_verified !== undefined) {
    updatePayload.email_verified = validation.data.email_verified;
  }

  const { error: updateError } = await admin.supabase
    .from("profiles")
    .update(updatePayload as never)
    .eq("user_id", id);

  if (updateError) {
    return NextResponse.json(
      { message: "Failed to update user profile." },
      { status: 500 },
    );
  }

  await insertAdminAuditLog(admin, {
    admin_user_id: admin.user.id,
    action_type: "user_profile_update",
    target_type: "profile",
    target_id: id,
    details: {
      previous_role: currentProfile.role,
      next_role: nextRole,
      previous_email_verified: currentProfile.email_verified,
      next_email_verified: nextEmailVerified,
    },
  });

  const { data: updatedProfile, error: reloadError } = await admin.supabase
    .from("profiles")
    .select("user_id, role, email_verified")
    .eq("user_id", id)
    .maybeSingle<ProfileRow>();

  if (reloadError || !updatedProfile) {
    return NextResponse.json(
      { message: "User was updated but could not be reloaded." },
      { status: 500 },
    );
  }

  return NextResponse.json(updatedProfile);
}
