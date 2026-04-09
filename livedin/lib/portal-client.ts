"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import type {
  PortfolioOverviewResponse,
  BenchmarkResponse,
  RenterSignalsResponse,
  ReviewResponseDraft,
  ReviewResponseCreateInput,
  ShortlistToggleResponse,
  ShortlistToggleInput,
  UserShortlistItem,
  TeamMemberItem,
  TeamMemberInviteInput,
  CompanyProfile,
  NotificationPreference,
} from "@/lib/types";

async function getPortalAccessToken(): Promise<string> {
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

export async function portalFetch<T>(
  input: string,
  init?: RequestInit,
): Promise<T> {
  const token = await getPortalAccessToken();
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
    throw new Error(json.message ?? "Portal request failed.");
  }

  return (await response.json()) as T;
}

export function fetchPortalMe() {
  return portalFetch<{ id: string; role: string }>("/api/portal/me");
}

export function fetchPortfolioProperties() {
  return portalFetch<PortfolioOverviewResponse>("/api/portal/properties");
}

export function fetchPortfolioReviews(propertyId: string) {
  return portalFetch<{ items: unknown[] }>(
    `/api/portal/properties/${propertyId}/reviews`,
  );
}

export function fetchPortfolioAnalytics(propertyId: string) {
  return portalFetch<{ property_id: string; aggregates: unknown }>(
    `/api/portal/properties/${propertyId}/analytics`,
  );
}

export function fetchBenchmarks() {
  return portalFetch<BenchmarkResponse>("/api/portal/benchmarks");
}

export function fetchSignals() {
  return portalFetch<RenterSignalsResponse>("/api/portal/signals");
}

export function submitReviewResponse(
  reviewId: string,
  input: ReviewResponseCreateInput,
) {
  return portalFetch<ReviewResponseDraft>(
    `/api/portal/reviews/${reviewId}/respond`,
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
}

export function fetchShortlist() {
  return portalFetch<{ items: UserShortlistItem[] }>("/api/user/shortlist");
}

export function toggleShortlist(input: ShortlistToggleInput) {
  return portalFetch<ShortlistToggleResponse>("/api/user/shortlist", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function fetchPortalTeam() {
  return portalFetch<{ items: TeamMemberItem[] }>("/api/portal/team");
}

export function invitePortalTeamMember(input: TeamMemberInviteInput) {
  return portalFetch<TeamMemberItem>("/api/portal/team", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updatePortalTeamMember(id: string, role: TeamMemberItem["role"]) {
  return portalFetch<TeamMemberItem>(`/api/portal/team/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });
}

export function removePortalTeamMember(id: string) {
  return portalFetch<{ ok: boolean }>(`/api/portal/team/${id}`, {
    method: "DELETE",
  });
}

export function fetchCompanyProfile() {
  return portalFetch<CompanyProfile>("/api/portal/company-profile");
}

export function saveCompanyProfile(input: Partial<CompanyProfile> & { company_name: string }) {
  return portalFetch<CompanyProfile>("/api/portal/company-profile", {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export function fetchNotificationPreferences() {
  return portalFetch<NotificationPreference>("/api/portal/notification-preferences");
}

export function saveNotificationPreferences(partial: Partial<NotificationPreference>) {
  return portalFetch<NotificationPreference>("/api/portal/notification-preferences", {
    method: "PUT",
    body: JSON.stringify(partial),
  });
}
