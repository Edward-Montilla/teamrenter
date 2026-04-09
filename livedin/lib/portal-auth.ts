/**
 * Portal auth for API routes. Validates Bearer token and ensures user has
 * role = 'landlord' or 'admin'. Modeled after lib/admin-auth.ts.
 */

import { type NextRequest } from "next/server";
import { createUserClient } from "@/lib/admin-auth";

export type PortalContext = {
  supabase: ReturnType<typeof createUserClient>;
  user: { id: string; role: string };
};

export async function getLandlordFromRequest(
  req: NextRequest
): Promise<PortalContext | null> {
  const authHeader = req.headers.get("Authorization");
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : null;
  if (!token) return null;

  const supabase = createUserClient(token);
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(token);
  if (userError || !user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile || (profile.role !== "landlord" && profile.role !== "admin")) {
    return null;
  }

  return { supabase, user: { id: user.id, role: profile.role } };
}
