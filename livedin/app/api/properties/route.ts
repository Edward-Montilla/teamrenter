import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import type { PropertyListItem, PropertySearchResponse } from "@/lib/types";

type ListRow = {
  id: string;
  display_name: string;
  address_line1: string;
  city: string;
  province: string;
  management_company: string | null;
  created_at: string;
  neighbourhood_id: string | null;
  property_aggregates: Array<{
    review_count: number;
    display_trustscore_0_5: 0 | 1 | 2 | 3 | 4 | 5;
  }> | null;
};

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q") ?? "";
  const query = q.trim();
  const neighbourhoodId = url.searchParams.get("neighbourhood")?.trim() || null;
  const minScoreRaw = url.searchParams.get("minScore");
  const minScore =
    minScoreRaw !== null && minScoreRaw !== ""
      ? Math.min(5, Math.max(0, Number.parseInt(minScoreRaw, 10)))
      : null;
  const sort = url.searchParams.get("sort")?.trim() || "reviews";

  const supabase = getSupabaseServerClient();

  const pattern = query ? `%${query}%` : null;

  let dbQuery = supabase
    .from("properties")
    .select(
      `
      id,
      display_name,
      address_line1,
      city,
      province,
      management_company,
      created_at,
      neighbourhood_id,
      property_aggregates (
        review_count,
        display_trustscore_0_5
      )
    `,
    )
    .eq("status", "active");

  if (neighbourhoodId) {
    dbQuery = dbQuery.eq("neighbourhood_id", neighbourhoodId);
  }

  if (pattern) {
    dbQuery = dbQuery.or(
      [
        `display_name.ilike.${pattern}`,
        `address_line1.ilike.${pattern}`,
        `city.ilike.${pattern}`,
        `province.ilike.${pattern}`,
        `management_company.ilike.${pattern}`,
      ].join(","),
    );
  }

  if (sort === "trust") {
    dbQuery = dbQuery
      .order("display_trustscore_0_5", {
        foreignTable: "property_aggregates",
        ascending: false,
      })
      .order("display_name", { ascending: true });
  } else if (sort === "recent") {
    dbQuery = dbQuery.order("created_at", { ascending: false });
  } else {
    dbQuery = dbQuery
      .order("review_count", { foreignTable: "property_aggregates", ascending: false })
      .order("display_name", { ascending: true });
  }

  const { data, error } = await dbQuery;

  if (error) {
    return NextResponse.json(
      { message: "Failed to load properties" },
      { status: 500 },
    );
  }

  let rows = (data ?? []) as unknown as ListRow[];

  if (minScore !== null && !Number.isNaN(minScore)) {
    rows = rows.filter((row) => {
      const trust = row.property_aggregates?.[0]?.display_trustscore_0_5 ?? 0;
      return trust >= minScore;
    });
  }

  const items: PropertyListItem[] = rows.map((row) => {
    const aggregates = row.property_aggregates?.[0] ?? null;
    const reviewCount = aggregates?.review_count ?? 0;
    const trustScore = aggregates?.display_trustscore_0_5 ?? 0;

    return {
      id: row.id,
      display_name: row.display_name,
      address_line1: row.address_line1,
      city: row.city,
      province: row.province,
      management_company: row.management_company,
      trustscore_display_0_5: trustScore,
      review_count: reviewCount,
    };
  });

  const response: PropertySearchResponse = {
    items,
    total: items.length,
    query,
  };

  return NextResponse.json(response);
}

