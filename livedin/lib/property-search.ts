/**
 * Property search data access. Mock implementation for Slice 01.
 * Slice 06 will replace this with Supabase reads; signature and PropertySearchResponse shape stay unchanged.
 */

import type { PropertySearchResponse } from "./types";

export type PropertySearchOptions = {
  neighbourhoodId?: string | null;
  minScore?: number | null;
  sort?: "trust" | "reviews" | "recent";
};

/**
 * Search properties by query.
 * Slice 06: backed by Supabase via /api/properties.
 */
export async function searchProperties(
  query: string,
  options?: PropertySearchOptions,
): Promise<PropertySearchResponse> {
  const params = new URLSearchParams();
  if (query.trim()) {
    params.set("q", query.trim());
  }
  if (options?.neighbourhoodId) {
    params.set("neighbourhood", options.neighbourhoodId);
  }
  if (options?.minScore !== undefined && options?.minScore !== null) {
    params.set("minScore", String(options.minScore));
  }
  if (options?.sort) {
    params.set("sort", options.sort);
  }

  const res = await fetch(`/api/properties?${params.toString()}`, {
    method: "GET",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch properties");
  }

  const data = (await res.json()) as PropertySearchResponse;
  return data;
}
