/**
 * Property detail data access. Mock implementation for Slice 02.
 * Slice 06 will replace with Supabase; PropertyDetailPublic shape stays unchanged.
 */

import type { PropertyDetailPublic } from "./types";

/** Zero-review property ID for manual testing (not in list). */
export const ZERO_REVIEWS_PROPERTY_ID = "00000000-0000-0000-0000-000000000001";

const MOCK_DETAILS: Record<string, PropertyDetailPublic> = {
  "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d": {
    property: {
      id: "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
      display_name: "123 Maple Ave, Unit 4B",
      address_line1: "123 Maple Avenue",
      address_line2: "Unit 4B",
      city: "Toronto",
      province: "ON",
      postal_code: "M4V 2B5",
      management_company: "Skyline Properties",
    },
    aggregates: {
      review_count: 12,
      display_trustscore_0_5: 5,
      display_management_responsiveness_0_5: 5,
      display_maintenance_timeliness_0_5: 5,
      display_listing_accuracy_0_5: 5,
      display_fee_transparency_0_5: 4,
      display_lease_clarity_0_5: 5,
      last_updated: "2025-03-01T12:00:00.000Z",
    },
    insights: {
      insights_text:
        "Tenants report responsive management and timely maintenance. Listing descriptions match the unit well. Fees are clearly communicated; lease terms are easy to understand.",
      last_generated_at: "2025-02-28T10:00:00.000Z",
    },
    photos: [],
  },
  "b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d6e": {
    property: {
      id: "b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d6e",
      display_name: "123 Maple Ave, Unit 12C",
      address_line1: "123 Maple Avenue",
      address_line2: "Unit 12C",
      city: "Toronto",
      province: "ON",
      postal_code: "M4V 2B5",
      management_company: "Skyline Properties",
    },
    aggregates: {
      review_count: 8,
      display_trustscore_0_5: 4,
      display_management_responsiveness_0_5: 4,
      display_maintenance_timeliness_0_5: 4,
      display_listing_accuracy_0_5: 5,
      display_fee_transparency_0_5: 4,
      display_lease_clarity_0_5: 4,
      last_updated: "2025-02-28T14:00:00.000Z",
    },
    insights: null,
    photos: [],
  },
  "c3d4e5f6-a7b8-6c7d-0e1f-2a3b4c5d6e7f": {
    property: {
      id: "c3d4e5f6-a7b8-6c7d-0e1f-2a3b4c5d6e7f",
      display_name: "Maple Court",
      address_line1: "200 Maple Street",
      city: "Toronto",
      province: "ON",
      postal_code: "M5H 2N2",
      management_company: "Urban Rentals Inc",
    },
    aggregates: {
      review_count: 24,
      display_trustscore_0_5: 5,
      display_management_responsiveness_0_5: 5,
      display_maintenance_timeliness_0_5: 5,
      display_listing_accuracy_0_5: 5,
      display_fee_transparency_0_5: 5,
      display_lease_clarity_0_5: 5,
      last_updated: "2025-03-02T09:00:00.000Z",
    },
    insights: {
      insights_text:
        "Strong scores across the board. Management is highly responsive; maintenance requests are handled quickly. Listings are accurate and fees are transparent.",
      last_generated_at: "2025-03-01T08:00:00.000Z",
    },
    photos: [],
  },
  "d4e5f6a7-b8c9-7d8e-1f2a-3b4c5d6e7f8a": {
    property: {
      id: "d4e5f6a7-b8c9-7d8e-1f2a-3b4c5d6e7f8a",
      display_name: "Riverside Towers",
      address_line1: "450 River Road",
      city: "Vancouver",
      province: "BC",
      postal_code: "V6B 1A1",
      management_company: "Pacific Property Group",
    },
    aggregates: {
      review_count: 31,
      display_trustscore_0_5: 4,
      display_management_responsiveness_0_5: 4,
      display_maintenance_timeliness_0_5: 4,
      display_listing_accuracy_0_5: 5,
      display_fee_transparency_0_5: 4,
      display_lease_clarity_0_5: 4,
      last_updated: "2025-03-01T11:00:00.000Z",
    },
    insights: null,
    photos: [],
  },
  "e5f6a7b8-c9d0-8e9f-2a3b-4c5d6e7f8a9b": {
    property: {
      id: "e5f6a7b8-c9d0-8e9f-2a3b-4c5d6e7f8a9b",
      display_name: "Downtown Loft 101",
      address_line1: "88 King Street West",
      city: "Toronto",
      province: "ON",
      postal_code: "M5V 1J5",
      management_company: null,
    },
    aggregates: {
      review_count: 5,
      display_trustscore_0_5: 3,
      display_management_responsiveness_0_5: 3,
      display_maintenance_timeliness_0_5: 3,
      display_listing_accuracy_0_5: 4,
      display_fee_transparency_0_5: 3,
      display_lease_clarity_0_5: 3,
      last_updated: "2025-02-25T16:00:00.000Z",
    },
    insights: null,
    photos: [],
  },
  "f6a7b8c9-d0e1-9f0a-3b4c-5d6e7f8a9b0c": {
    property: {
      id: "f6a7b8c9-d0e1-9f0a-3b4c-5d6e7f8a9b0c",
      display_name: "Garden View Apartments",
      address_line1: "100 Garden Lane",
      city: "Montreal",
      province: "QC",
      postal_code: "H2X 1Y4",
      management_company: "Gestion Immobilière QC",
    },
    aggregates: {
      review_count: 18,
      display_trustscore_0_5: 5,
      display_management_responsiveness_0_5: 5,
      display_maintenance_timeliness_0_5: 5,
      display_listing_accuracy_0_5: 5,
      display_fee_transparency_0_5: 5,
      display_lease_clarity_0_5: 5,
      last_updated: "2025-02-27T12:00:00.000Z",
    },
    insights: null,
    photos: [],
  },
  "a7b8c9d0-e1f2-0a1b-4c5d-6e7f8a9b0c1d": {
    property: {
      id: "a7b8c9d0-e1f2-0a1b-4c5d-6e7f8a9b0c1d",
      display_name: "Harbourfront Suites",
      address_line1: "300 Queens Quay West",
      city: "Toronto",
      province: "ON",
      postal_code: "M5V 3K3",
      management_company: "Skyline Properties",
    },
    aggregates: {
      review_count: 42,
      display_trustscore_0_5: 5,
      display_management_responsiveness_0_5: 5,
      display_maintenance_timeliness_0_5: 5,
      display_listing_accuracy_0_5: 5,
      display_fee_transparency_0_5: 5,
      display_lease_clarity_0_5: 5,
      last_updated: "2025-03-02T08:00:00.000Z",
    },
    insights: null,
    photos: [],
  },
  "b8c9d0e1-f2a3-1b2c-5d6e-7f8a9b0c1d2e": {
    property: {
      id: "b8c9d0e1-f2a3-1b2c-5d6e-7f8a9b0c1d2e",
      display_name: "Oak Park Residences",
      address_line1: "55 Oak Boulevard",
      city: "Calgary",
      province: "AB",
      postal_code: "T2P 1L9",
      management_company: "Prairie Management",
    },
    aggregates: {
      review_count: 9,
      display_trustscore_0_5: 4,
      display_management_responsiveness_0_5: 4,
      display_maintenance_timeliness_0_5: 4,
      display_listing_accuracy_0_5: 4,
      display_fee_transparency_0_5: 4,
      display_lease_clarity_0_5: 4,
      last_updated: "2025-02-26T10:00:00.000Z",
    },
    insights: null,
    photos: [],
  },
  "c9d0e1f2-a3b4-2c3d-6e7f-8a9b0c1d2e3f": {
    property: {
      id: "c9d0e1f2-a3b4-2c3d-6e7f-8a9b0c1d2e3f",
      display_name: "Lakeside Manor",
      address_line1: "700 Lakeshore Drive",
      city: "Vancouver",
      province: "BC",
      postal_code: "V6G 1A2",
      management_company: "Pacific Property Group",
    },
    aggregates: {
      review_count: 15,
      display_trustscore_0_5: 5,
      display_management_responsiveness_0_5: 5,
      display_maintenance_timeliness_0_5: 5,
      display_listing_accuracy_0_5: 5,
      display_fee_transparency_0_5: 5,
      display_lease_clarity_0_5: 5,
      last_updated: "2025-03-01T14:00:00.000Z",
    },
    insights: null,
    photos: [],
  },
  "d0e1f2a3-b4c5-3d4e-7f8a-9b0c1d2e3f4a": {
    property: {
      id: "d0e1f2a3-b4c5-3d4e-7f8a-9b0c1d2e3f4a",
      display_name: "The Annex House",
      address_line1: "200 Bloor Street West",
      city: "Toronto",
      province: "ON",
      postal_code: "M5S 1T8",
      management_company: "Urban Rentals Inc",
    },
    aggregates: {
      review_count: 7,
      display_trustscore_0_5: 3,
      display_management_responsiveness_0_5: 3,
      display_maintenance_timeliness_0_5: 3,
      display_listing_accuracy_0_5: 4,
      display_fee_transparency_0_5: 3,
      display_lease_clarity_0_5: 3,
      last_updated: "2025-02-24T09:00:00.000Z",
    },
    insights: null,
    photos: [],
  },
  [ZERO_REVIEWS_PROPERTY_ID]: {
    property: {
      id: ZERO_REVIEWS_PROPERTY_ID,
      display_name: "No Reviews Test Property",
      address_line1: "1 Test Street",
      city: "Toronto",
      province: "ON",
      postal_code: "M1A 1A1",
      management_company: null,
    },
    aggregates: {
      review_count: 0,
      display_trustscore_0_5: 0,
      display_management_responsiveness_0_5: 0,
      display_maintenance_timeliness_0_5: 0,
      display_listing_accuracy_0_5: 0,
      display_fee_transparency_0_5: 0,
      display_lease_clarity_0_5: 0,
      last_updated: "2025-01-01T00:00:00.000Z",
    },
    insights: null,
    photos: [],
  },
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetch property detail by id. Mock: in-memory lookup.
 * Returns null for unknown id (page should call notFound()).
 */
export async function getPropertyDetail(id: string): Promise<PropertyDetailPublic | null> {
  await delay(200 + Math.random() * 200);
  return MOCK_DETAILS[id] ?? null;
}
