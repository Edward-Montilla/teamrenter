"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { PropertyForm } from "@/components/admin/PropertyForm";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import type { AdminPropertyCreateInput } from "@/lib/types";

export default function NewPropertyPage() {
  const router = useRouter();

  const handleSubmit = async (data: AdminPropertyCreateInput) => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) throw new Error("Not configured");
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.access_token) throw new Error("Not signed in");

    const res = await fetch("/api/admin/properties", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      throw new Error((json as { message?: string }).message ?? "Failed to create property");
    }
    router.push("/admin/properties");
  };

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/properties"
          className="text-sm font-medium text-zinc-600 hover:text-foreground dark:text-zinc-400 dark:hover:text-foreground"
        >
          ← Back to properties
        </Link>
      </div>
      <h1 className="text-2xl font-bold tracking-tight">New property</h1>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        Add a new rental property. Set status to active to show it on the public browse.
      </p>
      <div className="mt-6">
        <PropertyForm mode="create" onSubmit={handleSubmit} />
      </div>
    </div>
  );
}
