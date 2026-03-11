"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AuthPromptCard } from "@/components/auth/AuthPromptCard";
import { FeedbackPanel } from "@/components/ui/FeedbackPanel";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import type { AdminRoleRequestStatusResponse } from "@/lib/types";
import {
  inputClass,
  primaryButtonClass,
  secondaryButtonClass,
  sectionCardClass,
  textareaClass,
} from "@/lib/ui";

type PageState = "loading" | "ready" | "unauthenticated" | "error";

function formatDateTime(value: string | null | undefined): string {
  if (!value) {
    return "Not yet reviewed";
  }

  return new Date(value).toLocaleString();
}

async function getSessionAccessToken() {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    throw new Error("Supabase browser auth is not configured.");
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    return null;
  }

  return session.access_token;
}

export function RequestAdminAccessPage() {
  const [pageState, setPageState] = useState<PageState>("loading");
  const [status, setStatus] = useState<AdminRoleRequestStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [teamContext, setTeamContext] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadStatus = async () => {
    setPageState("loading");
    setError(null);

    try {
      const token = await getSessionAccessToken();
      if (!token) {
        setStatus(null);
        setPageState("unauthenticated");
        return;
      }

      const res = await fetch("/api/admin-access-request", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const json = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(json.message ?? "Failed to load admin request status.");
      }

      const data = (await res.json()) as AdminRoleRequestStatusResponse;
      setStatus(data);
      setReason("");
      setTeamContext("");
      setPageState("ready");
    } catch (err) {
      setStatus(null);
      setError(
        err instanceof Error ? err.message : "Failed to load admin request status.",
      );
      setPageState("error");
    }
  };

  useEffect(() => {
    void loadStatus();
  }, []);

  const canSubmit = useMemo(() => {
    if (!status) {
      return false;
    }

    return (
      status.currentRole !== "admin" &&
      status.eligible &&
      !status.hasActiveRequest &&
      status.requestStatus !== "approved"
    );
  }, [status]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const token = await getSessionAccessToken();
      if (!token) {
        setPageState("unauthenticated");
        return;
      }

      const res = await fetch("/api/admin-access-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          reason,
          team_context: teamContext || undefined,
        }),
      });

      if (!res.ok) {
        const json = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(json.message ?? "Failed to submit admin access request.");
      }

      await loadStatus();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to submit admin access request.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (pageState === "loading") {
    return (
      <div className={`${sectionCardClass} p-6 sm:p-8`}>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Checking your request access…
        </p>
      </div>
    );
  }

  if (pageState === "unauthenticated") {
    return (
      <AuthPromptCard
        title="Sign in to request admin access"
        description="This request path is only available to signed-in accounts that are eligible for admin review."
        primaryAction={{
          label: "Sign in",
          href: "/sign-in?redirect=%2Fsignup%2Frequest-admin",
        }}
        secondaryAction={{ label: "Back to home", href: "/" }}
      />
    );
  }

  if (pageState === "error" || !status) {
    return (
      <FeedbackPanel
        tone="error"
        title="We could not load this request flow"
        description={error ?? "An unexpected error occurred."}
        primaryAction={{ label: "Retry", onClick: loadStatus }}
        secondaryAction={{ label: "Back to home", href: "/" }}
      />
    );
  }

  const latestRequest = status.latestRequest;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
      <section className={`${sectionCardClass} p-6 sm:p-8`}>
        <p className="text-sm font-medium uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-400">
          Restricted access path
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Request admin access
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-600 dark:text-zinc-400">
          Use this form only if you are part of the trusted operator group for
          Livedin. Submitting a request does not grant admin access by itself.
          A current admin must review and approve the request before your role is
          promoted.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">
              Eligibility
            </p>
            <p className="mt-2 text-sm font-medium text-foreground">
              {status.eligible ? "Eligible account" : "Restricted account"}
            </p>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">
              Current role
            </p>
            <p className="mt-2 text-sm font-medium capitalize text-foreground">
              {status.currentRole}
            </p>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">
              Request status
            </p>
            <p className="mt-2 text-sm font-medium capitalize text-foreground">
              {status.requestStatus}
            </p>
          </div>
        </div>

        {status.currentRole === "admin" ? (
          <div className="mt-8">
            <FeedbackPanel
              tone="success"
              title="This account already has admin access"
              description="You can go straight to the admin area. No additional request is needed."
              primaryAction={{ label: "Open admin", href: "/admin/properties" }}
              secondaryAction={{ label: "Back to home", href: "/" }}
            />
          </div>
        ) : !status.eligible && status.requestStatus === "none" ? (
          <div className="mt-8">
            <FeedbackPanel
              tone="warning"
              title="Admin access is restricted"
              description="This account is not on the current admin-request allowlist, so a request cannot be submitted from this path."
              secondaryAction={{ label: "Back to home", href: "/" }}
            />
          </div>
        ) : status.hasActiveRequest ? (
          <div className="mt-8">
            <FeedbackPanel
              title="Your request is pending review"
              description={`Your latest request was submitted on ${formatDateTime(
                latestRequest?.created_at,
              )}. A current admin will review it before any role change happens.`}
              primaryAction={{ label: "Browse properties", href: "/" }}
            />
          </div>
        ) : (
          <div className="mt-8">
            {status.requestStatus === "rejected" ? (
              <FeedbackPanel
                tone="warning"
                title="A previous request was rejected"
                description={
                  <div className="space-y-2">
                    <p>
                      You can submit a new request if your responsibilities or
                      access need has changed.
                    </p>
                    {latestRequest?.review_notes ? (
                      <p>Latest reviewer note: {latestRequest.review_notes}</p>
                    ) : null}
                  </div>
                }
              />
            ) : null}

            {status.requestStatus === "approved" ? (
              <div className="mt-4">
                <FeedbackPanel
                  title="This request was approved"
                  description="If your role has not updated in the header yet, refresh the page or sign in again."
                />
              </div>
            ) : null}

            {canSubmit ? (
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div>
                  <label
                    htmlFor="admin-request-reason"
                    className="block text-sm font-medium text-foreground"
                  >
                    Why do you need admin access?
                  </label>
                  <textarea
                    id="admin-request-reason"
                    required
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    className={`${textareaClass} mt-1`}
                    placeholder="Describe the moderation, support, or data-management work you need to do."
                    maxLength={1000}
                  />
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    Keep this focused on the operational work you need to perform.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="admin-request-team-context"
                    className="block text-sm font-medium text-foreground"
                  >
                    Team or organization context
                  </label>
                  <input
                    id="admin-request-team-context"
                    value={teamContext}
                    onChange={(event) => setTeamContext(event.target.value)}
                    className={`${inputClass} mt-1`}
                    placeholder="Optional: support ops, moderation team, partner org"
                    maxLength={160}
                  />
                </div>

                {error ? <FeedbackPanel tone="error" description={error} /> : null}

                <div className="flex flex-wrap gap-3">
                  <button
                    type="submit"
                    disabled={submitting}
                    className={primaryButtonClass}
                  >
                    {submitting ? "Submitting…" : "Submit request"}
                  </button>
                  <Link href="/" className={secondaryButtonClass}>
                    Cancel
                  </Link>
                </div>
              </form>
            ) : null}
          </div>
        )}
      </section>

      <aside className={`${sectionCardClass} p-6`}>
        <h2 className="text-lg font-semibold text-foreground">What admins review</h2>
        <ul className="mt-4 space-y-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          <li>Your reason for access and any team context you provide.</li>
          <li>Whether your account matches the current restricted allowlist.</li>
          <li>Whether the request needs property, review, or insight moderation access.</li>
        </ul>

        {latestRequest ? (
          <div className="mt-6 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="text-sm font-semibold text-foreground">Latest request</h3>
            <dl className="mt-3 space-y-3 text-sm">
              <div>
                <dt className="text-zinc-500 dark:text-zinc-400">Submitted</dt>
                <dd className="mt-1 text-foreground">
                  {formatDateTime(latestRequest.created_at)}
                </dd>
              </div>
              <div>
                <dt className="text-zinc-500 dark:text-zinc-400">Status</dt>
                <dd className="mt-1 capitalize text-foreground">
                  {latestRequest.status}
                </dd>
              </div>
              {latestRequest.team_context ? (
                <div>
                  <dt className="text-zinc-500 dark:text-zinc-400">Context</dt>
                  <dd className="mt-1 text-foreground">{latestRequest.team_context}</dd>
                </div>
              ) : null}
              <div>
                <dt className="text-zinc-500 dark:text-zinc-400">Reason</dt>
                <dd className="mt-1 whitespace-pre-wrap text-foreground">
                  {latestRequest.reason}
                </dd>
              </div>
              <div>
                <dt className="text-zinc-500 dark:text-zinc-400">Reviewed</dt>
                <dd className="mt-1 text-foreground">
                  {formatDateTime(latestRequest.reviewed_at)}
                </dd>
              </div>
              {latestRequest.review_notes ? (
                <div>
                  <dt className="text-zinc-500 dark:text-zinc-400">Reviewer note</dt>
                  <dd className="mt-1 whitespace-pre-wrap text-foreground">
                    {latestRequest.review_notes}
                  </dd>
                </div>
              ) : null}
            </dl>
          </div>
        ) : (
          <p className="mt-6 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
            No request has been submitted from this account yet.
          </p>
        )}
      </aside>
    </div>
  );
}
