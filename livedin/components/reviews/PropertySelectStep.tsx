"use client";

import { useMemo, useState } from "react";
import {
  getMockPropertiesForReview,
  getMockPropertyById,
  type MockPropertyForReview,
} from "@/lib/mocks/properties";

type PropertySelectStepProps = {
  initialPropertyId: string;
  onContinue: (property: MockPropertyForReview) => void;
};

function formatAddress(p: MockPropertyForReview): string {
  const parts = [p.address_line1, p.city, p.province].filter(Boolean);
  return parts.join(", ");
}

export function PropertySelectStep({
  initialPropertyId,
  onContinue,
}: PropertySelectStepProps) {
  const allProperties = useMemo(() => getMockPropertiesForReview(), []);
  const preselected = useMemo(
    () =>
      initialPropertyId && initialPropertyId !== "new"
        ? getMockPropertyById(initialPropertyId)
        : null,
    [initialPropertyId]
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [selected, setSelected] = useState<MockPropertyForReview | null>(
    preselected
  );

  const filteredList = useMemo(() => {
    if (!searchQuery.trim()) return allProperties;
    const q = searchQuery.toLowerCase().trim();
    return allProperties.filter((p) => {
      const searchable = [
        p.display_name,
        p.address_line1,
        p.city,
        p.province,
        p.management_company ?? "",
      ].join(" ");
      return searchable.toLowerCase().includes(q);
    });
  }, [allProperties, searchQuery]);

  const currentSelection = selected ?? preselected;
  const canContinue = currentSelection != null;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-foreground">Review — Address</h2>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Select the property you want to review.
      </p>

      {preselected ? (
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
            {filteredList.length === 0 ? (
              <p className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
                No properties match your search.
              </p>
            ) : (
              filteredList.map((p) => (
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
