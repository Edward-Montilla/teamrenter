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
  variant?: "default" | "facelift";
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
  variant = "default",
}: PropertySelectStepProps) {
  const fx = variant === "facelift";
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
          fx
            ? isSelected
              ? "border-[#0F1F38] bg-[#0F1F38] text-white shadow-sm"
              : "border-[#E2DDD6] bg-white hover:border-[#E8913A]/40 hover:bg-[#F7F4EF]"
            : isSelected
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
                fx
                  ? isSelected
                    ? "text-white/90"
                    : "text-[#717182]"
                  : isSelected
                    ? "text-white/85 dark:text-zinc-700"
                    : "text-zinc-600 dark:text-zinc-400",
              )}
            >
              {formatAddress(property)}
            </p>
            {property.management_company ? (
              <p
                className={cn(
                  "mt-2 text-xs font-medium uppercase tracking-[0.18em]",
                  fx
                    ? isSelected
                      ? "text-white/75"
                      : "text-[#717182]"
                    : isSelected
                      ? "text-white/75 dark:text-zinc-600"
                      : "text-zinc-500 dark:text-zinc-500",
                )}
              >
                {property.management_company}
              </p>
            ) : null}
          </div>
          <span
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium",
              fx
                ? isSelected
                  ? "bg-white/15 text-white"
                  : "bg-[#F7F4EF] text-[#0F1F38]"
                : isSelected
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
              className={cn(
                "block text-sm font-medium",
                fx ? "text-[#0F1F38]" : "text-foreground",
              )}
            >
              Search by address or management company
            </label>
            <p
              className={cn(
                "mt-1 text-sm",
                fx ? "text-[#717182]" : "text-zinc-600 dark:text-zinc-400",
              )}
            >
              Pick the exact location first so the rest of the review stays tied to the right property.
            </p>
          </div>

          {loadingProperty ? (
            <FeedbackPanel
              title="Loading property details"
              description="Checking the property you selected before opening the review form."
            />
          ) : preselected ? (
            <div
              className={cn(
                "rounded-3xl border bg-white p-5 shadow-sm",
                fx ? "border-[#E2DDD6]" : "border-zinc-200 dark:border-zinc-800 dark:bg-zinc-950",
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <h2
                  className={cn(
                    "text-lg font-semibold",
                    fx ? "text-[#0F1F38]" : "text-foreground",
                  )}
                >
                  Selected property
                </h2>
                <span
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium",
                    fx
                      ? "bg-[#F7F4EF] text-[#0F1F38]"
                      : "bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300",
                  )}
                >
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
                  className={cn(
                    inputClass,
                    fx &&
                      "rounded-[12px] border-[#E2DDD6] focus:ring-[#E8913A]/40",
                  )}
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
                  <h2
                    className={cn(
                      "text-lg font-semibold",
                      fx ? "text-[#0F1F38]" : "text-foreground",
                    )}
                  >
                    Matching properties
                  </h2>
                  <p
                    className={cn(
                      "text-sm",
                      fx ? "text-[#717182]" : "text-zinc-500 dark:text-zinc-400",
                    )}
                    aria-live="polite"
                  >
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

        <aside
          className={cn(
            "rounded-3xl border p-5 lg:sticky lg:top-6 lg:self-start",
            fx
              ? "border-[#E2DDD6] bg-[#F7F4EF]"
              : "border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900",
          )}
        >
          <p
            className={cn(
              "text-sm font-medium uppercase tracking-[0.22em]",
              fx ? "text-[#717182]" : "text-zinc-500 dark:text-zinc-400",
            )}
          >
            Is this the correct location?
          </p>
          {currentSelection ? (
            <div
              className={cn(
                "mt-4 rounded-3xl border bg-white p-5",
                fx ? "border-[#E2DDD6]" : "border-zinc-200 dark:border-zinc-800 dark:bg-zinc-950",
              )}
            >
              <h3
                className={cn(
                  "text-lg font-semibold",
                  fx ? "text-[#0F1F38]" : "text-foreground",
                )}
              >
                {currentSelection.display_name}
              </h3>
              <p
                className={cn(
                  "mt-2 text-sm leading-6",
                  fx ? "text-[#717182]" : "text-zinc-600 dark:text-zinc-400",
                )}
              >
                {formatAddress(currentSelection)}
              </p>
              {currentSelection.management_company ? (
                <p
                  className={cn(
                    "mt-3 text-sm",
                    fx ? "text-[#717182]" : "text-zinc-500 dark:text-zinc-400",
                  )}
                >
                  Managed by {currentSelection.management_company}
                </p>
              ) : null}
            </div>
          ) : (
            <p
              className={cn(
                "mt-4 rounded-3xl border border-dashed px-4 py-6 text-sm leading-6",
                fx
                  ? "border-[#E2DDD6] text-[#717182]"
                  : "border-zinc-300 text-zinc-600 dark:border-zinc-700 dark:text-zinc-400",
              )}
            >
              Choose a property from the results list to confirm it here before continuing.
            </p>
          )}

          <div className="mt-5 space-y-3">
            <button
              type="button"
              disabled={!canContinue}
              onClick={() => currentSelection && onContinue(currentSelection)}
              className={
                fx
                  ? "w-full rounded-[12px] bg-[#E8913A] py-3 font-semibold text-white transition-colors hover:bg-[#d17f2f] disabled:cursor-not-allowed disabled:opacity-40"
                  : `${primaryButtonClass} w-full`
              }
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
                className={
                  fx
                    ? "w-full rounded-[12px] border border-[#E2DDD6] bg-white py-3 font-semibold text-[#0F1F38] transition-colors hover:bg-[#F7F4EF]"
                    : `${secondaryButtonClass} w-full`
                }
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
