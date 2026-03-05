/**
 * Mock property list for review submission flow (Slice 03).
 * Reuses same IDs as property-search / property-detail-mock for consistency.
 */

export type MockPropertyForReview = {
  id: string;
  display_name: string;
  address_line1: string;
  city: string;
  province: string;
  postal_code?: string;
  management_company?: string | null;
};

const MOCK_PROPERTIES_FOR_REVIEW: MockPropertyForReview[] = [
  {
    id: "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
    display_name: "123 Maple Ave, Unit 4B",
    address_line1: "123 Maple Avenue",
    city: "Toronto",
    province: "ON",
    postal_code: "M4V 2B5",
    management_company: "Skyline Properties",
  },
  {
    id: "b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d6e",
    display_name: "123 Maple Ave, Unit 12C",
    address_line1: "123 Maple Avenue",
    city: "Toronto",
    province: "ON",
    postal_code: "M4V 2B5",
    management_company: "Skyline Properties",
  },
  {
    id: "c3d4e5f6-a7b8-6c7d-0e1f-2a3b4c5d6e7f",
    display_name: "Maple Court",
    address_line1: "200 Maple Street",
    city: "Toronto",
    province: "ON",
    postal_code: "M5H 2N2",
    management_company: "Urban Rentals Inc",
  },
  {
    id: "d4e5f6a7-b8c9-7d8e-1f2a-3b4c5d6e7f8a",
    display_name: "Riverside Towers",
    address_line1: "450 River Road",
    city: "Vancouver",
    province: "BC",
    postal_code: "V6B 1A1",
    management_company: "Pacific Property Group",
  },
  {
    id: "e5f6a7b8-c9d0-8e9f-2a3b-4c5d6e7f8a9b",
    display_name: "Downtown Loft 101",
    address_line1: "88 King Street West",
    city: "Toronto",
    province: "ON",
    postal_code: "M5V 1J5",
    management_company: null,
  },
  {
    id: "f6a7b8c9-d0e1-9f0a-3b4c-5d6e7f8a9b0c",
    display_name: "Garden View Apartments",
    address_line1: "100 Garden Lane",
    city: "Montreal",
    province: "QC",
    postal_code: "H2X 1Y4",
    management_company: "Gestion Immobilière QC",
  },
  {
    id: "a7b8c9d0-e1f2-0a1b-4c5d-6e7f8a9b0c1d",
    display_name: "Harbourfront Suites",
    address_line1: "300 Queens Quay West",
    city: "Toronto",
    province: "ON",
    postal_code: "M5V 3K3",
    management_company: "Skyline Properties",
  },
  {
    id: "b8c9d0e1-f2a3-1b2c-5d6e-7f8a9b0c1d2e",
    display_name: "Oak Park Residences",
    address_line1: "55 Oak Boulevard",
    city: "Calgary",
    province: "AB",
    postal_code: "T2P 1L9",
    management_company: "Prairie Management",
  },
  {
    id: "c9d0e1f2-a3b4-2c3d-6e7f-8a9b0c1d2e3f",
    display_name: "Lakeside Manor",
    address_line1: "700 Lakeshore Drive",
    city: "Vancouver",
    province: "BC",
    postal_code: "V6G 1A2",
    management_company: "Pacific Property Group",
  },
  {
    id: "d0e1f2a3-b4c5-3d4e-7f8a-9b0c1d2e3f4a",
    display_name: "The Annex House",
    address_line1: "200 Bloor Street West",
    city: "Toronto",
    province: "ON",
    postal_code: "M5S 1T8",
    management_company: "Urban Rentals Inc",
  },
];

/**
 * Returns the mock property list for the review flow (search/select step).
 */
export function getMockPropertiesForReview(): MockPropertyForReview[] {
  return [...MOCK_PROPERTIES_FOR_REVIEW];
}

/**
 * Returns a single property by id, or null if not found.
 */
export function getMockPropertyById(id: string): MockPropertyForReview | null {
  return MOCK_PROPERTIES_FOR_REVIEW.find((p) => p.id === id) ?? null;
}
