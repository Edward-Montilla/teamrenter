import { NextResponse, type NextRequest } from "next/server";
import { getLandlordFromRequest } from "@/lib/portal-auth";
import type { NotificationPreference } from "@/lib/types";

const KEYS: (keyof NotificationPreference)[] = [
  "new_review_alert",
  "review_response_approved",
  "weekly_summary",
  "review_gap_alert",
  "team_activity_alert",
];

function parseBody(body: unknown): Partial<NotificationPreference> | null {
  if (!body || typeof body !== "object") return null;
  const o = body as Record<string, unknown>;
  const out: Partial<NotificationPreference> = {};
  for (const key of KEYS) {
    if (typeof o[key] === "boolean") {
      out[key] = o[key] as boolean;
    }
  }
  return Object.keys(out).length ? out : null;
}

export async function GET(req: NextRequest) {
  const portal = await getLandlordFromRequest(req);
  if (!portal) {
    return NextResponse.json(
      { message: "Forbidden. Landlord or admin access required." },
      { status: 403 },
    );
  }

  if (portal.user.role !== "landlord") {
    return NextResponse.json(
      { message: "Only landlords have notification preferences here." },
      { status: 403 },
    );
  }

  const { data, error } = await portal.supabase
    .from("notification_preferences")
    .select(
      "new_review_alert, review_response_approved, weekly_summary, review_gap_alert, team_activity_alert",
    )
    .eq("user_id", portal.user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { message: "Failed to load preferences." },
      { status: 500 },
    );
  }

  if (!data) {
    const defaults: NotificationPreference = {
      new_review_alert: true,
      review_response_approved: true,
      weekly_summary: false,
      review_gap_alert: true,
      team_activity_alert: true,
    };
    return NextResponse.json(defaults);
  }

  return NextResponse.json(data as NotificationPreference);
}

export async function PUT(req: NextRequest) {
  const portal = await getLandlordFromRequest(req);
  if (!portal) {
    return NextResponse.json(
      { message: "Forbidden. Landlord or admin access required." },
      { status: 403 },
    );
  }

  if (portal.user.role !== "landlord") {
    return NextResponse.json(
      { message: "Only landlords can update notification preferences." },
      { status: 403 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body." }, { status: 400 });
  }

  const partial = parseBody(body);
  if (!partial) {
    return NextResponse.json(
      { message: "Provide at least one boolean preference field." },
      { status: 400 },
    );
  }

  const { data: existing } = await portal.supabase
    .from("notification_preferences")
    .select("user_id")
    .eq("user_id", portal.user.id)
    .maybeSingle();

  if (existing) {
    const { error } = await portal.supabase
      .from("notification_preferences")
      .update(partial as never)
      .eq("user_id", portal.user.id);

    if (error) {
      return NextResponse.json(
        { message: "Failed to update preferences." },
        { status: 500 },
      );
    }
  } else {
    const defaults: NotificationPreference = {
      new_review_alert: true,
      review_response_approved: true,
      weekly_summary: false,
      review_gap_alert: true,
      team_activity_alert: true,
    };
    const merged = { ...defaults, ...partial, user_id: portal.user.id };
    const { error } = await portal.supabase
      .from("notification_preferences")
      .insert(merged as never);

    if (error) {
      return NextResponse.json(
        { message: "Failed to save preferences." },
        { status: 500 },
      );
    }
  }

  const { data: out } = await portal.supabase
    .from("notification_preferences")
    .select(
      "new_review_alert, review_response_approved, weekly_summary, review_gap_alert, team_activity_alert",
    )
    .eq("user_id", portal.user.id)
    .maybeSingle();

  return NextResponse.json((out ?? partial) as NotificationPreference);
}
