/**
 * Admin auth for API routes. Validates Bearer token and ensures user has role = 'admin'.
 * Use with createUserClient from a shared auth module if we consolidate later.
 */

import { type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

export function createUserClient(accessToken: string) {
  const url = getEnv("SUPABASE_URL");
  const anonKey = getEnv("SUPABASE_ANON_KEY");
  return createClient(url, anonKey, {
    global: {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  });
}

export type AdminContext = {
  supabase: ReturnType<typeof createUserClient>;
  user: { id: string };
};

export type AdminAuditLogInsert = {
  admin_user_id: string;
  action_type: string;
  target_type: string;
  target_id: string;
  details?: Record<string, unknown> | null;
};

export async function insertAdminAuditLog(
  admin: Pick<AdminContext, "supabase">,
  entry: AdminAuditLogInsert
) {
  const payload = entry as never;
  await admin.supabase.from("admin_audit_log").insert(payload);
}

/**
 * Returns admin context if request has valid Bearer token and user has role 'admin'.
 * Returns null otherwise (caller should respond with 401 or 403).
 */
export async function getAdminFromRequest(
  req: NextRequest
): Promise<AdminContext | null> {
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

  if (profile?.role !== "admin") return null;

  return { supabase, user: { id: user.id } };
}
