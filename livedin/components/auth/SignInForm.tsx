"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { FeedbackPanel } from "@/components/ui/FeedbackPanel";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import {
  inputClass,
  primaryButtonClass,
  secondaryButtonClass,
  sectionCardClass,
} from "@/lib/ui";

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
    <div className={`${sectionCardClass} mx-auto max-w-5xl overflow-hidden`}>
      <div className="grid lg:grid-cols-[minmax(0,1fr)_420px]">
        <div className="border-b border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-900 lg:border-b-0 lg:border-r lg:p-10">
          <p className="text-sm font-medium uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-400">
            Account access
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {heading}
          </h1>
          <p className="mt-4 max-w-md text-sm leading-7 text-zinc-600 dark:text-zinc-400">
            {mode === "sign-in"
              ? "Use your account to submit verified reviews, continue a gated review flow, or access admin tools."
              : "Create an account first. Review submission requires a verified email address before you can continue."}
          </p>

          <div className="mt-8 rounded-3xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="text-base font-semibold text-foreground">
              What happens after you sign in
            </h2>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              <li>You will be returned to <span className="font-mono text-xs">{safeRedirect}</span>.</li>
              <li>Google sign-in is usually the fastest path because the email is already verified.</li>
              <li>Email sign-up sends a verification link before review submission is unlocked.</li>
            </ul>
          </div>
        </div>

        <div className="p-6 sm:p-8">
          <div className="inline-flex rounded-xl border border-zinc-200 bg-zinc-50 p-1 dark:border-zinc-700 dark:bg-zinc-900">
            <button
              type="button"
              onClick={() => setMode("sign-in")}
              className={`rounded-lg px-3 py-2 text-sm font-medium ${
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
              className={`rounded-lg px-3 py-2 text-sm font-medium ${
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
              className={`${secondaryButtonClass} w-full`}
            >
              {oauthSubmitting ? "Redirecting to Google…" : "Continue with Google"}
            </button>
            <p className="text-xs leading-6 text-zinc-500 dark:text-zinc-400">
              Google sign-in uses your verified Google account, so review gating can recognize you immediately after authentication.
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
              <FeedbackPanel tone="success" description={message} />
            )}
            {error && (
              <FeedbackPanel tone="error" description={error} />
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
                className={`${inputClass} mt-1`}
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
                className={`${inputClass} mt-1`}
              />
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                {mode === "sign-in"
                  ? "Use the password for your existing account."
                  : "Passwords must be at least 8 characters long."}
              </p>
            </div>

            <button
              type="submit"
              disabled={submitting || oauthSubmitting}
              className={`${primaryButtonClass} w-full`}
            >
              {submitting ? "Working…" : submitLabel}
            </button>
          </form>

          <div className="mt-6 text-sm text-zinc-600 dark:text-zinc-400">
            <p>
              Redirect after sign in: <span className="font-mono text-xs">{safeRedirect}</span>
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
      </div>
    </div>
  );
}
