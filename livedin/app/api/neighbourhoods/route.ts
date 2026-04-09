import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import type { NeighbourhoodListItem, NeighbourhoodSearchResponse } from "@/lib/types";

type DbRow = {
  id: string;
  name: string;
  city: string;
  province: string;
  description: string | null;
  property_count: number;
  avg_trust_score: number | null;
};

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const cityFilter = url.searchParams.get("city")?.trim() || null;

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
    return NextResponse.json(
      { message: "Failed to load neighbourhoods" },
      { status: 500 },
    );
  }

  const rows = (data ?? []) as DbRow[];

  const items: NeighbourhoodListItem[] = rows.map((row) => ({
    id: row.id,
    name: row.name,
    city: row.city,
    province: row.province,
    description: row.description,
    property_count: row.property_count,
    avg_trust_score: Math.round(row.avg_trust_score ?? 0) as NeighbourhoodListItem["avg_trust_score"],
  }));

  const response: NeighbourhoodSearchResponse = {
    items,
    total: items.length,
  };

  return NextResponse.json(response);
}
