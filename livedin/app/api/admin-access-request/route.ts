import { NextResponse, type NextRequest } from "next/server";
import { buildAdminRequestStatus, isEmailEligibleForAdminRequest } from "@/lib/admin-role-requests";
import { createUserClient } from "@/lib/admin-auth";
import type {
  AdminRoleRequestCreateInput,
  AdminRoleRequestCreateResponse,
  AdminRoleRequestStatusResponse,
  CurrentUserRole,
} from "@/lib/types";

type ProfileRow = {
  role: CurrentUserRole;
};

type RequestRow = NonNullable<AdminRoleRequestStatusResponse["latestRequest"]>;

function getBearerToken(req: NextRequest): string | null {
  const authHeader = req.headers.get("Authorization");
  return authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;
}

async function getAuthenticatedContext(req: NextRequest) {
  const token = getBearerToken(req);
  if (!token) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { message: "Unauthorized. Sign in to continue." },
        { status: 401 },
      ),
    };
  }

  const supabase = createUserClient(token);
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(token);

  if (userError || !user) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { message: "Invalid or expired session. Please sign in again." },
        { status: 401 },
      ),
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle<ProfileRow>();

  if (profileError || !profile) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { message: "Profile could not be loaded for this account." },
        { status: 500 },
      ),
    };
  }

  return {
    ok: true as const,
    supabase,
    user,
    profile,
  };
}

function validateCreateBody(
  body: unknown,
): { ok: true; data: AdminRoleRequestCreateInput } | { ok: false; message: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, message: "Invalid JSON body." };
  }

  const rawReason = (body as Record<string, unknown>).reason;
  const rawTeamContext = (body as Record<string, unknown>).team_context;

  if (typeof rawReason !== "string") {
    return { ok: false, message: "reason is required." };
  }

  const reason = rawReason.trim();
  if (!reason) {
    return { ok: false, message: "reason is required." };
  }
  if (reason.length > 1000) {
    return { ok: false, message: "reason must be 1000 characters or fewer." };
  }

  let team_context: string | undefined;
  if (rawTeamContext != null) {
    if (typeof rawTeamContext !== "string") {
      return { ok: false, message: "team_context must be a string when provided." };
    }
    const trimmed = rawTeamContext.trim();
    if (trimmed.length > 160) {
      return { ok: false, message: "team_context must be 160 characters or fewer." };
    }
    team_context = trimmed || undefined;
  }

  return {
    ok: true,
    data: {
      reason,
      team_context,
    },
  };
}

export async function GET(req: NextRequest) {
  const auth = await getAuthenticatedContext(req);
  if (!auth.ok) {
    return auth.response;
  }

  const { supabase, user, profile } = auth;
  const { data: latestRequest, error } = await supabase
    .from("admin_role_requests")
    .select(
      "id, reason, team_context, status, review_notes, reviewed_at, created_at, updated_at",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<RequestRow>();

  if (error) {
    return NextResponse.json(
      { message: "Failed to load admin request status." },
      { status: 500 },
    );
  }

  const status = buildAdminRequestStatus({
    currentRole: profile.role,
    email: user.email,
    latestRequest,
  });

  return NextResponse.json(status);
}

export async function POST(req: NextRequest) {
  const auth = await getAuthenticatedContext(req);
  if (!auth.ok) {
    return auth.response;
  }

  const { supabase, user, profile } = auth;

  if (profile.role === "admin") {
    return NextResponse.json(
      { message: "This account already has admin access." },
      { status: 409 },
    );
  }

  if (!user.email) {
    return NextResponse.json(
      { message: "This account does not have a usable email address." },
      { status: 400 },
    );
  }

  if (!isEmailEligibleForAdminRequest(user.email)) {
    return NextResponse.json(
      { message: "This account is not eligible to request admin access." },
      { status: 403 },
    );
  }

  const { data: latestRequest, error: latestRequestError } = await supabase
    .from("admin_role_requests")
    .select("status")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<{ status: "pending" | "approved" | "rejected" }>();

  if (latestRequestError) {
    return NextResponse.json(
      { message: "Failed to check existing admin requests." },
      { status: 500 },
    );
  }

  if (latestRequest?.status === "pending") {
    return NextResponse.json(
      { message: "You already have a pending admin access request." },
      { status: 409 },
    );
  }

  if (latestRequest?.status === "approved") {
    return NextResponse.json(
      { message: "This account already has an approved admin access request." },
      { status: 409 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body." }, { status: 400 });
  }

  const validation = validateCreateBody(body);
  if (!validation.ok) {
    return NextResponse.json({ message: validation.message }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("admin_role_requests")
    .insert({
      user_id: user.id,
      email_snapshot: user.email,
      reason: validation.data.reason,
      team_context: validation.data.team_context ?? null,
      status: "pending",
    } as never)
    .select("status, created_at")
    .single<{ status: "pending"; created_at: string }>();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { message: "You already have a pending admin access request." },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { message: "Failed to submit admin access request." },
      { status: 500 },
    );
  }

  const response: AdminRoleRequestCreateResponse = {
    status: data.status,
    submittedAt: data.created_at,
  };

  return NextResponse.json(response, { status: 201 });
}
