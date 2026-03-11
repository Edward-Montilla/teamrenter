"use client";

import { useEffect, useState } from "react";
import { AuthPromptCard } from "@/components/auth/AuthPromptCard";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { applyTheme } from "@/components/theme/ThemeSync";
import { FeedbackPanel } from "@/components/ui/FeedbackPanel";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import {
  APP_THEMES,
  DEFAULT_THEME_KEY,
  getThemeByKey,
  isAppThemeKey,
  type AppThemeKey,
} from "@/lib/themes";
import {
  primaryButtonClass,
  sectionCardClass,
  secondaryButtonClass,
} from "@/lib/ui";

type GateState = "loading" | "unauthenticated" | "unverified" | "ready";

type ThemeProfile = {
  email_verified: boolean;
  theme_key: string | null;
};

function ThemePreview({ themeKey }: { themeKey: AppThemeKey }) {
  const theme = getThemeByKey(themeKey);

  return (
    <div className="mt-4 overflow-hidden rounded-3xl border" style={{ borderColor: theme.tokens.neutralSupport }}>
      <div
        className="p-5"
        style={{
          backgroundColor: theme.tokens.pageBg,
          color: theme.tokens.primaryText,
        }}
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">{theme.name}</p>
            <p className="mt-1 text-sm" style={{ color: theme.tokens.mutedText }}>
              {theme.description}
            </p>
          </div>
          <div
            className="rounded-full px-3 py-1 text-xs font-medium"
            style={{
              backgroundColor: theme.tokens.softAccent,
              color: theme.tokens.primaryText,
            }}
          >
            Live preview
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div
            className="rounded-2xl border p-4"
            style={{
              backgroundColor: theme.tokens.surfaceCard,
              borderColor: theme.tokens.neutralSupport,
            }}
          >
            <p className="text-xs uppercase tracking-[0.2em]" style={{ color: theme.tokens.mutedText }}>
              Surface
            </p>
            <p className="mt-2 text-sm font-medium">Card and panel color</p>
          </div>
          <div
            className="rounded-2xl p-4"
            style={{
              backgroundColor: theme.tokens.primaryAccent,
              color: theme.tokens.primaryAccentText,
            }}
          >
            <p className="text-xs uppercase tracking-[0.2em] opacity-75">Primary</p>
            <p className="mt-2 text-sm font-medium">Main CTA and active state</p>
          </div>
          <div
            className="rounded-2xl border p-4"
            style={{
              backgroundColor: theme.tokens.surfaceAlt,
              borderColor: theme.tokens.neutralSupport,
            }}
          >
            <p className="text-xs uppercase tracking-[0.2em]" style={{ color: theme.tokens.mutedText }}>
              Accent support
            </p>
            <p className="mt-2 text-sm font-medium">Hover fills and selected pills</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ThemeSettingsPanel() {
  const [gateState, setGateState] = useState<GateState>("loading");
  const [currentTheme, setCurrentTheme] = useState<AppThemeKey>(DEFAULT_THEME_KEY);
  const [savingTheme, setSavingTheme] = useState<AppThemeKey | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setGateState("unauthenticated");
      return;
    }

    let active = true;

    const sync = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!active) return;
      if (!session?.user) {
        setGateState("unauthenticated");
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("email_verified, theme_key")
        .eq("user_id", session.user.id)
        .maybeSingle<ThemeProfile>();

      if (!active || !data) {
        setGateState("unauthenticated");
        return;
      }

      const nextTheme = isAppThemeKey(data.theme_key)
        ? data.theme_key
        : DEFAULT_THEME_KEY;

      setCurrentTheme(nextTheme);
      applyTheme(nextTheme);
      setGateState(data.email_verified ? "ready" : "unverified");
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

  const handleThemeSelect = async (themeKey: AppThemeKey) => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setError("Supabase browser auth is not configured.");
      return;
    }

    const previousTheme = currentTheme;
    setSavingTheme(themeKey);
    setError(null);
    setMessage(null);
    setCurrentTheme(themeKey);
    applyTheme(themeKey);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        throw new Error("Sign in again to save your theme.");
      }

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ theme_key: themeKey })
        .eq("user_id", session.user.id);

      if (updateError) {
        throw updateError;
      }

      setMessage("Theme saved to your verified account.");
    } catch (saveError) {
      setCurrentTheme(previousTheme);
      applyTheme(previousTheme);
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Theme could not be saved.",
      );
    } finally {
      setSavingTheme(null);
    }
  };

  if (gateState === "loading") {
    return (
      <div className={`${sectionCardClass} mx-auto max-w-3xl p-6 sm:p-8`}>
        <FeedbackPanel
          title="Checking your account"
          description="Loading your current theme settings and verification status."
        />
      </div>
    );
  }

  if (gateState === "unauthenticated") {
    return (
      <div className="mx-auto max-w-3xl py-10 sm:py-12">
        <AuthPromptCard
          title="Sign in to change themes"
          description="Theme preferences are saved to verified accounts so your look follows you across sessions."
          primaryAction={{ label: "Sign in", href: "/sign-in?redirect=%2Fthemes" }}
          secondaryAction={{ label: "Back to home", href: "/" }}
        />
      </div>
    );
  }

  if (gateState === "unverified") {
    return (
      <div className="mx-auto max-w-3xl space-y-4 py-10 sm:py-12">
        <AuthPromptCard
          title="Verify your email to unlock themes"
          description="Verified users can save a site theme to their profile and apply it across the app."
          primaryAction={{ label: "Back to home", href: "/" }}
        />
        <SignOutButton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className={`${sectionCardClass} p-6 sm:p-8`}>
        <p className="text-sm font-medium uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-400">
          Verified account setting
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Choose your site theme
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-600 dark:text-zinc-400">
          Pick any of the visual directions from the mockup palette document. Changes apply instantly and save back to your profile.
        </p>
      </div>

      {message ? <FeedbackPanel tone="success" description={message} /> : null}
      {error ? <FeedbackPanel tone="error" description={error} /> : null}

      <div className="grid gap-6">
        {APP_THEMES.map((theme) => {
          const isCurrent = currentTheme === theme.key;
          const isSaving = savingTheme === theme.key;

          return (
            <section key={theme.key} className={`${sectionCardClass} p-6 sm:p-8`}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-2xl font-semibold text-foreground">
                      {theme.name}
                    </h2>
                    {isCurrent ? (
                      <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                        Current theme
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                    {theme.description}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => void handleThemeSelect(theme.key)}
                  disabled={isSaving || isCurrent}
                  className={isCurrent ? secondaryButtonClass : primaryButtonClass}
                >
                  {isSaving
                    ? "Saving…"
                    : isCurrent
                      ? "Applied"
                      : "Use this theme"}
                </button>
              </div>

              <ThemePreview themeKey={theme.key} />
            </section>
          );
        })}
      </div>
    </div>
  );
}
