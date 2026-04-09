"use client";

import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { FeedbackPanel } from "@/components/ui/FeedbackPanel";
import {
  fetchPortalMe,
  fetchPortalTeam,
  invitePortalTeamMember,
  removePortalTeamMember,
  updatePortalTeamMember,
} from "@/lib/portal-client";
import type { TeamMemberItem } from "@/lib/types";
import { destructiveButtonClass, inputClass, primaryButtonClass, selectClass } from "@/lib/ui";

export default function PortalTeamPage() {
  const [role, setRole] = useState<string>("landlord");
  const [items, setItems] = useState<TeamMemberItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<TeamMemberItem["role"]>("viewer");
  const [inviteMsg, setInviteMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const me = await fetchPortalMe();
      setRole(me.role);
      const res = await fetchPortalTeam();
      setItems(res.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load team");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleInvite = async () => {
    setInviteMsg(null);
    try {
      await invitePortalTeamMember({ email: inviteEmail.trim(), role: inviteRole });
      setInviteEmail("");
      setInviteMsg("Invitation sent.");
      void load();
    } catch (e) {
      setInviteMsg(e instanceof Error ? e.message : "Invite failed");
    }
  };

  if (loading) {
    return <p className="text-sm" style={{ color: "var(--theme-muted)" }}>Loading team…</p>;
  }

  if (error) {
    return <FeedbackPanel tone="error" title="Error" description={error} />;
  }

  const canManage = role === "landlord";

  return (
    <div className="space-y-8">
      <PageHeader
        title="Team"
        subtitle="Delegated portal access for your portfolio. Invitations require a registered user with that email."
      />

      {canManage ? (
        <div className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
          <h2 className="font-semibold text-foreground">Invite teammate</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
            <div>
              <label className="text-xs font-medium" htmlFor="invite-email" style={{ color: "var(--theme-muted)" }}>
                Email
              </label>
              <input
                id="invite-email"
                type="email"
                className={`${inputClass} mt-1`}
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@example.com"
              />
            </div>
            <div>
              <label className="text-xs font-medium" htmlFor="invite-role" style={{ color: "var(--theme-muted)" }}>
                Role
              </label>
              <select
                id="invite-role"
                className={`${selectClass} mt-1 w-full sm:w-36`}
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as TeamMemberItem["role"])}
              >
                <option value="viewer">Viewer</option>
                <option value="editor">Editor</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <button
              type="button"
              className={primaryButtonClass}
              disabled={!inviteEmail.trim()}
              onClick={() => void handleInvite()}
            >
              Invite
            </button>
          </div>
          {inviteMsg ? (
            <p className="mt-3 text-sm" style={{ color: "var(--theme-muted)" }}>
              {inviteMsg}
            </p>
          ) : null}
        </div>
      ) : (
        <p className="text-sm" style={{ color: "var(--theme-muted)" }}>
          Only the portfolio owner can invite or remove teammates.
        </p>
      )}

      <ul className="space-y-3">
        {items.map((m) => (
          <li
            key={m.id}
            className="flex flex-col gap-3 rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="font-medium text-foreground">{m.member_email}</p>
              <p className="text-xs" style={{ color: "var(--theme-muted)" }}>
                Role: {m.role}
                {m.accepted_at ? ` · accepted ${new Date(m.accepted_at).toLocaleDateString()}` : " · pending"}
              </p>
            </div>
            {canManage ? (
              <div className="flex flex-wrap items-center gap-2">
                <select
                  className={selectClass}
                  value={m.role}
                  onChange={(e) =>
                    void (async () => {
                      try {
                        await updatePortalTeamMember(m.id, e.target.value as TeamMemberItem["role"]);
                        void load();
                      } catch {
                        /* noop */
                      }
                    })()
                  }
                  aria-label={`Role for ${m.member_email}`}
                >
                  <option value="viewer">Viewer</option>
                  <option value="editor">Editor</option>
                  <option value="admin">Admin</option>
                </select>
                <button
                  type="button"
                  className={destructiveButtonClass}
                  onClick={() =>
                    void (async () => {
                      if (!confirm(`Remove ${m.member_email} from the team?`)) return;
                      try {
                        await removePortalTeamMember(m.id);
                        void load();
                      } catch {
                        /* noop */
                      }
                    })()
                  }
                >
                  Remove
                </button>
              </div>
            ) : null}
          </li>
        ))}
      </ul>

      {items.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--theme-muted)" }}>
          No team members yet.
        </p>
      ) : null}
    </div>
  );
}
