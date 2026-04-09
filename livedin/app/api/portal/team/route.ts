import { NextResponse, type NextRequest } from "next/server";
import { getLandlordFromRequest } from "@/lib/portal-auth";
import { createServiceRoleClient } from "@/lib/supabase-service-role";
import type { TeamMemberItem, TeamMemberInviteInput } from "@/lib/types";

type TeamRow = {
  id: string;
  owner_user_id: string;
  member_user_id: string;
  role: TeamMemberItem["role"];
  invited_email: string;
  accepted_at: string | null;
  created_at: string;
};

function mapRow(row: TeamRow): TeamMemberItem {
  return {
    id: row.id,
    owner_user_id: row.owner_user_id,
    member_user_id: row.member_user_id,
    member_email: row.invited_email,
    role: row.role,
    accepted_at: row.accepted_at,
    created_at: row.created_at,
  };
}

export async function GET(req: NextRequest) {
  const portal = await getLandlordFromRequest(req);
  if (!portal) {
    return NextResponse.json(
      { message: "Forbidden. Landlord or admin access required." },
      { status: 403 },
    );
  }

  const { data, error } = await portal.supabase
    .from("team_members")
    .select(
      "id, owner_user_id, member_user_id, role, invited_email, accepted_at, created_at",
    )
    .eq("owner_user_id", portal.user.id)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json(
      { message: "Failed to load team" },
      { status: 500 },
    );
  }

  const items = ((data ?? []) as TeamRow[]).map(mapRow);
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const portal = await getLandlordFromRequest(req);
  if (!portal) {
    return NextResponse.json(
      { message: "Forbidden. Landlord or admin access required." },
      { status: 403 },
    );
  }

  if (portal.user.role !== "landlord") {
    return NextResponse.json(
      { message: "Only portfolio owners can invite team members." },
      { status: 403 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = body as Partial<TeamMemberInviteInput>;
  const email = typeof parsed.email === "string" ? parsed.email.trim().toLowerCase() : "";
  const role = parsed.role;
  if (!email || !["viewer", "editor", "admin"].includes(role ?? "")) {
    return NextResponse.json(
      { message: "Valid email and role (viewer, editor, admin) are required." },
      { status: 400 },
    );
  }

  const service = createServiceRoleClient();
  if (!service) {
    return NextResponse.json(
      {
        message:
          "Team invites require SUPABASE_SERVICE_ROLE_KEY to be set on the server.",
      },
      { status: 503 },
    );
  }

  const { data: listData, error: listError } =
    await service.auth.admin.listUsers({ page: 1, perPage: 1000 });

  if (listError) {
    return NextResponse.json(
      { message: "Could not look up user by email." },
      { status: 500 },
    );
  }

  const targetUser = listData.users.find(
    (u) => u.email?.toLowerCase() === email,
  );
  if (!targetUser) {
    return NextResponse.json(
      { message: "No registered user found with that email." },
      { status: 404 },
    );
  }

  if (targetUser.id === portal.user.id) {
    return NextResponse.json(
      { message: "You cannot invite yourself." },
      { status: 400 },
    );
  }

  const { data: inserted, error: insertError } = await portal.supabase
    .from("team_members")
    .insert({
      owner_user_id: portal.user.id,
      member_user_id: targetUser.id,
      role: role as TeamMemberItem["role"],
      invited_email: email,
      accepted_at: new Date().toISOString(),
    } as never)
    .select(
      "id, owner_user_id, member_user_id, role, invited_email, accepted_at, created_at",
    )
    .maybeSingle();

  if (insertError) {
    if (insertError.code === "23505") {
      return NextResponse.json(
        { message: "That user is already on your team." },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { message: "Failed to add team member." },
      { status: 500 },
    );
  }

  return NextResponse.json(mapRow(inserted as TeamRow), { status: 201 });
}
