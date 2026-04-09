import { NextResponse, type NextRequest } from "next/server";
import { getLandlordFromRequest } from "@/lib/portal-auth";
import type { RenterSignal, RenterSignalsResponse } from "@/lib/types";

type AggRow = {
  property_id: string;
  display_name: string;
  avg_management_responsiveness: number | null;
  avg_maintenance_timeliness: number | null;
  avg_listing_accuracy: number | null;
  avg_fee_transparency: number | null;
  avg_lease_clarity: number | null;
};

const SIGNAL_THRESHOLD = 2.5;

const METRIC_LABELS: Record<string, string> = {
  avg_management_responsiveness: "Low management responsiveness",
  avg_maintenance_timeliness: "Slow maintenance response",
  avg_listing_accuracy: "Inaccurate listing information",
  avg_fee_transparency: "Low fee transparency",
  avg_lease_clarity: "Unclear lease terms",
};

export async function GET(req: NextRequest) {
  const portal = await getLandlordFromRequest(req);
  if (!portal) {
    return NextResponse.json(
      { message: "Forbidden. Landlord or admin access required." },
      { status: 403 },
    );
  }

  const { data: portfolioProps, error: ppError } = await portal.supabase
    .from("portfolio_properties")
    .select("property_id, properties (display_name)")
    .eq("user_id", portal.user.id);

  if (ppError) {
    return NextResponse.json(
      { message: "Failed to load portfolio" },
      { status: 500 },
    );
  }

  const propertyIds = ((portfolioProps ?? []) as unknown as Array<{
    property_id: string;
    properties: { display_name: string } | null;
  }>).map((r) => r.property_id);

  if (propertyIds.length === 0) {
    const response: RenterSignalsResponse = { signals: [] };
    return NextResponse.json(response);
  }

  const nameMap = new Map<string, string>();
  for (const row of (portfolioProps ?? []) as unknown as Array<{
    property_id: string;
    properties: { display_name: string } | null;
  }>) {
    nameMap.set(row.property_id, row.properties?.display_name ?? "");
  }

  const { data: aggData, error: aggError } = await portal.supabase
    .from("property_aggregates")
    .select(
      "property_id, avg_management_responsiveness, avg_maintenance_timeliness, avg_listing_accuracy, avg_fee_transparency, avg_lease_clarity",
    )
    .in("property_id", propertyIds);

  if (aggError) {
    return NextResponse.json(
      { message: "Failed to load signals" },
      { status: 500 },
    );
  }

  const signals: RenterSignal[] = [];
  const now = new Date().toISOString();

  for (const row of (aggData ?? []) as AggRow[]) {
    const metrics = {
      avg_management_responsiveness: row.avg_management_responsiveness,
      avg_maintenance_timeliness: row.avg_maintenance_timeliness,
      avg_listing_accuracy: row.avg_listing_accuracy,
      avg_fee_transparency: row.avg_fee_transparency,
      avg_lease_clarity: row.avg_lease_clarity,
    };

    for (const [key, value] of Object.entries(metrics)) {
      if (value !== null && value < SIGNAL_THRESHOLD) {
        signals.push({
          property_id: row.property_id,
          display_name: nameMap.get(row.property_id) ?? "",
          signal_type: key.replace("avg_", ""),
          signal_label: METRIC_LABELS[key] ?? key,
          confidence: Math.round((1 - value / 5) * 100) / 100,
          detected_at: now,
        });
      }
    }
  }

  const response: RenterSignalsResponse = { signals };
  return NextResponse.json(response);
}
