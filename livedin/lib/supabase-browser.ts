"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cachedClient: SupabaseClient | null = null;

/**
 * Supabase client for browser (auth + optional reads).
 * Uses NEXT_PUBLIC_ env vars so it can run client-side.
 * Returns null if env is not set (e.g. before Slice 12 auth is configured).
 */
export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (typeof window === "undefined") return null;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  if (cachedClient) return cachedClient;
  cachedClient = createClient(url, anonKey);
  return cachedClient;
}
