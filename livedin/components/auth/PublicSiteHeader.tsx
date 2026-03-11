"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { ThemeMenu } from "@/components/theme/ThemeMenu";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import {
  pageContainerClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/lib/ui";

type HeaderProfile = {
  role: string;
  email_verified: boolean;
};

function formatUserLabel(email: string | undefined): string {
  if (!email) return "Signed in";
  return email.length > 28 ? `${email.slice(0, 25)}...` : email;
}

export function PublicSiteHeader() {
  const [loading, setLoading] = useState(() => {
    if (typeof window === "undefined") {
      return true;
    }

    return Boolean(getSupabaseBrowserClient());
  });
  const [email, setEmail] = useState<string | null>(null);
  const [profile, setProfile] = useState<HeaderProfile | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      return;
    }

    let active = true;

    const sync = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!active) return;

      if (!session?.user) {
        setEmail(null);
        setProfile(null);
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
      setLoading(false);
    };

    void sync();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void sync();
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <div className="sticky top-0 z-40 border-b border-zinc-200 bg-white/95 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95">
      <div className={`${pageContainerClass} flex flex-wrap items-center justify-between gap-4 py-3`}>
        <div className="flex items-center gap-6">
          <Link href="/" className="text-base font-semibold text-foreground">
            Livedin
          </Link>
          <nav className="hidden items-center gap-4 text-sm text-zinc-600 dark:text-zinc-400 md:flex">
            <Link href="/" className="transition hover:text-zinc-950 dark:hover:text-zinc-100">
              Browse properties
            </Link>
            <Link
              href="/submit-review/new"
              className="transition hover:text-zinc-950 dark:hover:text-zinc-100"
            >
              Leave a review
            </Link>
          </nav>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          {loading ? (
            <>
              <ThemeMenu />
              <span className="text-zinc-500 dark:text-zinc-400">Checking session…</span>
            </>
          ) : email ? (
            <>
              <ThemeMenu />
              <span className="hidden rounded-full bg-zinc-100 px-3 py-1 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400 sm:inline">
                {formatUserLabel(email)}
                {profile?.email_verified ? " · verified" : ""}
              </span>
              {profile?.role === "admin" && (
                <Link
                  href="/admin/properties"
                  className={secondaryButtonClass}
                >
                  Admin
                </Link>
              )}
              <SignOutButton />
            </>
          ) : (
            <>
              <ThemeMenu />
              <Link href="/submit-review/new" className={secondaryButtonClass}>
                Leave a review
              </Link>
              <Link href="/sign-in?redirect=%2F" className={primaryButtonClass}>
                Sign in
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
