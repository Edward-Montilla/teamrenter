"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { PropertyForm } from "@/components/admin/PropertyForm";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import type { AdminPropertyListItem } from "@/lib/types";

export default function EditPropertyPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params?.id === "string" ? params.id : "";
  const hasValidId = Boolean(id);
  const [property, setProperty] = useState<AdminPropertyListItem | null>(null);
  const [loading, setLoading] = useState(hasValidId);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hasValidId) {
      return;
    }

    let cancelled = false;
    async function load() {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        if (!cancelled) {
          setError("Not configured");
          setLoading(false);
        }
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (cancelled) return;
      if (!session?.access_token) {
        setError("Not signed in");
        setLoading(false);
        return;
      }

      const res = await fetch(`/api/admin/properties/${id}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (cancelled) return;

      if (!res.ok) {
        if (res.status === 404) setError("Property not found");
        else setError("Failed to load property");
        setLoading(false);
        return;
      }

      const data = (await res.json()) as AdminPropertyListItem;
      if (cancelled) return;
      setProperty(data);
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [hasValidId, id]);

  const handleSubmit = async (data: Record<string, unknown>) => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !id) throw new Error("Not configured");
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.access_token) throw new Error("Not signed in");

    const res = await fetch(`/api/admin/properties/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      throw new Error((json as { message?: string }).message ?? "Failed to update property");
    }
    router.push("/admin/properties");
  };

  if (!hasValidId) {
    return (
      <div>
        <Link
          href="/admin/properties"
          className="text-sm font-medium text-zinc-600 hover:text-foreground dark:text-zinc-400 dark:hover:text-foreground"
        >
          ← Back to properties
        </Link>
        <p className="mt-4 text-red-600 dark:text-red-400">Invalid property ID</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-zinc-500">Loading…</p>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div>
        <Link
          href="/admin/properties"
          className="text-sm font-medium text-zinc-600 hover:text-foreground dark:text-zinc-400 dark:hover:text-foreground"
        >
          ← Back to properties
        </Link>
        <p className="mt-4 text-red-600 dark:text-red-400">{error ?? "Property not found"}</p>
      </div>
    );
  }

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
      <h1 className="text-2xl font-bold tracking-tight">Edit property</h1>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        Update details. Set status to inactive to hide from public browse.
      </p>
      <div className="mt-6">
        <PropertyForm
          mode="edit"
          initial={property}
          propertyId={id}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}
