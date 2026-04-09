import { NextResponse, type NextRequest } from "next/server";
import { getLandlordFromRequest } from "@/lib/portal-auth";
import type { PortfolioPropertyItem, PortfolioOverviewResponse } from "@/lib/types";

type PortfolioRow = {
  property_id: string;
  properties: {
    id: string;
    display_name: string;
    address_line1: string;
    city: string;
    province: string;
    property_aggregates: Array<{
      review_count: number;
      display_trustscore_0_5: number;
      avg_trustscore: number | null;
    }> | null;
  } | null;
};

export async function GET(req: NextRequest) {
  const portal = await getLandlordFromRequest(req);
  if (!portal) {
    return NextResponse.json(
      { message: "Forbidden. Landlord or admin access required." },
      { status: 403 },
    );
  }

  const { data, error } = await portal.supabase
    .from("portfolio_properties")
    .select(
      `property_id,
       properties (
         id, display_name, address_line1, city, province,
         property_aggregates (review_count, display_trustscore_0_5, avg_trustscore)
       )`,
    )
    .eq("user_id", portal.user.id);

  if (error) {
    return NextResponse.json(
      { message: "Failed to load portfolio" },
      { status: 500 },
    );
  }

  const rows = (data ?? []) as unknown as PortfolioRow[];

  const properties: PortfolioPropertyItem[] = rows
    .filter((r) => r.properties !== null)
    .map((row) => {
      const p = row.properties!;
      const agg = p.property_aggregates?.[0] ?? null;
      return {
        id: p.id,
        display_name: p.display_name,
        address_line1: p.address_line1,
        city: p.city,
        province: p.province,
        trustscore_display_0_5: (agg?.display_trustscore_0_5 ?? 0) as PortfolioPropertyItem["trustscore_display_0_5"],
        review_count: agg?.review_count ?? 0,
        vacancy_status: "unknown" as const,
        trend: "stable" as const,
      };
    });

  const response: PortfolioOverviewResponse = {
    properties,
    total: properties.length,
  };

  return NextResponse.json(response);
}
