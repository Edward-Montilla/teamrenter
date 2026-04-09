"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { FeedbackPanel } from "@/components/ui/FeedbackPanel";
import { fetchNotificationPreferences, fetchPortalMe, saveNotificationPreferences } from "@/lib/portal-client";
import type { NotificationPreference } from "@/lib/types";

const ROWS: Array<{ key: keyof NotificationPreference; label: string }> = [
  { key: "new_review_alert", label: "New review alert" },
  { key: "review_response_approved", label: "Review response approved" },
  { key: "weekly_summary", label: "Weekly summary" },
  { key: "review_gap_alert", label: "Review gap alert" },
  { key: "team_activity_alert", label: "Team activity alert" },
];

export default function PortalSettingsPage() {
  const [role, setRole] = useState("landlord");
  const [prefs, setPrefs] = useState<NotificationPreference | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const me = await fetchPortalMe();
      setRole(me.role);
      const p = await fetchNotificationPreferences();
      setPrefs(p);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const toggle = async (key: keyof NotificationPreference) => {
    if (!prefs || role !== "landlord") return;
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    setSaving(true);
    try {
      const saved = await saveNotificationPreferences({ [key]: next[key] });
      setPrefs(saved);
    } catch {
      setPrefs(prefs);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-sm" style={{ color: "var(--theme-muted)" }}>Loading settings…</p>;
  }

  if (error) {
    return <FeedbackPanel tone="error" title="Error" description={error} />;
  }

  if (role !== "landlord") {
    return (
      <div className="space-y-4">
        <PageHeader title="Notification settings" />
        <p className="text-sm" style={{ color: "var(--theme-muted)" }}>
          Notification preferences are managed by the portfolio owner account.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Notification settings"
        subtitle="Choose which operational emails you want enabled. Changes save immediately."
      />

      {saving ? (
        <p className="text-xs" style={{ color: "var(--theme-muted)" }}>
          Saving…
        </p>
      ) : null}

      <ul className="max-w-lg space-y-3">
        {ROWS.map(({ key, label }) => (
          <li
            key={key}
            className="flex items-center justify-between gap-4 rounded-2xl border border-zinc-200 px-4 py-3 dark:border-zinc-800"
          >
            <span className="text-sm font-medium text-foreground">{label}</span>
            <button
              type="button"
              role="switch"
              aria-checked={prefs?.[key] ?? false}
              className="relative h-7 w-12 shrink-0 rounded-full transition"
              style={{
                background: prefs?.[key] ? "var(--theme-primary)" : "var(--theme-border)",
              }}
              onClick={() => void toggle(key)}
            >
              <span
                className="absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-[left]"
                style={{ left: prefs?.[key] ? "calc(100% - 1.65rem)" : "0.125rem" }}
              />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
