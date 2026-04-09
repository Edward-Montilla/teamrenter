import { NextResponse, type NextRequest } from "next/server";
import { createUserClient } from "@/lib/admin-auth";
import { validateShortlistToggle } from "@/lib/validation/shortlist";
import type { UserShortlistItem, ShortlistToggleResponse } from "@/lib/types";

async function getUserFromRequest(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : null;
  if (!token) return null;

  const supabase = createUserClient(token);
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);
  if (error || !user) return null;

  return { supabase, user: { id: user.id } };
}

type ShortlistRow = {
  property_id: string;
  created_at: string;
  properties: {
    display_name: string;
    address_line1: string;
    city: string;
    property_aggregates: Array<{
      display_trustscore_0_5: number;
    }> | null;
  } | null;
};

export async function GET(req: NextRequest) {
  const ctx = await getUserFromRequest(req);
  if (!ctx) {
    return NextResponse.json(
      { message: "Authentication required." },
      { status: 401 },
    );
  }

  const { data, error } = await ctx.supabase
    .from("user_shortlists")
    .select(
      `property_id, created_at,
       properties (
         display_name, address_line1, city,
         property_aggregates (display_trustscore_0_5)
       )`,
    )
    .eq("user_id", ctx.user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { message: "Failed to load shortlist" },
      { status: 500 },
    );
  }

  const items: UserShortlistItem[] = ((data ?? []) as unknown as ShortlistRow[]).map(
    (row) => {
      const prop = row.properties;
      const agg = prop?.property_aggregates?.[0] ?? null;
      return {
        property_id: row.property_id,
        display_name: prop?.display_name ?? "",
        address_line1: prop?.address_line1 ?? "",
        city: prop?.city ?? "",
        trustscore_display_0_5: (agg?.display_trustscore_0_5 ?? 0) as UserShortlistItem["trustscore_display_0_5"],
        added_at: row.created_at,
      };
    },
  );

  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const ctx = await getUserFromRequest(req);
  if (!ctx) {
    return NextResponse.json(
      { message: "Authentication required." },
      { status: 401 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body." }, { status: 400 });
  }

  const validation = validateShortlistToggle(body as Record<string, unknown>);
  if (!validation.valid) {
    return NextResponse.json(
      { message: Object.values(validation.errors)[0] },
      { status: 400 },
    );
  }

  const propertyId = (body as { property_id: string }).property_id.trim();

  const { data: existing } = await ctx.supabase
    .from("user_shortlists")
    .select("id")
    .eq("user_id", ctx.user.id)
    .eq("property_id", propertyId)
    .maybeSingle();

  if (existing) {
    const { error: deleteError } = await ctx.supabase
      .from("user_shortlists")
      .delete()
      .eq("id", existing.id);

    if (deleteError) {
      return NextResponse.json(
        { message: "Failed to remove from shortlist." },
        { status: 500 },
      );
    }

    const response: ShortlistToggleResponse = {
      action: "removed",
      property_id: propertyId,
    };
    return NextResponse.json(response);
  }

  const { error: insertError } = await ctx.supabase
    .from("user_shortlists")
    .insert({
      user_id: ctx.user.id,
      property_id: propertyId,
    } as never);

  if (insertError) {
    if (
      insertError.code === "PGRST301" ||
      insertError.message?.toLowerCase().includes("row-level security")
    ) {
      return NextResponse.json(
        { message: "You must be a verified user to shortlist properties." },
        { status: 403 },
      );
    }
    return NextResponse.json(
      { message: "Failed to add to shortlist." },
      { status: 500 },
    );
  }

  const response: ShortlistToggleResponse = {
    action: "added",
    property_id: propertyId,
  };
  return NextResponse.json(response, { status: 201 });
}
