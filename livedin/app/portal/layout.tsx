"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Bell,
  Building2,
  ChartColumnBig,
  Gauge,
  LayoutDashboard,
  Menu,
  MessageSquare,
  ShieldCheck,
  Signal,
  Users,
  X,
} from "lucide-react";
import { AuthPromptCard } from "@/components/auth/AuthPromptCard";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { fetchPortalMe } from "@/lib/portal-client";
import { cn, pageContainerClass, secondaryButtonClass, sectionCardClass } from "@/lib/ui";

type GuardState = "loading" | "unauthenticated" | "forbidden" | "allowed";

const NAV_ITEMS = [
  { href: "/portal", label: "Dashboard", icon: LayoutDashboard },
  { href: "/portal/reviews", label: "Reviews", icon: MessageSquare },
  { href: "/portal/moderation", label: "Moderation", icon: ShieldCheck },
  { href: "/portal/performance", label: "Performance", icon: Gauge },
  { href: "/portal/benchmarks", label: "Benchmarks", icon: ChartColumnBig },
  { href: "/portal/signals", label: "Signals", icon: Signal },
  { href: "/portal/alerts", label: "Alerts", icon: AlertTriangle },
  { href: "/portal/team", label: "Team", icon: Users },
  { href: "/portal/profile", label: "Profile", icon: Building2 },
  { href: "/portal/settings", label: "Settings", icon: Bell },
] as const;

function Sidebar({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="space-y-1">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const active =
          item.href === "/portal"
            ? pathname === "/portal"
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-xl border px-3 py-2 text-sm transition",
              active
                ? "border-[var(--sidebar-active-text)] text-[var(--sidebar-active-text)]"
                : "border-[var(--sidebar-border)] text-[var(--sidebar-text)] hover:bg-[var(--sidebar-accent)]",
            )}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [state, setState] = useState<GuardState>("loading");
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    let active = true;
    void fetchPortalMe()
      .then(() => {
        if (active) setState("allowed");
      })
      .catch((error: unknown) => {
        if (!active) return;
        const message =
          error instanceof Error ? error.message.toLowerCase() : "";
        if (message.includes("not signed in")) {
          setState("unauthenticated");
          return;
        }
        setState("forbidden");
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  if (state === "loading") {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <div className={`${pageContainerClass} py-16`}>
          <div className={`${sectionCardClass} p-6`}>Checking portal access…</div>
        </div>
      </div>
    );
  }

  if (state === "unauthenticated") {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <div className={`${pageContainerClass} max-w-lg py-16`}>
          <AuthPromptCard
            title="Sign in to continue"
            description="Use a landlord or admin account to access the Business Portal."
            primaryAction={{ label: "Sign in", href: "/sign-in?redirect=%2Fportal" }}
            secondaryAction={{ label: "Back to home", href: "/" }}
          />
        </div>
      </div>
    );
  }

  if (state === "forbidden") {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <div className={`${pageContainerClass} max-w-lg space-y-3 py-16`}>
          <AuthPromptCard
            title="Portal access required"
            description="You are signed in, but this account is not a landlord or admin."
            primaryAction={{ label: "Back to home", href: "/" }}
          />
          <SignOutButton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white/95 dark:border-zinc-800 dark:bg-zinc-950/95">
        <div className={`${pageContainerClass} flex items-center justify-between gap-3 py-4`}>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-300 md:hidden"
              onClick={() => setDrawerOpen((value) => !value)}
              aria-label="Toggle portal navigation"
            >
              {drawerOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <Link href="/portal" className="text-lg font-semibold">
              Business Portal
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/" className={secondaryButtonClass}>
              Public site
            </Link>
            <SignOutButton className={secondaryButtonClass} redirectTo="/" />
          </div>
        </div>
      </header>

      <div className={`${pageContainerClass} grid gap-6 py-6 md:grid-cols-[260px_1fr]`}>
        <aside className="hidden rounded-2xl border border-[var(--sidebar-border)] bg-[var(--sidebar-bg)] p-4 md:block">
          <Sidebar pathname={pathname} />
        </aside>
        {drawerOpen && (
          <div
            className="fixed inset-0 z-50 bg-black/30 md:hidden"
            onClick={() => setDrawerOpen(false)}
          >
            <aside
              className="h-full w-72 border-r border-[var(--sidebar-border)] bg-[var(--sidebar-bg)] p-4"
              onClick={(event) => event.stopPropagation()}
            >
              <Sidebar pathname={pathname} onNavigate={() => setDrawerOpen(false)} />
            </aside>
          </div>
        )}
        <main>{children}</main>
      </div>
    </div>
  );
}
"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AuthPromptCard } from "@/components/auth/AuthPromptCard";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { fetchPortalMe } from "@/lib/portal-client";
import { pageContainerClass, sectionCardClass } from "@/lib/ui";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<"loading" | "unauthenticated" | "forbidden" | "allowed">("loading");
  useEffect(() => {
    let active = true;
    void fetchPortalMe().then(() => active && setState("allowed")).catch((e: unknown) => {
      if (!active) return;
      const msg = e instanceof Error ? e.message : "";
      setState(msg.toLowerCase().includes("not signed in") ? "unauthenticated" : "forbidden");
    });
    return () => { active = false; };
  }, []);
  if (state === "loading") return <div className={`${pageContainerClass} py-16`}><div className={`${sectionCardClass} p-6`}>Checking portal access…</div></div>;
  if (state === "unauthenticated") return <div className={`${pageContainerClass} max-w-lg py-16`}><AuthPromptCard title="Sign in to continue" description="Use a landlord or admin account." primaryAction={{ label: "Sign in", href: "/sign-in?redirect=%2Fportal" }} secondaryAction={{ label: "Back to home", href: "/" }} /></div>;
  if (state === "forbidden") return <div className={`${pageContainerClass} max-w-lg py-16`}><AuthPromptCard title="Portal access required" description="You are signed in but not authorized." primaryAction={{ label: "Back to home", href: "/" }} /><div className="mt-3"><SignOutButton /></div></div>;
  return <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950"><header className="border-b border-zinc-200 bg-white/95 dark:border-zinc-800 dark:bg-zinc-950/95"><div className={`${pageContainerClass} flex flex-wrap items-center justify-between gap-3 py-4`}><Link href="/portal" className="text-lg font-semibold">Business Portal</Link><nav className="flex flex-wrap gap-2 text-sm"><Link href="/portal">Dashboard</Link><Link href="/portal/reviews">Reviews</Link><Link href="/portal/moderation">Moderation</Link><Link href="/portal/performance">Performance</Link><Link href="/portal/benchmarks">Benchmarks</Link><Link href="/portal/signals">Signals</Link><Link href="/portal/alerts">Alerts</Link><Link href="/portal/team">Team</Link><Link href="/portal/profile">Profile</Link><Link href="/portal/settings">Settings</Link></nav></div></header><main className={`${pageContainerClass} py-6`}>{children}</main></div>;
}
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AlertTriangle, Bell, Building2, ChartColumnBig, Gauge, LayoutDashboard, Menu, MessageSquare, ShieldCheck, Signal, Users, X } from "lucide-react";
import { AuthPromptCard } from "@/components/auth/AuthPromptCard";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { fetchPortalMe } from "@/lib/portal-client";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { cn, pageContainerClass, secondaryButtonClass, sectionCardClass } from "@/lib/ui";

type GuardState = "loading" | "unauthenticated" | "forbidden" | "allowed";
const NAV = [
  { href: "/portal", label: "Dashboard", icon: LayoutDashboard },
  { href: "/portal/reviews", label: "Reviews", icon: MessageSquare },
  { href: "/portal/moderation", label: "Moderation", icon: ShieldCheck },
  { href: "/portal/performance", label: "Performance", icon: Gauge },
  { href: "/portal/benchmarks", label: "Benchmarks", icon: ChartColumnBig },
  { href: "/portal/signals", label: "Signals", icon: Signal },
  { href: "/portal/alerts", label: "Alerts", icon: AlertTriangle },
  { href: "/portal/team", label: "Team", icon: Users },
  { href: "/portal/profile", label: "Profile", icon: Building2 },
  { href: "/portal/settings", label: "Settings", icon: Bell },
] as const;

function Sidebar({ path, onNavigate }: { path: string; onNavigate?: () => void }) {
  return <nav className="space-y-1">{NAV.map((item) => {
    const Icon = item.icon;
    const active = item.href === "/portal" ? path === "/portal" : path.startsWith(item.href);
    return <Link key={item.href} href={item.href} onClick={onNavigate} className={cn("flex items-center gap-3 rounded-xl border px-3 py-2 text-sm transition", active ? "border-[var(--sidebar-active-text)] text-[var(--sidebar-active-text)]" : "border-[var(--sidebar-border)] text-[var(--sidebar-text)] hover:bg-[var(--sidebar-accent)]")}><Icon className="h-4 w-4" />{item.label}</Link>;
  })}</nav>;
}

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const [state, setState] = useState<GuardState>("loading");
  const [open, setOpen] = useState(false);
  useEffect(() => {
    let cancelled = false;
    async function check() {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) return setState("unauthenticated");
      const { data: { session } } = await supabase.auth.getSession();
      if (cancelled) return;
      if (!session?.access_token) return setState("unauthenticated");
      try { await fetchPortalMe(); if (!cancelled) setState("allowed"); } catch { if (!cancelled) setState("forbidden"); }
    }
    void check();
    return () => { cancelled = true; };
  }, []);
  useEffect(() => { setOpen(false); }, [path]);
  if (state !== "allowed") {
    return <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950"><div className={`${pageContainerClass} max-w-lg py-16`}>{state === "loading" ? <div className={`${sectionCardClass} p-6`}><p className="text-zinc-500">Checking portal access…</p></div> : state === "unauthenticated" ? <AuthPromptCard title="Sign in to continue" description="Use a landlord or admin account." primaryAction={{ label: "Sign in", href: "/sign-in?redirect=%2Fportal" }} secondaryAction={{ label: "Back to home", href: "/" }} /> : <div className="space-y-4"><AuthPromptCard title="Portal access required" description="This account is not landlord/admin." primaryAction={{ label: "Back to home", href: "/" }} /><SignOutButton /></div>}</div></div>;
  }
  return <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950"><header className="border-b border-zinc-200 bg-white/95 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95"><div className={`${pageContainerClass} flex items-center justify-between gap-4 py-4`}><div className="flex items-center gap-3"><button type="button" onClick={() => setOpen((v) => !v)} className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-300 md:hidden" aria-label="Toggle navigation">{open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button><div><Link href="/portal" className="text-lg font-semibold hover:underline">Business Portal</Link><p className="text-sm text-zinc-500">Portfolio operations and analytics</p></div></div><div className="flex items-center gap-2"><Link href="/" className={secondaryButtonClass}>Public site</Link><SignOutButton className={secondaryButtonClass} redirectTo="/" /></div></div></header><div className={`${pageContainerClass} grid gap-6 py-6 md:grid-cols-[260px_1fr]`}><aside className="hidden rounded-2xl border border-[var(--sidebar-border)] bg-[var(--sidebar-bg)] p-4 md:block"><Sidebar path={path} /></aside>{open && <div className="fixed inset-0 z-50 bg-black/30 md:hidden" onClick={() => setOpen(false)}><aside className="h-full w-72 border-r border-[var(--sidebar-border)] bg-[var(--sidebar-bg)] p-4" onClick={(e) => e.stopPropagation()}><Sidebar path={path} onNavigate={() => setOpen(false)} /></aside></div>}<main>{children}</main></div></div>;
}
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AlertTriangle, Bell, Building2, ChartColumnBig, Gauge, LayoutDashboard, Menu, MessageSquare, ShieldCheck, Signal, Users, X } from "lucide-react";
import { AuthPromptCard } from "@/components/auth/AuthPromptCard";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { fetchPortalMe } from "@/lib/portal-client";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { cn, pageContainerClass, secondaryButtonClass, sectionCardClass } from "@/lib/ui";

type GuardState = "loading" | "unauthenticated" | "forbidden" | "allowed";

const NAV = [
  { href: "/portal", label: "Dashboard", icon: LayoutDashboard },
  { href: "/portal/reviews", label: "Reviews", icon: MessageSquare },
  { href: "/portal/moderation", label: "Moderation", icon: ShieldCheck },
  { href: "/portal/performance", label: "Performance", icon: Gauge },
  { href: "/portal/benchmarks", label: "Benchmarks", icon: ChartColumnBig },
  { href: "/portal/signals", label: "Signals", icon: Signal },
  { href: "/portal/alerts", label: "Alerts", icon: AlertTriangle },
  { href: "/portal/team", label: "Team", icon: Users },
  { href: "/portal/profile", label: "Profile", icon: Building2 },
  { href: "/portal/settings", label: "Settings", icon: Bell },
] as const;

function Sidebar({ path, onNavigate }: { path: string; onNavigate?: () => void }) {
  return <nav className="space-y-1">{NAV.map((item) => {
    const Icon = item.icon;
    const active = item.href === "/portal" ? path === item.href : path.startsWith(item.href);
    return <Link key={item.href} href={item.href} onClick={onNavigate} className={cn("flex items-center gap-3 rounded-xl border px-3 py-2 text-sm transition", active ? "border-[var(--sidebar-active-text)] text-[var(--sidebar-active-text)]" : "border-[var(--sidebar-border)] text-[var(--sidebar-text)] hover:bg-[var(--sidebar-accent)]")}><Icon className="h-4 w-4" />{item.label}</Link>;
  })}</nav>;
}

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const [state, setState] = useState<GuardState>("loading");
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) return setState("unauthenticated");
      const { data: { session } } = await supabase.auth.getSession();
      if (cancelled) return;
      if (!session?.access_token) return setState("unauthenticated");
      try { await fetchPortalMe(); if (!cancelled) setState("allowed"); } catch { if (!cancelled) setState("forbidden"); }
    }
    void run();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => { setDrawerOpen(false); }, [path]);

  if (state !== "allowed") {
    const content = state === "loading"
      ? <div className={`${sectionCardClass} p-6`}><p className="text-zinc-500">Checking portal access…</p></div>
      : state === "unauthenticated"
      ? <AuthPromptCard title="Sign in to continue" description="Use a landlord or admin account to access the portal." primaryAction={{ label: "Sign in", href: "/sign-in?redirect=%2Fportal" }} secondaryAction={{ label: "Back to home", href: "/" }} />
      : <div className="space-y-4"><AuthPromptCard title="Portal access required" description="You are signed in, but this account is not landlord/admin." primaryAction={{ label: "Back to home", href: "/" }} /><SignOutButton /></div>;
    return <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950"><div className={`${pageContainerClass} max-w-lg py-16`}>{content}</div></div>;
  }

  return <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
    <header className="border-b border-zinc-200 bg-white/95 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95">
      <div className={`${pageContainerClass} flex items-center justify-between gap-4 py-4`}>
        <div className="flex items-center gap-3">
          <button type="button" className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-300 md:hidden" onClick={() => setDrawerOpen((v) => !v)} aria-label={drawerOpen ? "Close navigation" : "Open navigation"}>{drawerOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button>
          <div><Link href="/portal" className="text-lg font-semibold hover:underline">Business Portal</Link><p className="text-sm text-zinc-500">Portfolio operations and analytics</p></div>
        </div>
        <div className="flex items-center gap-2"><Link href="/" className={secondaryButtonClass}>Public site</Link><SignOutButton className={secondaryButtonClass} redirectTo="/" /></div>
      </div>
    </header>
    <div className={`${pageContainerClass} grid gap-6 py-6 md:grid-cols-[260px_1fr]`}>
      <aside className="hidden rounded-2xl border border-[var(--sidebar-border)] bg-[var(--sidebar-bg)] p-4 md:block"><p className="mb-3 px-3 text-xs uppercase tracking-wide text-[var(--sidebar-text-muted)]">Navigation</p><Sidebar path={path} /></aside>
      {drawerOpen && <div className="fixed inset-0 z-50 bg-black/30 md:hidden" onClick={() => setDrawerOpen(false)}><aside className="h-full w-72 border-r border-[var(--sidebar-border)] bg-[var(--sidebar-bg)] p-4" onClick={(e) => e.stopPropagation()}><div className="mb-4 flex items-center justify-between"><p className="text-sm font-semibold text-[var(--sidebar-text)]">Portal menu</p><button type="button" className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-[var(--sidebar-text)]" onClick={() => setDrawerOpen(false)}><X className="h-5 w-5" /></button></div><Sidebar path={path} onNavigate={() => setDrawerOpen(false)} /></aside></div>}
      <main>{children}</main>
    </div>
  </div>;
}
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Bell,
  Building2,
  ChartColumnBig,
  Gauge,
  LayoutDashboard,
  Menu,
  ShieldCheck,
  Signal,
  Users,
  X,
  MessageSquare,
  AlertTriangle,
} from "lucide-react";
import { AuthPromptCard } from "@/components/auth/AuthPromptCard";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { fetchPortalMe } from "@/lib/portal-client";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { cn, pageContainerClass, secondaryButtonClass, sectionCardClass } from "@/lib/ui";

type GuardState = "loading" | "unauthenticated" | "forbidden" | "allowed";

const NAV_ITEMS = [
  { href: "/portal", label: "Dashboard", icon: LayoutDashboard },
  { href: "/portal/reviews", label: "Reviews", icon: MessageSquare },
  { href: "/portal/moderation", label: "Moderation", icon: ShieldCheck },
  { href: "/portal/performance", label: "Performance", icon: Gauge },
  { href: "/portal/benchmarks", label: "Benchmarks", icon: ChartColumnBig },
  { href: "/portal/signals", label: "Signals", icon: Signal },
  { href: "/portal/alerts", label: "Alerts", icon: AlertTriangle },
  { href: "/portal/team", label: "Team", icon: Users },
  { href: "/portal/profile", label: "Profile", icon: Building2 },
  { href: "/portal/settings", label: "Settings", icon: Bell },
] as const;

function Sidebar({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="space-y-1">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const active =
          item.href === "/portal"
            ? pathname === "/portal"
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-xl border px-3 py-2 text-sm transition",
              active
                ? "border-[var(--sidebar-active-text)] text-[var(--sidebar-active-text)]"
                : "border-[var(--sidebar-border)] text-[var(--sidebar-text)] hover:bg-[var(--sidebar-accent)]",
            )}
          >
            <Icon className="h-4 w-4" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [state, setState] = useState<GuardState>("loading");
  const [drawerOpen, setDrawerOpen] = useState(false);

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
    setDrawerOpen(false);
  }, [pathname]);

  if (state === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className={`${sectionCardClass} p-6`}>
          <p className="text-zinc-500">Checking portal access…</p>
        </div>
      </div>
    );
  }

  if (state === "unauthenticated") {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <div className={`${pageContainerClass} max-w-lg py-16`}>
          <AuthPromptCard
            title="Sign in to continue"
            description="Use a landlord or admin account to access the Business Portal."
            primaryAction={{ label: "Sign in", href: "/sign-in?redirect=%2Fportal" }}
            secondaryAction={{ label: "Back to home", href: "/" }}
          />
        </div>
      </div>
    );
  }

  if (state === "forbidden") {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <div className={`${pageContainerClass} max-w-lg space-y-4 py-16`}>
          <AuthPromptCard
            title="Portal access required"
            description="You are signed in, but this account is not a landlord or admin."
            primaryAction={{ label: "Back to home", href: "/" }}
          />
          <SignOutButton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-foreground dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white/95 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95">
        <div className={`${pageContainerClass} flex items-center justify-between gap-4 py-4`}>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setDrawerOpen((v) => !v)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-300 md:hidden"
              aria-label={drawerOpen ? "Close portal navigation" : "Open portal navigation"}
            >
              {drawerOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <div>
              <Link href="/portal" className="text-lg font-semibold hover:underline">
                Business Portal
              </Link>
              <p className="text-sm text-zinc-500">Portfolio operations and analytics</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/" className={secondaryButtonClass}>
              Public site
            </Link>
            <SignOutButton className={secondaryButtonClass} redirectTo="/" />
          </div>
        </div>
      </header>

      <div className={`${pageContainerClass} grid gap-6 py-6 md:grid-cols-[260px_1fr]`}>
        <aside className="hidden rounded-2xl border border-[var(--sidebar-border)] bg-[var(--sidebar-bg)] p-4 md:block">
          <p className="mb-3 px-3 text-xs font-medium uppercase tracking-wide text-[var(--sidebar-text-muted)]">
            Navigation
          </p>
          <Sidebar pathname={pathname} />
        </aside>

        {drawerOpen && (
          <div className="fixed inset-0 z-50 bg-black/30 md:hidden" onClick={() => setDrawerOpen(false)}>
            <aside
              className="h-full w-72 border-r border-[var(--sidebar-border)] bg-[var(--sidebar-bg)] p-4"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-semibold text-[var(--sidebar-text)]">Portal menu</p>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-[var(--sidebar-text)]"
                  aria-label="Close portal navigation"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <Sidebar pathname={pathname} onNavigate={() => setDrawerOpen(false)} />
            </aside>
          </div>
        )}

        <main>{children}</main>
      </div>
    </div>
  );
}
import type { Metadata } from "next";
import { PortalShell } from "./PortalShell";

export const metadata: Metadata = {
  title: "Business portal — LivedIn",
};

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PortalShell>{children}</PortalShell>;
}
