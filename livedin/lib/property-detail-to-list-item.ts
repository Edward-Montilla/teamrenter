import type { PropertyDetailPublic, PropertyListItem } from "@/lib/types";

/** Shape search cards from public property detail API responses. */
export function propertyDetailToListItem(detail: PropertyDetailPublic): PropertyListItem {
  const primary = detail.photos[0]?.display_url ?? null;
  return {
    id: detail.property.id,
    display_name: detail.property.display_name,
    address_line1: detail.property.address_line1,
    city: detail.property.city,
    province: detail.property.province,
    management_company: detail.property.management_company,
    trustscore_display_0_5: detail.aggregates.display_trustscore_0_5,
    review_count: detail.aggregates.review_count,
    primary_image_url: primary,
  };
}
