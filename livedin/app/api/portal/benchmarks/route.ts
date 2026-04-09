import { NextResponse, type NextRequest } from "next/server";
import { getLandlordFromRequest } from "@/lib/portal-auth";
import type { BenchmarkData, BenchmarkResponse } from "@/lib/types";

type BenchmarkRow = {
  scope_type: string;
  scope_value: string;
  avg_trust_score: number | null;
  avg_management_responsiveness: number | null;
  avg_maintenance_timeliness: number | null;
  avg_listing_accuracy: number | null;
  avg_fee_transparency: number | null;
  avg_lease_clarity: number | null;
  property_count: number;
  review_count: number;
  computed_at: string;
};

export async function GET(req: NextRequest) {
  const portal = await getLandlordFromRequest(req);
  if (!portal) {
    return NextResponse.json(
      { message: "Forbidden. Landlord or admin access required." },
      { status: 403 },
    );
  }

  const { data: portfolioProps } = await portal.supabase
    .from("portfolio_properties")
    .select("properties (city)")
    .eq("user_id", portal.user.id);

  const cities = new Set<string>();
  for (const row of (portfolioProps ?? []) as unknown as Array<{ properties: { city: string } | null }>) {
    if (row.properties?.city) cities.add(row.properties.city);
  }

  if (cities.size === 0) {
    const response: BenchmarkResponse = { items: [] };
    return NextResponse.json(response);
  }

  const { data, error } = await portal.supabase
    .from("benchmark_averages")
    .select("scope_type, scope_value, avg_trust_score, avg_management_responsiveness, avg_maintenance_timeliness, avg_listing_accuracy, avg_fee_transparency, avg_lease_clarity, property_count, review_count, computed_at")
    .in("scope_value", Array.from(cities));

  if (error) {
    return NextResponse.json(
      { message: "Failed to load benchmarks" },
      { status: 500 },
    );
  }

  const items: BenchmarkData[] = ((data ?? []) as BenchmarkRow[]).map((row) => ({
    scope_type: row.scope_type as BenchmarkData["scope_type"],
    scope_value: row.scope_value,
    avg_trust_score: row.avg_trust_score,
    avg_management_responsiveness: row.avg_management_responsiveness,
    avg_maintenance_timeliness: row.avg_maintenance_timeliness,
    avg_listing_accuracy: row.avg_listing_accuracy,
    avg_fee_transparency: row.avg_fee_transparency,
    avg_lease_clarity: row.avg_lease_clarity,
    property_count: row.property_count,
    review_count: row.review_count,
    computed_at: row.computed_at,
  }));

  const response: BenchmarkResponse = { items };
  return NextResponse.json(response);
}
