"use client";

import { useEffect, useState } from "react";
import type {
  PropertyDetailPublic,
  PropertySearchResponse,
  ReviewableProperty,
} from "@/lib/types";

type PropertySelectStepProps = {
  initialPropertyId: string;
  onContinue: (property: ReviewableProperty) => void;
};

function formatAddress(p: ReviewableProperty): string {
  const parts = [p.address_line1, p.city, p.province].filter(Boolean);
  return parts.join(", ");
}

function mapListItemToReviewableProperty(
  item: PropertySearchResponse["items"][number],
): ReviewableProperty {
  return {
    id: item.id,
    display_name: item.display_name,
    address_line1: item.address_line1,
    city: item.city,
    province: item.province,
    management_company: item.management_company,
  };
}

function mapDetailToReviewableProperty(
  detail: PropertyDetailPublic,
): ReviewableProperty {
  return {
    id: detail.property.id,
    display_name: detail.property.display_name,
    address_line1: detail.property.address_line1,
    city: detail.property.city,
    province: detail.property.province,
    management_company: detail.property.management_company,
  };
}

export function PropertySelectStep({
  initialPropertyId,
  onContinue,
}: PropertySelectStepProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selected, setSelected] = useState<ReviewableProperty | null>(null);
  const [preselected, setPreselected] = useState<ReviewableProperty | null>(null);
  const [items, setItems] = useState<ReviewableProperty[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [loadingProperty, setLoadingProperty] = useState(
    Boolean(initialPropertyId && initialPropertyId !== "new"),
  );
  const [propertyError, setPropertyError] = useState<string | null>(null);

  const hasExplicitPropertyId = Boolean(
    initialPropertyId && initialPropertyId !== "new",
  );

  useEffect(() => {
    let cancelled = false;

    async function loadProperty() {
      if (!hasExplicitPropertyId) {
        setLoadingProperty(false);
        setPropertyError(null);
        setPreselected(null);
        return;
      }

      setLoadingProperty(true);
      setPropertyError(null);

      try {
        const res = await fetch(`/api/properties/${initialPropertyId}`);
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error("This property is no longer available to review.");
          }
          throw new Error("Failed to load the selected property.");
        }

        const detail = (await res.json()) as PropertyDetailPublic;
        if (cancelled) return;
        const property = mapDetailToReviewableProperty(detail);
        setPreselected(property);
        setSelected(property);
      } catch (error) {
        if (cancelled) return;
        setPropertyError(
          error instanceof Error
            ? error.message
            : "Failed to load the selected property.",
        );
        setPreselected(null);
        setSelected(null);
      } finally {
        if (!cancelled) {
          setLoadingProperty(false);
        }
      }
    }

    loadProperty();
    return () => {
      cancelled = true;
    };
  }, [hasExplicitPropertyId, initialPropertyId]);

  useEffect(() => {
    if (loadingProperty || preselected) {
      return;
    }

    const controller = new AbortController();

    async function loadProperties() {
      setLoadingList(true);
      setListError(null);
      try {
        const params = new URLSearchParams();
        if (searchQuery.trim()) {
          params.set("q", searchQuery.trim());
        }

        const query = params.toString();
        const res = await fetch(`/api/properties${query ? `?${query}` : ""}`, {
          signal: controller.signal,
        });
        if (!res.ok) {
          throw new Error("Failed to load properties.");
        }

        const payload = (await res.json()) as PropertySearchResponse;
        setItems(payload.items.map(mapListItemToReviewableProperty));
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }
        setListError(
          error instanceof Error ? error.message : "Failed to load properties.",
        );
        setItems([]);
      } finally {
        if (!controller.signal.aborted) {
          setLoadingList(false);
        }
      }
    }

    loadProperties();
    return () => controller.abort();
  }, [loadingProperty, preselected, searchQuery]);

  const currentSelection = selected ?? preselected;
  const canContinue = currentSelection != null;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-foreground">Review Address</h2>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Select the property you want to review.
      </p>

      {loadingProperty ? (
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
          Loading property details…
        </div>
      ) : preselected ? (
        <div className="space-y-4">
          <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
            <h3 className="font-semibold text-foreground">
              {preselected.display_name}
            </h3>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              {formatAddress(preselected)}
            </p>
            {preselected.management_company && (
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-500">
                {preselected.management_company}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => onContinue(preselected)}
            className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90"
          >
            Continue
          </button>
        </div>
      ) : (
        <>
          {propertyError && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/70 dark:bg-amber-950/30 dark:text-amber-200">
              {propertyError} Choose another property below.
            </div>
          )}
          <div className="relative flex items-center rounded-lg border border-zinc-300 bg-white dark:border-zinc-600 dark:bg-zinc-900">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by address or management company"
              className="w-full rounded-lg border-0 bg-transparent py-3 pl-4 pr-4 text-foreground placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:placeholder:text-zinc-500"
              aria-label="Search properties"
            />
          </div>
          <div className="max-h-80 space-y-2 overflow-y-auto">
            {loadingList ? (
              <div className="space-y-2">
                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="h-20 animate-pulse rounded-lg border border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800"
                    aria-hidden
                  />
                ))}
              </div>
            ) : listError ? (
              <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">
                {listError}
              </p>
            ) : items.length === 0 ? (
              <p className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
                No properties match your search.
              </p>
            ) : (
              items.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelected(p)}
                  className={`block w-full rounded-lg border p-4 text-left transition-colors ${
                    selected?.id === p.id
                      ? "border-foreground bg-zinc-100 dark:bg-zinc-800"
                      : "border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-600 dark:hover:bg-zinc-800"
                  }`}
                >
                  <h3 className="font-semibold text-foreground">
                    {p.display_name}
                  </h3>
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                    {formatAddress(p)}
                  </p>
                  {p.management_company && (
                    <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-500">
                      {p.management_company}
                    </p>
                  )}
                </button>
              ))
            )}
          </div>
          <button
            type="button"
            disabled={!canContinue}
            onClick={() => currentSelection && onContinue(currentSelection)}
            className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50 disabled:pointer-events-none"
          >
            Continue
          </button>
        </>
      )}
    </div>
  );
}
