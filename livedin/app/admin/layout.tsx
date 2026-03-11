"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

type GuardState = "loading" | "forbidden" | "allowed";

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
          setState("forbidden");
        }
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (cancelled) return;
      if (!session?.access_token) {
        setState("forbidden");
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
        <div className="mx-auto max-w-lg px-4 py-16 text-center">
          <h1 className="text-xl font-semibold text-foreground">Forbidden</h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            You do not have permission to access the admin area.
          </p>
          <Link
            href="/"
            className="mt-6 inline-block rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90"
          >
            Back to home
          </Link>
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
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
