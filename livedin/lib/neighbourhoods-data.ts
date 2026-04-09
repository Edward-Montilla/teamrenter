import { getPropertyPhotoDisplayUrl } from "@/lib/property-photos";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import type {
  NeighbourhoodDetail,
  NeighbourhoodListItem,
  NeighbourhoodSearchResponse,
  PropertyListItem,
} from "@/lib/types";

type DbNeighbourhoodRow = {
  id: string;
  name: string;
  city: string;
  province: string;
  description: string | null;
  property_count: number;
  avg_trust_score: number | null;
};

type PropertyRow = {
  id: string;
  display_name: string;
  address_line1: string;
  city: string;
  province: string;
  management_company: string | null;
  property_aggregates: Array<{
    review_count: number;
    display_trustscore_0_5: number;
  }> | null;
  property_photos: Array<{
    r2_bucket: string;
    r2_key: string;
    created_at: string;
  }> | null;
};

export async function loadNeighbourhoods(
  cityFilter: string | null,
): Promise<NeighbourhoodSearchResponse> {
  const supabase = getSupabaseServerClient();

  let dbQuery = supabase
    .from("neighbourhoods")
    .select("id, name, city, province, description, property_count, avg_trust_score")
    .order("name", { ascending: true });

  if (cityFilter) {
    dbQuery = dbQuery.ilike("city", cityFilter);
  }

  const { data, error } = await dbQuery;

  if (error) {
    throw new Error("Failed to load neighbourhoods");
  }

  const rows = (data ?? []) as DbNeighbourhoodRow[];

  const items: NeighbourhoodListItem[] = rows.map((row) => ({
    id: row.id,
    name: row.name,
    city: row.city,
    province: row.province,
    description: row.description,
    property_count: row.property_count,
    avg_trust_score: Math.round(row.avg_trust_score ?? 0) as NeighbourhoodListItem["avg_trust_score"],
  }));

  return { items, total: items.length };
}

export async function loadNeighbourhoodDetail(
  id: string,
): Promise<NeighbourhoodDetail | null> {
  const supabase = getSupabaseServerClient();

  const { data: neighbourhood, error: nError } = await supabase
    .from("neighbourhoods")
    .select("id, name, city, province, description, property_count, avg_trust_score")
    .eq("id", id)
    .maybeSingle();

  if (nError) {
    throw new Error("Failed to load neighbourhood");
  }

  if (!neighbourhood) {
    return null;
  }

  const n = neighbourhood as DbNeighbourhoodRow;

  const { data: propData, error: pError } = await supabase
    .from("properties")
    .select(
      `id, display_name, address_line1, city, province, management_company,
       property_aggregates (review_count, display_trustscore_0_5),
       property_photos (r2_bucket, r2_key, created_at)`,
    )
    .eq("neighbourhood_id", id)
    .eq("status", "active")
    .order("display_name", { ascending: true });

  if (pError) {
    throw new Error("Failed to load neighbourhood properties");
  }

  const properties: PropertyListItem[] = ((propData ?? []) as unknown as PropertyRow[]).map(
    (row) => {
      const agg = row.property_aggregates?.[0] ?? null;
      const photos = row.property_photos ?? [];
      const sortedPhotos = [...photos].sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      );
      const firstPhoto = sortedPhotos[0];
      const primary_image_url = firstPhoto
        ? getPropertyPhotoDisplayUrl({
            r2_bucket: firstPhoto.r2_bucket,
            r2_key: firstPhoto.r2_key,
          })
        : null;
      return {
        id: row.id,
        display_name: row.display_name,
        address_line1: row.address_line1,
        city: row.city,
        province: row.province,
        management_company: row.management_company,
        trustscore_display_0_5: (agg?.display_trustscore_0_5 ?? 0) as PropertyListItem["trustscore_display_0_5"],
        review_count: agg?.review_count ?? 0,
        primary_image_url,
      };
    },
  );

  return {
    id: n.id,
    name: n.name,
    city: n.city,
    province: n.province,
    description: n.description,
    property_count: n.property_count,
    avg_trust_score: Math.round(n.avg_trust_score ?? 0) as NeighbourhoodListItem["avg_trust_score"],
    properties,
  };
}
