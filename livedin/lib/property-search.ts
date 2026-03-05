/**
 * Property search data access. Mock implementation for Slice 01.
 * Slice 06 will replace this with Supabase reads; signature and PropertySearchResponse shape stay unchanged.
 */

import type { PropertyListItem, PropertySearchResponse } from "./types";

const MOCK_PROPERTIES: PropertyListItem[] = [
  {
    id: "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
    display_name: "123 Maple Ave, Unit 4B",
    address_line1: "123 Maple Avenue",
    city: "Toronto",
    province: "ON",
    management_company: "Skyline Properties",
    trustscore_display_0_6: 5,
    review_count: 12,
  },
  {
    id: "b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d6e",
    display_name: "123 Maple Ave, Unit 12C",
    address_line1: "123 Maple Avenue",
    city: "Toronto",
    province: "ON",
    management_company: "Skyline Properties",
    trustscore_display_0_6: 4,
    review_count: 8,
  },
  {
    id: "c3d4e5f6-a7b8-6c7d-0e1f-2a3b4c5d6e7f",
    display_name: "Maple Court",
    address_line1: "200 Maple Street",
    city: "Toronto",
    province: "ON",
    management_company: "Urban Rentals Inc",
    trustscore_display_0_6: 6,
    review_count: 24,
  },
  {
    id: "d4e5f6a7-b8c9-7d8e-1f2a-3b4c5d6e7f8a",
    display_name: "Riverside Towers",
    address_line1: "450 River Road",
    city: "Vancouver",
    province: "BC",
    management_company: "Pacific Property Group",
    trustscore_display_0_6: 4,
    review_count: 31,
  },
  {
    id: "e5f6a7b8-c9d0-8e9f-2a3b-4c5d6e7f8a9b",
    display_name: "Downtown Loft 101",
    address_line1: "88 King Street West",
    city: "Toronto",
    province: "ON",
    management_company: null,
    trustscore_display_0_6: 3,
    review_count: 5,
  },
  {
    id: "f6a7b8c9-d0e1-9f0a-3b4c-5d6e7f8a9b0c",
    display_name: "Garden View Apartments",
    address_line1: "100 Garden Lane",
    city: "Montreal",
    province: "QC",
    management_company: "Gestion Immobilière QC",
    trustscore_display_0_6: 5,
    review_count: 18,
  },
  {
    id: "a7b8c9d0-e1f2-0a1b-4c5d-6e7f8a9b0c1d",
    display_name: "Harbourfront Suites",
    address_line1: "300 Queens Quay West",
    city: "Toronto",
    province: "ON",
    management_company: "Skyline Properties",
    trustscore_display_0_6: 5,
    review_count: 42,
  },
  {
    id: "b8c9d0e1-f2a3-1b2c-5d6e-7f8a9b0c1d2e",
    display_name: "Oak Park Residences",
    address_line1: "55 Oak Boulevard",
    city: "Calgary",
    province: "AB",
    management_company: "Prairie Management",
    trustscore_display_0_6: 4,
    review_count: 9,
  },
  {
    id: "c9d0e1f2-a3b4-2c3d-6e7f-8a9b0c1d2e3f",
    display_name: "Lakeside Manor",
    address_line1: "700 Lakeshore Drive",
    city: "Vancouver",
    province: "BC",
    management_company: "Pacific Property Group",
    trustscore_display_0_6: 6,
    review_count: 15,
  },
  {
    id: "d0e1f2a3-b4c5-3d4e-7f8a-9b0c1d2e3f4a",
    display_name: "The Annex House",
    address_line1: "200 Bloor Street West",
    city: "Toronto",
    province: "ON",
    management_company: "Urban Rentals Inc",
    trustscore_display_0_6: 3,
    review_count: 7,
  },
];

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function matchesQuery(item: PropertyListItem, q: string): boolean {
  if (!q.trim()) return true;
  const lower = q.toLowerCase().trim();
  const fields = [
    item.display_name,
    item.address_line1,
    item.city,
    item.province,
    item.management_company ?? "",
  ];
  return fields.some((f) => f.toLowerCase().includes(lower));
}

/**
 * Search properties by query. Mock: in-memory filter + simulated latency.
 * Simulates error when query contains "error" (case-insensitive).
 */
export async function searchProperties(query: string): Promise<PropertySearchResponse> {
  const latency = 400 + Math.random() * 400;
  await delay(latency);

  if (query.toLowerCase().includes("error")) {
    return Promise.reject(new Error("Simulated search error. Use Retry to try again."));
  }

  const filtered =
    query.trim() === ""
      ? MOCK_PROPERTIES
      : MOCK_PROPERTIES.filter((item) => matchesQuery(item, query));

  return {
    items: filtered,
    total: filtered.length,
    query,
  };
}
