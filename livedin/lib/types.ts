/**
 * Data contracts for public property list (Slice 01).
 * Used by UI components and data access layer; Slice 06 will keep these shapes when wiring Supabase.
 */

export type PropertyListItem = {
  id: string;
  display_name: string;
  address_line1: string;
  city: string;
  province: string;
  management_company: string | null;
  trustscore_display_0_6: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  review_count: number;
};

export type PropertySearchResponse = {
  items: PropertyListItem[];
  total: number;
  query: string;
};

export type UiListState = "loading" | "ready" | "empty" | "error";
