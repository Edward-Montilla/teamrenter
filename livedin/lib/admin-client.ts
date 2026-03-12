"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

export async function getAdminAccessToken(): Promise<string> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    throw new Error("Supabase auth is not configured.");
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error("Not signed in.");
  }

  return session.access_token;
}

export async function adminFetch<T>(
  input: string,
  init?: RequestInit,
): Promise<T> {
  const token = await getAdminAccessToken();
  const response = await fetch(input, {
    ...init,
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const json = (await response.json().catch(() => ({}))) as {
      message?: string;
    };
    throw new Error(json.message ?? "Admin request failed.");
  }

  return (await response.json()) as T;
}
