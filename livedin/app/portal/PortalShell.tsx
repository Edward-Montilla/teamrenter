"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bell,
  Building2,
  LayoutDashboard,
  Menu,
  Radio,
  Settings,
  Star,
  Target,
  Users,
  X,
} from "lucide-react";
import { AuthPromptCard } from "@/components/auth/AuthPromptCard";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { fetchPortalMe } from "@/lib/portal-client";
import { cn, secondaryButtonClass } from "@/lib/ui";

type GuardState = "loading" | "unauthenticated" | "forbidden" | "allowed";

const NAV_ITEMS: Array<{ href: string; label: string; icon: typeof LayoutDashboard }> = [
  { href: "/portal", label: "Dashboard", icon: LayoutDashboard },
  { href: "/portal/reviews", label: "Reviews", icon: Star },
  { href: "/portal/performance", label: "Performance", icon: BarChart3 },
  { href: "/portal/benchmarks", label: "Benchmarks", icon: Target },
  { href: "/portal/signals", label: "Signals", icon: Radio },
  { href: "/portal/alerts", label: "Alerts", icon: Bell },
  { href: "/portal/team", label: "Team", icon: Users },
  { href: "/portal/profile", label: "Profile", icon: Building2 },
  { href: "/portal/settings", label: "Settings", icon: Settings },
];

export function PortalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [state, setState] = useState<GuardState>("loading");
  const [mobileOpen, setMobileOpen] = useState(false);

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
      if (!session?.access_token) {
        setState("unauthenticated");
        return;
      }

      try {
        await fetchPortalMe();
        if (!cancelled) setState("allowed");
      } catch {
        if (!cancelled) setState("forbidden");
      }
    }

    void check();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    queueMicrotask(() => setMobileOpen(false));
  }, [pathname]);

  if (state === "loading") {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ background: "var(--background)", color: "var(--foreground)" }}
      >
        <p style={{ color: "var(--theme-muted)" }}>Checking portal access…</p>
      </div>
    );
  }

  if (state === "unauthenticated") {
    return (
      <div className="min-h-screen bg-zinc-50 text-foreground dark:bg-zinc-950">
        <div className="mx-auto max-w-lg px-4 py-16">
          <AuthPromptCard
            title="Sign in to continue"
            description="Landlords and admins use the business portal to manage portfolio insights."
            primaryAction={{
              label: "Sign in",
              href: "/sign-in?redirect=%2Fportal",
            }}
            secondaryAction={{ label: "Back to home", href: "/" }}
          />
        </div>
      </div>
    );
  }

  if (state === "forbidden") {
    return (
      <div className="min-h-screen bg-zinc-50 text-foreground dark:bg-zinc-950">
        <div className="mx-auto max-w-lg px-4 py-16">
          <AuthPromptCard
            title="Portal access required"
            description="You are signed in, but this account does not have landlord or admin portal access."
            primaryAction={{ label: "Back to home", href: "/" }}
          />
          <SignOutButton className={`${secondaryButtonClass} mt-4`} redirectTo="/" />
        </div>
      </div>
    );
  }

  const sidebar = (
    <aside
      className="flex h-full w-64 flex-col border-r py-6"
      style={{
        background: "var(--sidebar-bg)",
        color: "var(--sidebar-text)",
        borderColor: "var(--sidebar-border)",
      }}
    >
      <div className="px-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--sidebar-text-muted)" }}>
          LivedIn
        </p>
        <p className="mt-1 text-lg font-semibold">Business portal</p>
      </div>
      <nav className="mt-8 flex flex-1 flex-col gap-1 px-2" aria-label="Portal">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/portal" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                active ? "bg-[var(--sidebar-accent)]" : "hover:bg-[var(--sidebar-accent)]/80",
              )}
              style={{
                color: active ? "var(--sidebar-active-text)" : "var(--sidebar-text)",
              }}
            >
              <Icon className="h-5 w-5 shrink-0 opacity-90" aria-hidden />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto space-y-2 border-t px-2 pt-4" style={{ borderColor: "var(--sidebar-border)" }}>
        <Link
          href="/"
          className="block rounded-xl px-3 py-2 text-sm font-medium hover:bg-[var(--sidebar-accent)]"
          style={{ color: "var(--sidebar-text-muted)" }}
        >
          Public site
        </Link>
        <div className="px-1">
          <SignOutButton
            className="w-full justify-center rounded-xl border border-[var(--sidebar-border)] bg-transparent px-3 py-2 text-sm font-medium text-[var(--sidebar-text)] hover:bg-[var(--sidebar-accent)]"
            redirectTo="/"
          />
        </div>
      </div>
    </aside>
  );

  return (
    <div className="flex min-h-screen" style={{ background: "var(--background)", color: "var(--foreground)" }}>
      <div className="hidden lg:block">{sidebar}</div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-[min(20rem,100%)] shadow-xl">
            {sidebar}
            <button
              type="button"
              className="absolute right-3 top-3 rounded-lg p-2 text-white/80 hover:bg-white/10"
              aria-label="Close"
              onClick={() => setMobileOpen(false)}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      ) : null}

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header
          className="flex items-center gap-3 border-b px-4 py-3 lg:hidden"
          style={{ borderColor: "var(--theme-border)" }}
        >
          <button
            type="button"
            className="rounded-xl border p-2"
            style={{ borderColor: "var(--theme-border)" }}
            aria-label="Open navigation menu"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="font-semibold">Portal</span>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">{children}</main>
      </div>
    </div>
  );
}
