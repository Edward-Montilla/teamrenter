"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { ThemeMenu } from "@/components/theme/ThemeMenu";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import type { AdminRoleRequestStatusResponse } from "@/lib/types";
import {
  pageContainerClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/lib/ui";

type HeaderProfile = {
  role: string;
  email_verified: boolean;
};

type AuthState = {
  loading: boolean;
  email: string | null;
  profile: HeaderProfile | null;
  adminRequestStatus: AdminRoleRequestStatusResponse | null;
};

const NAV_LINK =
  "transition hover:text-zinc-950 dark:hover:text-zinc-100" as const;

function useHeaderAuth(): AuthState {
  const [loading, setLoading] = useState(() => {
    if (typeof window === "undefined") return true;
    return Boolean(getSupabaseBrowserClient());
  });
  const [email, setEmail] = useState<string | null>(null);
  const [profile, setProfile] = useState<HeaderProfile | null>(null);
  const [adminRequestStatus, setAdminRequestStatus] =
    useState<AdminRoleRequestStatusResponse | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    let active = true;

    const sync = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!active) return;

      if (!session?.user) {
        setEmail(null);
        setProfile(null);
        setAdminRequestStatus(null);
        setLoading(false);
        return;
      }

      setEmail(session.user.email ?? null);

      const { data } = await supabase
        .from("profiles")
        .select("role, email_verified")
        .eq("user_id", session.user.id)
        .maybeSingle<HeaderProfile>();
      if (!active) return;
      setProfile(data ?? null);

      if (session.access_token) {
        const res = await fetch("/api/admin-access-request", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        }).catch(() => null);
        if (!active) return;

        if (res?.ok) {
          const body =
            (await res.json()) as AdminRoleRequestStatusResponse;
          if (!active) return;
          setAdminRequestStatus(body);
        } else {
          setAdminRequestStatus(null);
        }
      } else {
        setAdminRequestStatus(null);
      }

      setLoading(false);
    };

    void sync();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => void sync());

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  return { loading, email, profile, adminRequestStatus };
}

function formatUserLabel(email: string): string {
  return email.length > 28 ? `${email.slice(0, 25)}...` : email;
}

function NavLinks({ isAdmin }: { isAdmin: boolean }) {
  return (
    <nav className="hidden items-center gap-4 text-sm text-zinc-600 dark:text-zinc-400 md:flex">
      <Link href="/" className={NAV_LINK}>
        Browse properties
      </Link>
      <Link href="/submit-review/new" className={NAV_LINK}>
        Leave a review
      </Link>
      {isAdmin && (
        <Link href="/admin" className={NAV_LINK}>
          Admin
        </Link>
      )}
    </nav>
  );
}

function GuestActions() {
  return (
    <>
      <Link href="/submit-review/new" className={secondaryButtonClass}>
        Leave a review
      </Link>
      <Link href="/sign-in?redirect=%2F" className={primaryButtonClass}>
        Sign in
      </Link>
    </>
  );
}

function UserActions({
  email,
  profile,
  adminRequestStatus,
}: {
  email: string;
  profile: HeaderProfile | null;
  adminRequestStatus: AdminRoleRequestStatusResponse | null;
}) {
  const isAdmin = profile?.role === "admin";
  const showRequestAdmin = !isAdmin;
  const requestLabel = adminRequestStatus?.hasActiveRequest
    ? "Admin request"
    : "Request admin access";

  return (
    <>
      <span className="hidden rounded-full bg-zinc-100 px-3 py-1 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400 sm:inline">
        {formatUserLabel(email)}
        {profile?.email_verified ? " · verified" : ""}
      </span>
      {isAdmin && (
        <Link
          href="/admin"
          className={`md:hidden ${secondaryButtonClass}`}
        >
          Admin
        </Link>
      )}
      {showRequestAdmin && (
        <Link href="/signup/request-admin" className={secondaryButtonClass}>
          {requestLabel}
        </Link>
      )}
      <SignOutButton />
    </>
  );
}

export function PublicSiteHeader() {
  const { loading, email, profile, adminRequestStatus } = useHeaderAuth();
  const isAdmin = profile?.role === "admin";

  return (
    <div className="sticky top-0 z-40 border-b border-zinc-200 bg-white/95 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95">
      <div
        className={`${pageContainerClass} flex flex-wrap items-center justify-between gap-4 py-3`}
      >
        <div className="flex items-center gap-6">
          <Link href="/" className="text-base font-semibold text-foreground">
            Livedin
          </Link>
          <NavLinks isAdmin={isAdmin} />
        </div>

        <div className="flex flex-wrap items-center gap-3 text-sm">
          <ThemeMenu />
          {loading ? (
            <span className="text-zinc-500 dark:text-zinc-400">
              Checking session…
            </span>
          ) : email ? (
            <UserActions
              email={email}
              profile={profile}
              adminRequestStatus={adminRequestStatus}
            />
          ) : (
            <GuestActions />
          )}
        </div>
      </div>
    </div>
  );
}
