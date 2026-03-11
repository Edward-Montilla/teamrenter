"use client";

import { useEffect, useState } from "react";
import type { AdminAuditLogItem } from "@/lib/types";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

type AdminAuditFeedProps = {
  title?: string;
  limit?: number;
  targetTypes?: string[];
  refreshKey?: string | number;
};

function formatTimestamp(value: string): string {
  return new Date(value).toLocaleString();
}

export function AdminAuditFeed({
  title = "Recent moderation activity",
  limit = 8,
  targetTypes = ["review", "insight"],
  refreshKey,
}: AdminAuditFeedProps) {
  const [items, setItems] = useState<AdminAuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const targetTypesKey = targetTypes.join(",");

  useEffect(() => {
    let active = true;

    const load = async () => {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        if (active) {
          setLoading(false);
          setError("Supabase auth is not configured.");
        }
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!active) return;

      if (!session?.access_token) {
        setLoading(false);
        setError("Not signed in.");
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        params.set("limit", String(limit));
        if (targetTypesKey) {
          params.set("target_type", targetTypesKey);
        }

        const res = await fetch(`/api/admin/audit?${params.toString()}`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });

        if (!res.ok) {
          throw new Error("Failed to load audit activity.");
        }

        const data = (await res.json()) as { items?: AdminAuditLogItem[] };
        if (!active) return;
        setItems(data.items ?? []);
      } catch (err) {
        if (!active) return;
        setError(
          err instanceof Error ? err.message : "Failed to load audit activity.",
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [limit, refreshKey, targetTypesKey]);

  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-950">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        <span className="text-xs uppercase tracking-[0.2em] text-zinc-400">
          Audit log
        </span>
      </div>

      {loading && (
        <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
          Loading activity…
        </p>
      )}

      {error && !loading && (
        <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {!loading && !error && items.length === 0 && (
        <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
          No moderation activity yet.
        </p>
      )}

      {!loading && !error && items.length > 0 && (
        <div className="mt-4 space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium text-foreground">
                  {item.action_type.replaceAll("_", " ")}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {formatTimestamp(item.created_at)}
                </p>
              </div>
              <p className="mt-1 text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                {item.target_type} · {item.target_id}
              </p>
              {item.details && (
                <pre className="mt-3 overflow-x-auto rounded bg-zinc-950/95 p-3 text-xs text-zinc-100 dark:bg-black">
                  {JSON.stringify(item.details, null, 2)}
                </pre>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
