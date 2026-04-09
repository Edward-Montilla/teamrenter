import { NextResponse, type NextRequest } from "next/server";
import { getLandlordFromRequest } from "@/lib/portal-auth";
import type { TeamMemberItem } from "@/lib/types";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const portal = await getLandlordFromRequest(req);
  if (!portal) {
    return NextResponse.json(
      { message: "Forbidden. Landlord or admin access required." },
      { status: 403 },
    );
  }

  if (portal.user.role !== "landlord") {
    return NextResponse.json(
      { message: "Only portfolio owners can change team roles." },
      { status: 403 },
    );
  }

  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body." }, { status: 400 });
  }

  const role = (body as { role?: string }).role;
  if (!role || !["viewer", "editor", "admin"].includes(role)) {
    return NextResponse.json({ message: "Invalid role." }, { status: 400 });
  }

  const { data: existing } = await portal.supabase
    .from("team_members")
    .select("id")
    .eq("id", id)
    .eq("owner_user_id", portal.user.id)
    .maybeSingle();

  if (!existing) {
    return NextResponse.json({ message: "Team member not found." }, { status: 404 });
  }

  const { data: updated, error } = await portal.supabase
    .from("team_members")
    .update({ role: role as TeamMemberItem["role"] } as never)
    .eq("id", id)
    .eq("owner_user_id", portal.user.id)
    .select(
      "id, owner_user_id, member_user_id, role, invited_email, accepted_at, created_at",
    )
    .maybeSingle();

  if (error || !updated) {
    return NextResponse.json(
      { message: "Failed to update role." },
      { status: 500 },
    );
  }

  const row = updated as {
    id: string;
    owner_user_id: string;
    member_user_id: string;
    role: TeamMemberItem["role"];
    invited_email: string;
    accepted_at: string | null;
    created_at: string;
  };

  return NextResponse.json({
    id: row.id,
    owner_user_id: row.owner_user_id,
    member_user_id: row.member_user_id,
    member_email: row.invited_email,
    role: row.role,
    accepted_at: row.accepted_at,
    created_at: row.created_at,
  } satisfies TeamMemberItem);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const portal = await getLandlordFromRequest(req);
  if (!portal) {
    return NextResponse.json(
      { message: "Forbidden. Landlord or admin access required." },
      { status: 403 },
    );
  }

  if (portal.user.role !== "landlord") {
    return NextResponse.json(
      { message: "Only portfolio owners can remove team members." },
      { status: 403 },
    );
  }

  const { id } = await params;

  const { error } = await portal.supabase
    .from("team_members")
    .delete()
    .eq("id", id)
    .eq("owner_user_id", portal.user.id);

  if (error) {
    return NextResponse.json(
      { message: "Failed to remove team member." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
