import { NextResponse, type NextRequest } from "next/server";
import { getLandlordFromRequest } from "@/lib/portal-auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const portal = await getLandlordFromRequest(req);
  if (!portal) {
    return NextResponse.json(
      { message: "Forbidden. Landlord or admin access required." },
      { status: 403 },
    );
  }

  const { id: propertyId } = await params;

  if (portal.user.role !== "admin") {
    const { data: owned } = await portal.supabase
      .from("portfolio_properties")
      .select("id")
      .eq("user_id", portal.user.id)
      .eq("property_id", propertyId)
      .maybeSingle();

    if (!owned) {
      return NextResponse.json(
        { message: "Property not in your portfolio." },
        { status: 403 },
      );
    }
  }

  const { data: aggregates, error } = await portal.supabase
    .from("property_aggregates")
    .select(
      "review_count, avg_management_responsiveness, avg_maintenance_timeliness, avg_listing_accuracy, avg_fee_transparency, avg_lease_clarity, avg_trustscore, display_trustscore_0_5, display_management_responsiveness_0_5, display_maintenance_timeliness_0_5, display_listing_accuracy_0_5, display_fee_transparency_0_5, display_lease_clarity_0_5, last_updated",
    )
    .eq("property_id", propertyId)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { message: "Failed to load analytics" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    property_id: propertyId,
    aggregates: aggregates ?? null,
  });
}
