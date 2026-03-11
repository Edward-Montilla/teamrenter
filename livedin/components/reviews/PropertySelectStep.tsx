"use client";

import { useEffect, useState } from "react";
import type {
  PropertyDetailPublic,
  PropertySearchResponse,
  ReviewableProperty,
} from "@/lib/types";
import { FeedbackPanel } from "@/components/ui/FeedbackPanel";
import { cn, inputClass, primaryButtonClass, secondaryButtonClass } from "@/lib/ui";

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

  const renderPropertyButton = (property: ReviewableProperty) => {
    const isSelected = selected?.id === property.id || preselected?.id === property.id;

    return (
      <button
        key={property.id}
        type="button"
        onClick={() => setSelected(property)}
        className={cn(
          "block w-full rounded-3xl border p-4 text-left transition",
          isSelected
            ? "border-zinc-950 bg-zinc-950 text-white shadow-sm dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-950"
            : "border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700 dark:hover:bg-zinc-900",
        )}
        aria-pressed={isSelected}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-semibold">{property.display_name}</h3>
            <p
              className={cn(
                "mt-1 text-sm leading-6",
                isSelected ? "text-white/85 dark:text-zinc-700" : "text-zinc-600 dark:text-zinc-400",
              )}
            >
              {formatAddress(property)}
            </p>
            {property.management_company ? (
              <p
                className={cn(
                  "mt-2 text-xs font-medium uppercase tracking-[0.18em]",
                  isSelected ? "text-white/75 dark:text-zinc-600" : "text-zinc-500 dark:text-zinc-500",
                )}
              >
                {property.management_company}
              </p>
            ) : null}
          </div>
          <span
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium",
              isSelected
                ? "bg-white/15 text-white dark:bg-zinc-200 dark:text-zinc-900"
                : "bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300",
            )}
          >
            {isSelected ? "Selected" : "Choose"}
          </span>
        </div>
      </button>
    );
  };

  return (
    <div className="space-y-6 pt-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_320px]">
        <div className="space-y-5">
          <div>
            <label
              htmlFor="review-property-search"
              className="block text-sm font-medium text-foreground"
            >
              Search by address or management company
            </label>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Pick the exact location first so the rest of the review stays tied to the right property.
            </p>
          </div>

          {loadingProperty ? (
            <FeedbackPanel
              title="Loading property details"
              description="Checking the property you selected before opening the review form."
            />
          ) : preselected ? (
            <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-foreground">
                  Selected property
                </h2>
                <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                  Confirmed from link
                </span>
              </div>
              <div className="mt-4">{renderPropertyButton(preselected)}</div>
            </div>
          ) : (
            <>
              <div className="relative">
                <input
                  id="review-property-search"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Start typing an address or management company"
                  className={inputClass}
                  aria-label="Search properties"
                />
                {searchQuery ? (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-sm font-medium text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                  >
                    Clear
                  </button>
                ) : null}
              </div>

              {propertyError && (
                <FeedbackPanel
                  tone="warning"
                  description={`${propertyError} Choose another property below.`}
                />
              )}

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold text-foreground">Matching properties</h2>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400" aria-live="polite">
                    {loadingList ? "Searching…" : `${items.length} shown`}
                  </p>
                </div>
                <div className="max-h-[28rem] space-y-3 overflow-y-auto pr-1">
                  {loadingList ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((item) => (
                        <div
                          key={item}
                          className="h-28 animate-pulse rounded-3xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900"
                          aria-hidden
                        />
                      ))}
                    </div>
                  ) : listError ? (
                    <FeedbackPanel
                      tone="error"
                      description={listError}
                      primaryAction={{ label: "Retry", onClick: () => setSearchQuery((value) => value) }}
                    />
                  ) : items.length === 0 ? (
                    <FeedbackPanel
                      title="No matching properties"
                      description="Try a broader address search, a nearby street, or a management company name."
                    />
                  ) : (
                    items.map((p) => renderPropertyButton(p))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <aside className="rounded-3xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-900 lg:sticky lg:top-6 lg:self-start">
          <p className="text-sm font-medium uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-400">
            Is this the correct location?
          </p>
          {currentSelection ? (
            <div className="mt-4 rounded-3xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
              <h3 className="text-lg font-semibold text-foreground">
                {currentSelection.display_name}
              </h3>
              <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                {formatAddress(currentSelection)}
              </p>
              {currentSelection.management_company ? (
                <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
                  Managed by {currentSelection.management_company}
                </p>
              ) : null}
            </div>
          ) : (
            <p className="mt-4 rounded-3xl border border-dashed border-zinc-300 px-4 py-6 text-sm leading-6 text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
              Choose a property from the results list to confirm it here before continuing.
            </p>
          )}

          <div className="mt-5 space-y-3">
            <button
              type="button"
              disabled={!canContinue}
              onClick={() => currentSelection && onContinue(currentSelection)}
              className={`${primaryButtonClass} w-full`}
            >
              Continue
            </button>
            {!preselected ? (
              <button
                type="button"
                onClick={() => {
                  setSelected(null);
                  setSearchQuery("");
                }}
                className={`${secondaryButtonClass} w-full`}
              >
                Reset selection
              </button>
            ) : null}
          </div>
        </aside>
      </div>
    </div>
  );
}
