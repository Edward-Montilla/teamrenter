"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { FeedbackPanel } from "@/components/ui/FeedbackPanel";
import { fetchCompanyProfile, fetchPortalMe, saveCompanyProfile } from "@/lib/portal-client";
import type { CompanyProfile } from "@/lib/types";
import { inputClass, primaryButtonClass, textareaClass } from "@/lib/ui";

export default function PortalProfilePage() {
  const [role, setRole] = useState("landlord");
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const me = await fetchPortalMe();
        setRole(me.role);
        const p = await fetchCompanyProfile();
        setProfile(p);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSave = async () => {
    if (!profile?.company_name?.trim()) return;
    setSaving(true);
    setSaved(false);
    try {
      const out = await saveCompanyProfile({
        company_name: profile.company_name.trim(),
        description: profile.description,
        website_url: profile.website_url,
        contact_email: profile.contact_email,
        contact_phone: profile.contact_phone,
      });
      setProfile(out);
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-sm" style={{ color: "var(--theme-muted)" }}>Loading profile…</p>;
  }

  if (error && !profile) {
    return <FeedbackPanel tone="error" title="Error" description={error} />;
  }

  if (role !== "landlord") {
    return (
      <div className="space-y-4">
        <PageHeader title="Company profile" subtitle="Visible business details for your portfolio." />
        <p className="text-sm" style={{ color: "var(--theme-muted)" }}>
          Only landlords can edit the company profile. Admins can view public profile data in Supabase or future admin tools.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Company profile"
        subtitle="Information renters may see alongside your portfolio. Keep contact channels accurate."
      />

      {profile ? (
        <form
          className="max-w-xl space-y-4 rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800"
          onSubmit={(e) => {
            e.preventDefault();
            void handleSave();
          }}
        >
          <div>
            <label className="text-sm font-medium" htmlFor="co-name">
              Company name
            </label>
            <input
              id="co-name"
              className={`${inputClass} mt-1`}
              value={profile.company_name}
              onChange={(e) => setProfile({ ...profile, company_name: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium" htmlFor="co-desc">
              Description
            </label>
            <textarea
              id="co-desc"
              className={`${textareaClass} mt-1`}
              rows={4}
              value={profile.description ?? ""}
              onChange={(e) =>
                setProfile({ ...profile, description: e.target.value || null })
              }
            />
          </div>
          <div>
            <label className="text-sm font-medium" htmlFor="co-web">
              Website
            </label>
            <input
              id="co-web"
              className={`${inputClass} mt-1`}
              value={profile.website_url ?? ""}
              onChange={(e) =>
                setProfile({ ...profile, website_url: e.target.value || null })
              }
            />
          </div>
          <div>
            <label className="text-sm font-medium" htmlFor="co-email">
              Contact email
            </label>
            <input
              id="co-email"
              type="email"
              className={`${inputClass} mt-1`}
              value={profile.contact_email ?? ""}
              onChange={(e) =>
                setProfile({ ...profile, contact_email: e.target.value || null })
              }
            />
          </div>
          <div>
            <label className="text-sm font-medium" htmlFor="co-phone">
              Phone
            </label>
            <input
              id="co-phone"
              className={`${inputClass} mt-1`}
              value={profile.contact_phone ?? ""}
              onChange={(e) =>
                setProfile({ ...profile, contact_phone: e.target.value || null })
              }
            />
          </div>
          <button type="submit" className={primaryButtonClass} disabled={saving}>
            {saving ? "Saving…" : "Save profile"}
          </button>
          {saved ? (
            <p className="text-sm text-[var(--theme-success)]">Saved.</p>
          ) : null}
        </form>
      ) : null}
    </div>
  );
}
