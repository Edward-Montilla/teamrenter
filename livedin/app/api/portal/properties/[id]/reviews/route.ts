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

  let reviewQuery = portal.supabase
    .from("reviews")
    .select("id, property_id, user_id, status, management_responsiveness, maintenance_timeliness, listing_accuracy, fee_transparency, lease_clarity, created_at, updated_at")
    .eq("property_id", propertyId)
    .order("created_at", { ascending: false });

  if (portal.user.role !== "admin") {
    reviewQuery = reviewQuery.eq("status", "approved");
  }

  const { data, error } = await reviewQuery;

  if (error) {
    return NextResponse.json(
      { message: "Failed to load reviews" },
      { status: 500 },
    );
  }

  return NextResponse.json({ items: data ?? [] });
}
