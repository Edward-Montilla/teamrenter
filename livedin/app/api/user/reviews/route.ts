import { NextResponse, type NextRequest } from "next/server";
import { createUserClient } from "@/lib/admin-auth";
import type { ReviewStatus } from "@/lib/types";

async function getVerifiedUser(req: NextRequest) {
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

  const { data: profile } = await supabase
    .from("profiles")
    .select("email_verified")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile?.email_verified) return null;

  return { supabase, user: { id: user.id } };
}

type ReviewRow = {
  id: string;
  property_id: string;
  status: ReviewStatus;
  created_at: string;
  updated_at: string;
  properties: { display_name: string } | null;
};

export async function GET(req: NextRequest) {
  const ctx = await getVerifiedUser(req);
  if (!ctx) {
    return NextResponse.json(
      { message: "Authentication required." },
      { status: 401 },
    );
  }

  const { data, error } = await ctx.supabase
    .from("reviews")
    .select(
      `id, property_id, status, created_at, updated_at,
       properties (display_name)`,
    )
    .eq("user_id", ctx.user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { message: "Failed to load reviews" },
      { status: 500 },
    );
  }

  const items = ((data ?? []) as unknown as ReviewRow[]).map((row) => ({
    id: row.id,
    property_id: row.property_id,
    property_display_name: row.properties?.display_name ?? "Property",
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }));

  return NextResponse.json({ items });
}
