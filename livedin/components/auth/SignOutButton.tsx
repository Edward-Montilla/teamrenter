"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { secondaryButtonClass } from "@/lib/ui";

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
        className ?? secondaryButtonClass
      }`}
    >
      {submitting ? "Signing out…" : "Sign out"}
    </button>
  );
}
