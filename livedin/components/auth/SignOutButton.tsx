"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

type SignOutButtonProps = {
  redirectTo?: string;
  className?: string;
};

export function SignOutButton({
  redirectTo = "/",
  className,
}: SignOutButtonProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const handleSignOut = async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    setSubmitting(true);
    try {
      await supabase.auth.signOut();
      router.push(redirectTo);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={submitting}
      className={`disabled:pointer-events-none disabled:opacity-50 ${
        className ??
        "rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-foreground hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:hover:bg-zinc-800"
      }`}
    >
      {submitting ? "Signing out…" : "Sign out"}
    </button>
  );
}
