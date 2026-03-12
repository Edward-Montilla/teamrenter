"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AuthPromptCard } from "@/components/auth/AuthPromptCard";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { pageContainerClass, secondaryButtonClass, sectionCardClass } from "@/lib/ui";

type GuardState = "loading" | "unauthenticated" | "forbidden" | "allowed";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, setState] = useState<GuardState>("loading");

  useEffect(() => {
    let cancelled = false;

    async function check() {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        if (!cancelled) {
          setState("unauthenticated");
        }
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (cancelled) return;
      if (!session?.access_token) {
        setState("unauthenticated");
        return;
      }

      const res = await fetch("/api/admin/me", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (cancelled) return;
      if (!res.ok) {
        setState("forbidden");
        return;
      }
      setState("allowed");
    }

    check();
    return () => {
      cancelled = true;
    };
  }, []);

  if (state === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 text-foreground dark:bg-zinc-950">
        <div className={`${sectionCardClass} p-6`}>
          <p className="text-zinc-500">Checking access…</p>
        </div>
      </div>
    );
  }

  if (state === "forbidden") {
    return (
      <div className="min-h-screen bg-zinc-50 text-foreground dark:bg-zinc-950">
        <div className={`${pageContainerClass} max-w-lg space-y-4 py-16`}>
          <AuthPromptCard
            title="Admin access required"
            description="You are signed in, but this account does not have access to the admin area."
            primaryAction={{ label: "Back to home", href: "/" }}
          />
          <SignOutButton />
        </div>
      </div>
    );
  }

  if (state === "unauthenticated") {
    return (
      <div className="min-h-screen bg-zinc-50 text-foreground dark:bg-zinc-950">
        <div className={`${pageContainerClass} max-w-lg py-16`}>
          <AuthPromptCard
            title="Sign in to continue"
            description="Use an admin account to open the admin command center."
            primaryAction={{
              label: "Sign in",
              href: "/sign-in?redirect=%2Fadmin",
            }}
            secondaryAction={{ label: "Back to home", href: "/" }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-foreground dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white/95 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95">
        <div className={`${pageContainerClass} flex flex-wrap items-center justify-between gap-4 py-4`}>
          <div>
            <Link
              href="/admin"
              className="text-lg font-semibold text-foreground hover:underline"
            >
              Admin
            </Link>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Manage users, content, moderation queues, and operational history.
            </p>
          </div>
          <nav className="flex flex-wrap gap-3">
            <Link
              href="/admin"
              className={secondaryButtonClass}
            >
              Dashboard
            </Link>
            <Link
              href="/admin/properties"
              className={secondaryButtonClass}
            >
              Properties
            </Link>
            <Link
              href="/admin/users"
              className={secondaryButtonClass}
            >
              Users
            </Link>
            <Link
              href="/admin/reviews"
              className={secondaryButtonClass}
            >
              Reviews
            </Link>
            <Link
              href="/admin/access-requests"
              className={secondaryButtonClass}
            >
              Access requests
            </Link>
            <Link
              href="/admin/insights"
              className={secondaryButtonClass}
            >
              Insights
            </Link>
            <Link
              href="/admin/audit"
              className={secondaryButtonClass}
            >
              Audit
            </Link>
            <Link
              href="/"
              className={secondaryButtonClass}
            >
              Public site
            </Link>
            <SignOutButton
              className={secondaryButtonClass}
              redirectTo="/"
            />
          </nav>
        </div>
      </header>
      <main className={`${pageContainerClass} py-8`}>{children}</main>
    </div>
  );
}
