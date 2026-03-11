"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

type SignInFormProps = {
  redirectTo: string;
  verified: boolean;
};

function normalizeRedirect(redirectTo: string): string {
  return redirectTo.startsWith("/") ? redirectTo : "/";
}

export function SignInForm({ redirectTo, verified }: SignInFormProps) {
  const router = useRouter();
  const safeRedirect = useMemo(
    () => normalizeRedirect(redirectTo),
    [redirectTo],
  );
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [oauthSubmitting, setOauthSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(
    verified ? "Email confirmed. Sign in to continue." : null,
  );

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    const client = supabase;

    let cancelled = false;

    async function maybeRedirectSignedInUser() {
      const {
        data: { session },
      } = await client.auth.getSession();
      if (!cancelled && session?.access_token) {
        router.replace(safeRedirect);
        router.refresh();
      }
    }

    maybeRedirectSignedInUser();
    return () => {
      cancelled = true;
    };
  }, [router, safeRedirect]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setMessage(null);

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setSubmitting(false);
      setError("Supabase browser auth is not configured.");
      return;
    }

    try {
      if (mode === "sign-in") {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (signInError) {
          throw signInError;
        }

        router.replace(safeRedirect);
        router.refresh();
        return;
      }

      const emailRedirectTo = `${window.location.origin}/sign-in?verified=1`;
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo,
        },
      });
      if (signUpError) {
        throw signUpError;
      }

      setMessage(
        data.session
          ? "Account created. You are signed in."
          : "Account created. Check your email to verify your address, then sign in.",
      );

      if (data.session) {
        router.replace(safeRedirect);
        router.refresh();
      } else {
        setMode("sign-in");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setOauthSubmitting(true);
    setError(null);
    setMessage(null);

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setOauthSubmitting(false);
      setError("Supabase browser auth is not configured.");
      return;
    }

    try {
      const callbackUrl = new URL("/sign-in", window.location.origin);
      callbackUrl.searchParams.set("redirect", safeRedirect);

      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: callbackUrl.toString(),
        },
      });

      if (oauthError) {
        throw oauthError;
      }
    } catch (err) {
      setOauthSubmitting(false);
      setError(
        err instanceof Error ? err.message : "Google sign-in could not be started.",
      );
    }
  };

  const heading =
    mode === "sign-in" ? "Sign in to Livedin" : "Create your Livedin account";
  const submitLabel =
    mode === "sign-in" ? "Sign in" : "Create account";

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-950">
      <h1 className="text-2xl font-semibold text-foreground">{heading}</h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        {mode === "sign-in"
          ? "Use your account to submit reviews or access the admin area."
          : "Create an account first. Review submission requires a verified email address."}
      </p>

      <div className="mt-4 inline-flex rounded-lg border border-zinc-200 bg-zinc-50 p-1 dark:border-zinc-700 dark:bg-zinc-900">
        <button
          type="button"
          onClick={() => setMode("sign-in")}
          className={`rounded-md px-3 py-2 text-sm font-medium ${
            mode === "sign-in"
              ? "bg-white text-foreground shadow-sm dark:bg-zinc-800"
              : "text-zinc-600 dark:text-zinc-400"
          }`}
        >
          Sign in
        </button>
        <button
          type="button"
          onClick={() => setMode("sign-up")}
          className={`rounded-md px-3 py-2 text-sm font-medium ${
            mode === "sign-up"
              ? "bg-white text-foreground shadow-sm dark:bg-zinc-800"
              : "text-zinc-600 dark:text-zinc-400"
          }`}
        >
          Create account
        </button>
      </div>

      <div className="mt-6 space-y-3">
        <button
          type="button"
          onClick={() => void handleGoogleSignIn()}
          disabled={submitting || oauthSubmitting}
          className="flex w-full items-center justify-center rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-foreground hover:bg-zinc-50 disabled:pointer-events-none disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-900 dark:hover:bg-zinc-800"
        >
          {oauthSubmitting ? "Redirecting to Google…" : "Continue with Google"}
        </button>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Google sign-in uses your verified Google account, so review gating can
          recognize you immediately after authentication.
        </p>
      </div>

      <div className="mt-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-700" />
        <span className="text-xs uppercase tracking-[0.2em] text-zinc-400">
          Or use email
        </span>
        <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-700" />
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {message && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-900 dark:border-green-900/70 dark:bg-green-950/30 dark:text-green-200">
            {message}
          </div>
        )}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">
            {error}
          </div>
        )}

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-foreground"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-foreground dark:border-zinc-600 dark:bg-zinc-900"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-foreground"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={8}
            autoComplete={
              mode === "sign-in" ? "current-password" : "new-password"
            }
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-foreground dark:border-zinc-600 dark:bg-zinc-900"
          />
        </div>

        <button
          type="submit"
          disabled={submitting || oauthSubmitting}
          className="w-full rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90 disabled:pointer-events-none disabled:opacity-50"
        >
          {submitting ? "Working…" : submitLabel}
        </button>
      </form>

      <div className="mt-6 text-sm text-zinc-600 dark:text-zinc-400">
        <p>
          Redirect after sign in: <span className="font-mono">{safeRedirect}</span>
        </p>
        <div className="mt-3 flex flex-wrap gap-3">
          <Link
            href={safeRedirect}
            className="text-foreground underline underline-offset-4"
          >
            Return without signing in
          </Link>
          <Link href="/" className="text-foreground underline underline-offset-4">
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
