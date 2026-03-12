"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { FeedbackPanel } from "@/components/ui/FeedbackPanel";
import { adminFetch } from "@/lib/admin-client";
import {
  formatBytes,
  formatDateTime,
  propertyStatusBadgeClass,
} from "@/lib/admin-display";
import type {
  AdminPropertyListItem,
  AdminPropertyPhotoCreateInput,
  AdminPropertyPhotoItem,
} from "@/lib/types";
import {
  destructiveButtonClass,
  inputClass,
  primaryButtonClass,
  sectionCardClass,
  secondaryButtonClass,
} from "@/lib/ui";

type PhotoDraft = {
  r2_bucket: string;
  r2_key: string;
  content_type: string;
  bytes: string;
  width: string;
  height: string;
};

const EMPTY_DRAFT: PhotoDraft = {
  r2_bucket: "",
  r2_key: "",
  content_type: "",
  bytes: "",
  width: "",
  height: "",
};

function toNullableNumber(value: string): number | null {
  if (!value.trim()) {
    return null;
  }

  return Number(value);
}

export default function AdminPropertyPhotosPage() {
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : "";
  const hasValidId = Boolean(id);

  const [property, setProperty] = useState<AdminPropertyListItem | null>(null);
  const [photos, setPhotos] = useState<AdminPropertyPhotoItem[]>([]);
  const [draft, setDraft] = useState<PhotoDraft>(EMPTY_DRAFT);
  const [loading, setLoading] = useState(hasValidId);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [banner, setBanner] = useState<{
    tone: "success" | "error";
    message: string;
  } | null>(null);

  const load = useCallback(async () => {
    if (!id) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [propertyData, photoData] = await Promise.all([
        adminFetch<AdminPropertyListItem>(`/api/admin/properties/${id}`),
        adminFetch<{ items: AdminPropertyPhotoItem[] }>(
          `/api/admin/properties/${id}/photos`,
        ),
      ]);

      setProperty(propertyData);
      setPhotos(photoData.items ?? []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load property photos.",
      );
      setProperty(null);
      setPhotos([]);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!hasValidId) {
      return;
    }

    void load();
  }, [hasValidId, load]);

  const handleDraftChange = (field: keyof PhotoDraft, value: string) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!id) {
      return;
    }

    setSaving(true);
    setBanner(null);
    setError(null);

    try {
      const payload: AdminPropertyPhotoCreateInput = {
        r2_bucket: draft.r2_bucket.trim(),
        r2_key: draft.r2_key.trim(),
        content_type: draft.content_type.trim() || null,
        bytes: toNullableNumber(draft.bytes),
        width: toNullableNumber(draft.width),
        height: toNullableNumber(draft.height),
      };

      await adminFetch(`/api/admin/properties/${id}/photos`, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setDraft(EMPTY_DRAFT);
      setBanner({
        tone: "success",
        message: "Saved property photo metadata.",
      });
      await load();
    } catch (err) {
      setBanner({
        tone: "error",
        message:
          err instanceof Error
            ? err.message
            : "Failed to save property photo metadata.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (photo: AdminPropertyPhotoItem) => {
    const confirmed = window.confirm(
      `Remove the metadata row for ${photo.r2_key}? This does not delete the object from your bucket.`,
    );
    if (!confirmed) {
      return;
    }

    setDeletingId(photo.id);
    setBanner(null);

    try {
      await adminFetch(`/api/admin/properties/${id}/photos/${photo.id}`, {
        method: "DELETE",
      });
      setBanner({
        tone: "success",
        message: "Removed property photo metadata.",
      });
      await load();
    } catch (err) {
      setBanner({
        tone: "error",
        message:
          err instanceof Error
            ? err.message
            : "Failed to delete property photo metadata.",
      });
    } finally {
      setDeletingId(null);
    }
  };

  if (!hasValidId) {
    return (
      <FeedbackPanel tone="error" description="Invalid property ID." />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <Link href="/admin/properties" className={secondaryButtonClass}>
          Back to properties
        </Link>
        {property ? (
          <Link
            href={`/admin/properties/${property.id}/edit`}
            className={secondaryButtonClass}
          >
            Edit property
          </Link>
        ) : null}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-20 animate-pulse rounded-2xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900"
              aria-hidden
            />
          ))}
        </div>
      ) : null}

      {error && !loading ? <FeedbackPanel tone="error" description={error} /> : null}
      {banner ? <FeedbackPanel tone={banner.tone} description={banner.message} /> : null}

      {!loading && property ? (
        <>
          <section className={`${sectionCardClass} p-6 sm:p-8`}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-3xl">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500 dark:text-zinc-400">
                  Property media
                </p>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
                  {property.display_name}
                </h1>
                <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                  Register R2-backed photo metadata so public property pages can
                  render an image gallery when a public photo base URL is configured.
                </p>
              </div>
              <span
                className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${propertyStatusBadgeClass(property.status)}`}
              >
                {property.status}
              </span>
            </div>
          </section>

          <section className={`${sectionCardClass} p-6`}>
            <h2 className="text-lg font-semibold text-foreground">
              Register photo metadata
            </h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              This links a property to an existing R2 object key. Deleting the row
              here does not remove the object from storage.
            </p>

            <form onSubmit={handleCreate} className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="block text-sm">
                <span className="mb-2 block font-medium text-foreground">
                  R2 bucket
                </span>
                <input
                  value={draft.r2_bucket}
                  onChange={(event) =>
                    handleDraftChange("r2_bucket", event.target.value)
                  }
                  className={inputClass}
                  placeholder="property-photos"
                  required
                />
              </label>
              <label className="block text-sm">
                <span className="mb-2 block font-medium text-foreground">
                  R2 key
                </span>
                <input
                  value={draft.r2_key}
                  onChange={(event) => handleDraftChange("r2_key", event.target.value)}
                  className={inputClass}
                  placeholder="properties/building-123/front.jpg"
                  required
                />
              </label>
              <label className="block text-sm">
                <span className="mb-2 block font-medium text-foreground">
                  Content type
                </span>
                <input
                  value={draft.content_type}
                  onChange={(event) =>
                    handleDraftChange("content_type", event.target.value)
                  }
                  className={inputClass}
                  placeholder="image/jpeg"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-2 block font-medium text-foreground">
                  Bytes
                </span>
                <input
                  value={draft.bytes}
                  onChange={(event) => handleDraftChange("bytes", event.target.value)}
                  className={inputClass}
                  inputMode="numeric"
                  placeholder="248120"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-2 block font-medium text-foreground">
                  Width
                </span>
                <input
                  value={draft.width}
                  onChange={(event) => handleDraftChange("width", event.target.value)}
                  className={inputClass}
                  inputMode="numeric"
                  placeholder="1600"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-2 block font-medium text-foreground">
                  Height
                </span>
                <input
                  value={draft.height}
                  onChange={(event) => handleDraftChange("height", event.target.value)}
                  className={inputClass}
                  inputMode="numeric"
                  placeholder="1066"
                />
              </label>
              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={saving}
                  className={primaryButtonClass}
                >
                  {saving ? "Saving…" : "Save photo metadata"}
                </button>
              </div>
            </form>
          </section>

          <section className={`${sectionCardClass} p-6`}>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-foreground">
                Registered photos
              </h2>
              <span className="text-sm text-zinc-500 dark:text-zinc-400">
                {photos.length} item{photos.length === 1 ? "" : "s"}
              </span>
            </div>

            {photos.length === 0 ? (
              <div className="mt-4">
                <FeedbackPanel description="No property photo metadata has been registered yet." />
              </div>
            ) : (
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                {photos.map((photo) => (
                  <article
                    key={photo.id}
                    className="overflow-hidden rounded-3xl border border-zinc-200 dark:border-zinc-800"
                  >
                    {photo.display_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={photo.display_url}
                        alt=""
                        className="h-48 w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-48 items-center justify-center bg-[linear-gradient(135deg,#27272a_0%,#3f3f46_40%,#71717a_100%)] px-6 text-center text-sm text-white">
                        Public preview needs `PROPERTY_PHOTO_BASE_URL` or
                        `NEXT_PUBLIC_PROPERTY_PHOTO_BASE_URL`.
                      </div>
                    )}
                    <div className="space-y-3 p-4">
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {photo.r2_key}
                        </p>
                        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
                          {photo.r2_bucket}
                        </p>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            Content type
                          </p>
                          <p className="mt-1 text-sm text-foreground">
                            {photo.content_type ?? "—"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            Size
                          </p>
                          <p className="mt-1 text-sm text-foreground">
                            {formatBytes(photo.bytes)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            Dimensions
                          </p>
                          <p className="mt-1 text-sm text-foreground">
                            {photo.width && photo.height
                              ? `${photo.width} × ${photo.height}`
                              : "—"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            Added
                          </p>
                          <p className="mt-1 text-sm text-foreground">
                            {formatDateTime(photo.created_at)}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <Link
                          href={`/properties/${property.id}`}
                          className={secondaryButtonClass}
                        >
                          Open public page
                        </Link>
                        <button
                          type="button"
                          onClick={() => void handleDelete(photo)}
                          disabled={deletingId === photo.id}
                          className={destructiveButtonClass}
                        >
                          {deletingId === photo.id ? "Removing…" : "Remove"}
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}
