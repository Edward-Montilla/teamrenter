"use client";

import { useEffect, useState } from "react";
import { AuthPromptCard } from "@/components/auth/AuthPromptCard";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { pageContainerClass, secondaryButtonClass, sectionCardClass } from "@/lib/ui";

type GuardState = "loading" | "unauthenticated" | "unverified" | "allowed";

export function DashboardGate({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GuardState>("loading");

  useEffect(() => {
    let cancelled = false;

    async function check() {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        if (!cancelled) setState("unauthenticated");
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (cancelled) return;
      if (!session?.user) {
        setState("unauthenticated");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("email_verified")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (cancelled) return;
      if (!profile?.email_verified) {
        setState("unverified");
        return;
      }

      setState("allowed");
    }

    void check();
    return () => {
      cancelled = true;
    };
  }, []);

  if (state === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 text-foreground dark:bg-zinc-950">
        <div className={`${sectionCardClass} p-6`}>
          <p className="text-zinc-500 dark:text-zinc-400">Checking your account…</p>
        </div>
      </div>
    );
  }

  if (state === "unauthenticated") {
    return (
      <div className="min-h-screen bg-zinc-50 text-foreground dark:bg-zinc-950">
        <div className={`${pageContainerClass} max-w-lg py-16`}>
          <AuthPromptCard
            title="Sign in to open your dashboard"
            description="Your reviews and saved properties are available once you sign in."
            primaryAction={{
              label: "Sign in",
              href: "/sign-in?redirect=%2Fdashboard",
            }}
            secondaryAction={{ label: "Back to home", href: "/" }}
          />
        </div>
      </div>
    );
  }

  if (state === "unverified") {
    return (
      <div className="min-h-screen bg-zinc-50 text-foreground dark:bg-zinc-950">
        <div className={`${pageContainerClass} max-w-lg space-y-4 py-16`}>
          <AuthPromptCard
            title="Verify your email"
            description="Confirm your email address to access your dashboard, shortlist, and reviews."
            primaryAction={{ label: "Back to home", href: "/" }}
          />
          <SignOutButton className={secondaryButtonClass} redirectTo="/" />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
