"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AuthPromptCard } from "@/components/auth/AuthPromptCard";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

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
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <p className="text-zinc-500">Checking access…</p>
      </div>
    );
  }

  if (state === "forbidden") {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="mx-auto max-w-lg px-4 py-16 space-y-4">
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
      <div className="min-h-screen bg-background text-foreground">
        <div className="mx-auto max-w-lg px-4 py-16">
          <AuthPromptCard
            title="Sign in to continue"
            description="Use an admin account to manage properties."
            primaryAction={{
              label: "Sign in",
              href: "/sign-in?redirect=%2Fadmin%2Fproperties",
            }}
            secondaryAction={{ label: "Back to home", href: "/" }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950 sm:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link
            href="/admin/properties"
            className="text-lg font-semibold text-foreground hover:underline"
          >
            Admin
          </Link>
          <nav className="flex gap-4">
            <Link
              href="/admin/properties"
              className="text-sm font-medium text-zinc-600 hover:text-foreground dark:text-zinc-400 dark:hover:text-foreground"
            >
              Properties
            </Link>
            <Link
              href="/"
              className="text-sm font-medium text-zinc-600 hover:text-foreground dark:text-zinc-400 dark:hover:text-foreground"
            >
              Public site
            </Link>
            <SignOutButton
              className="text-sm font-medium text-zinc-600 hover:text-foreground dark:text-zinc-400 dark:hover:text-foreground"
              redirectTo="/"
            />
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
