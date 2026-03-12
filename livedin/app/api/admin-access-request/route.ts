import { NextResponse, type NextRequest } from "next/server";
import { buildAdminRequestStatus, isEmailEligibleForAdminRequest } from "@/lib/admin-role-requests";
import { createUserClient } from "@/lib/admin-auth";
import type {
  AdminIntendedAction,
  AdminRoleRequestCreateInput,
  AdminRoleRequestCreateResponse,
  AdminRoleRequestStatusResponse,
  CurrentUserRole,
} from "@/lib/types";
import { ALL_INTENDED_ACTIONS } from "@/lib/types";

type ProfileRow = {
  role: CurrentUserRole;
};

type RequestRow = NonNullable<AdminRoleRequestStatusResponse["latestRequest"]>;
type BootstrapStatusRow = {
  has_admin_accounts: boolean;
  can_claim: boolean;
};

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

async function getBootstrapStatus(supabase: ReturnType<typeof createUserClient>) {
  const { data, error } = await supabase.rpc("get_first_admin_bootstrap_status");
  const row = (data as BootstrapStatusRow[] | null)?.[0];

  if (error || !row) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { message: "Failed to load first-admin bootstrap status." },
        { status: 500 },
      ),
    };
  }

  return {
    ok: true as const,
    data: row,
  };
}

function validateCreateBody(
  body: unknown,
): { ok: true; data: AdminRoleRequestCreateInput } | { ok: false; message: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, message: "Invalid JSON body." };
  }

  const raw = body as Record<string, unknown>;

  // full_name — required, max 100
  if (typeof raw.full_name !== "string") {
    return { ok: false, message: "full_name is required." };
  }
  const full_name = raw.full_name.trim();
  if (!full_name) {
    return { ok: false, message: "full_name is required." };
  }
  if (full_name.length > 100) {
    return { ok: false, message: "full_name must be 100 characters or fewer." };
  }

  // role_title — required, max 100
  if (typeof raw.role_title !== "string") {
    return { ok: false, message: "role_title is required." };
  }
  const role_title = raw.role_title.trim();
  if (!role_title) {
    return { ok: false, message: "role_title is required." };
  }
  if (role_title.length > 100) {
    return { ok: false, message: "role_title must be 100 characters or fewer." };
  }

  // reason — required, max 1000
  if (typeof raw.reason !== "string") {
    return { ok: false, message: "reason is required." };
  }
  const reason = raw.reason.trim();
  if (!reason) {
    return { ok: false, message: "reason is required." };
  }
  if (reason.length > 1000) {
    return { ok: false, message: "reason must be 1000 characters or fewer." };
  }

  // intended_actions — required, non-empty array of valid action strings
  if (!Array.isArray(raw.intended_actions) || raw.intended_actions.length === 0) {
    return { ok: false, message: "Select at least one intended admin action." };
  }
  const validActions = new Set<string>(ALL_INTENDED_ACTIONS);
  const intended_actions: AdminIntendedAction[] = [];
  for (const action of raw.intended_actions) {
    if (typeof action !== "string" || !validActions.has(action)) {
      return { ok: false, message: `Invalid intended action: ${String(action)}` };
    }
    intended_actions.push(action as AdminIntendedAction);
  }

  // team_context — optional, max 160
  let team_context: string | undefined;
  if (raw.team_context != null) {
    if (typeof raw.team_context !== "string") {
      return { ok: false, message: "team_context must be a string when provided." };
    }
    const trimmed = raw.team_context.trim();
    if (trimmed.length > 160) {
      return { ok: false, message: "team_context must be 160 characters or fewer." };
    }
    team_context = trimmed || undefined;
  }

  // referral_contact — optional, max 200
  let referral_contact: string | undefined;
  if (raw.referral_contact != null) {
    if (typeof raw.referral_contact !== "string") {
      return { ok: false, message: "referral_contact must be a string when provided." };
    }
    const trimmed = raw.referral_contact.trim();
    if (trimmed.length > 200) {
      return { ok: false, message: "referral_contact must be 200 characters or fewer." };
    }
    referral_contact = trimmed || undefined;
  }

  return {
    ok: true,
    data: {
      full_name,
      role_title,
      reason,
      intended_actions,
      team_context,
      referral_contact,
    },
  };
}

export async function GET(req: NextRequest) {
  const auth = await getAuthenticatedContext(req);
  if (!auth.ok) {
    return auth.response;
  }

  const { supabase, user, profile } = auth;
  const bootstrap = await getBootstrapStatus(supabase);
  if (!bootstrap.ok) {
    return bootstrap.response;
  }

  const { data: latestRequest, error } = await supabase
    .from("admin_role_requests")
    .select(
      "id, full_name, role_title, reason, intended_actions, team_context, referral_contact, status, review_notes, reviewed_at, created_at, updated_at",
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
    bootstrapRequired: !bootstrap.data.has_admin_accounts,
    bootstrapEligible: bootstrap.data.can_claim,
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

  const bootstrap = await getBootstrapStatus(supabase);
  if (!bootstrap.ok) {
    return bootstrap.response;
  }

  if (!bootstrap.data.has_admin_accounts) {
    if (bootstrap.data.can_claim) {
      const { error } = await supabase.rpc("claim_first_admin");

      if (error) {
        const message = error.message.toLowerCase();

        if (message.includes("already exists")) {
          return NextResponse.json(
            { message: "An admin account already exists. Refresh and try again." },
            { status: 409 },
          );
        }

        if (message.includes("not allowed")) {
          return NextResponse.json(
            { message: "This account is not allowed to claim first admin." },
            { status: 403 },
          );
        }

        if (message.includes("email address is required")) {
          return NextResponse.json(
            { message: "A usable email address is required to claim first admin." },
            { status: 400 },
          );
        }

        return NextResponse.json(
          { message: "Failed to claim the first admin role." },
          { status: 500 },
        );
      }

      const response: AdminRoleRequestCreateResponse = {
        status: "approved",
        promotedImmediately: true,
      };

      return NextResponse.json(response, { status: 200 });
    }

    return NextResponse.json(
      {
        message:
          "No admin exists yet. A configured bootstrap account must claim the initial admin role before access requests can be reviewed.",
      },
      { status: 409 },
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
      full_name: validation.data.full_name,
      role_title: validation.data.role_title,
      reason: validation.data.reason,
      intended_actions: validation.data.intended_actions,
      team_context: validation.data.team_context ?? null,
      referral_contact: validation.data.referral_contact ?? null,
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
