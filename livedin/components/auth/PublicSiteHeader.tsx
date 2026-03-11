"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { SignOutButton } from "@/components/auth/SignOutButton";

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
    <div className="border-b border-zinc-200 bg-white/95 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="text-base font-semibold text-foreground">
          Livedin
        </Link>
        <div className="flex items-center gap-3 text-sm">
          {loading ? (
            <span className="text-zinc-500 dark:text-zinc-400">Checking session…</span>
          ) : email ? (
            <>
              <span className="hidden text-zinc-600 dark:text-zinc-400 sm:inline">
                {formatUserLabel(email)}
                {profile?.email_verified ? " · verified" : ""}
              </span>
              {profile?.role === "admin" && (
                <Link
                  href="/admin/properties"
                  className="rounded-lg border border-zinc-300 bg-white px-3 py-2 font-medium text-foreground hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:hover:bg-zinc-800"
                >
                  Admin
                </Link>
              )}
              <SignOutButton />
            </>
          ) : (
            <Link
              href="/sign-in?redirect=%2F"
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 font-medium text-foreground hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:hover:bg-zinc-800"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
