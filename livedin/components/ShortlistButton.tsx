"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { toggleShortlist } from "@/lib/portal-client";
import { cn } from "@/lib/ui";

type ShortlistButtonProps = {
  propertyId: string;
  initialShortlisted: boolean;
  className?: string;
};

export function ShortlistButton({
  propertyId,
  initialShortlisted,
  className,
}: ShortlistButtonProps) {
  const [on, setOn] = useState(initialShortlisted);
  const [busy, setBusy] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    setOn(initialShortlisted);
  }, [initialShortlisted]);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setSignedIn(false);
      return;
    }

    let cancelled = false;

    void supabase.auth.getSession().then(({ data }) => {
      if (!cancelled) {
        setSignedIn(Boolean(data.session?.access_token));
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSignedIn(Boolean(session?.access_token));
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const handleClick = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!signedIn || busy) return;

      const prev = on;
      setOn(!prev);
      setBusy(true);
      try {
        const res = await toggleShortlist({ property_id: propertyId });
        setOn(res.action === "added");
      } catch {
        setOn(prev);
      } finally {
        setBusy(false);
      }
    },
    [busy, on, propertyId, signedIn],
  );

  if (!getSupabaseBrowserClient()) {
    return null;
  }

  if (!signedIn) {
    return (
      <Link
        href={`/sign-in?redirect=${encodeURIComponent(`/?highlight=${propertyId}`)}`}
        className={cn(
          "inline-flex rounded-xl border border-zinc-200 bg-white/90 p-2 text-zinc-500 shadow-sm backdrop-blur transition hover:border-zinc-300 hover:text-zinc-800 dark:border-zinc-700 dark:bg-zinc-950/90 dark:hover:border-zinc-600 dark:hover:text-zinc-200",
          className,
        )}
        aria-label="Sign in to save properties to your shortlist"
        title="Sign in to shortlist"
        onClick={(e) => e.stopPropagation()}
      >
        <Heart className="h-5 w-5" strokeWidth={2} />
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={cn(
        "inline-flex rounded-xl border border-zinc-200 bg-white/90 p-2 shadow-sm backdrop-blur transition hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-950/90 dark:hover:border-zinc-600",
        on
          ? "text-[var(--theme-primary)]"
          : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200",
        className,
      )}
      aria-pressed={on}
      aria-label={on ? "Remove from shortlist" : "Add to shortlist"}
      disabled={busy}
      onClick={handleClick}
    >
      <Heart
        className="h-5 w-5"
        strokeWidth={2}
        fill={on ? "currentColor" : "none"}
      />
    </button>
  );
}
