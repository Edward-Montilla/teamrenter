import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import type { PropertyDetailPublic, PropertyAggregatePublic, DistilledInsightPublic } from "@/lib/types";

type PropertyRow = {
  id: string;
  display_name: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  province: string;
  postal_code: string;
  management_company: string | null;
  status: string;
};

type AggregateRow = {
  review_count: number;
  display_trustscore_0_6: PropertyAggregatePublic["display_trustscore_0_6"];
  display_management_responsiveness_0_6: PropertyAggregatePublic["display_management_responsiveness_0_6"];
  display_maintenance_timeliness_0_6: PropertyAggregatePublic["display_maintenance_timeliness_0_6"];
  display_listing_accuracy_0_6: PropertyAggregatePublic["display_listing_accuracy_0_6"];
  display_fee_transparency_0_6: PropertyAggregatePublic["display_fee_transparency_0_6"];
  display_lease_clarity_0_6: PropertyAggregatePublic["display_lease_clarity_0_6"];
  last_updated: string;
};

type InsightRow = {
  insights_text: string;
  last_generated_at: string;
};

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const supabase = getSupabaseServerClient();

  const { data: property, error: propertyError } = await supabase
    .from("properties")
    .select(
      `
      id,
      display_name,
      address_line1,
      address_line2,
      city,
      province,
      postal_code,
      management_company,
      status
    `,
    )
    .eq("id", id)
    .maybeSingle<PropertyRow>();

  if (propertyError) {
    return NextResponse.json({ message: "Failed to load property" }, { status: 500 });
  }

  if (!property || property.status !== "active") {
    return NextResponse.json({ message: "Property not found" }, { status: 404 });
  }

  const { data: aggregates, error: aggregatesError } = await supabase
    .from("property_aggregates")
    .select(
      `
      review_count,
      display_trustscore_0_6,
      display_management_responsiveness_0_6,
      display_maintenance_timeliness_0_6,
      display_listing_accuracy_0_6,
      display_fee_transparency_0_6,
      display_lease_clarity_0_6,
      last_updated
    `,
    )
    .eq("property_id", id)
    .maybeSingle<AggregateRow>();

  if (aggregatesError) {
    return NextResponse.json({ message: "Failed to load property aggregates" }, { status: 500 });
  }

  const zeroAggregates: PropertyAggregatePublic = {
    review_count: 0,
    display_trustscore_0_6: 0,
    display_management_responsiveness_0_6: 0,
    display_maintenance_timeliness_0_6: 0,
    display_listing_accuracy_0_6: 0,
    display_fee_transparency_0_6: 0,
    display_lease_clarity_0_6: 0,
    last_updated: new Date().toISOString(),
  };

  const aggregatesPublic: PropertyAggregatePublic = aggregates
    ? {
        review_count: aggregates.review_count,
        display_trustscore_0_6: aggregates.display_trustscore_0_6,
        display_management_responsiveness_0_6:
          aggregates.display_management_responsiveness_0_6,
        display_maintenance_timeliness_0_6:
          aggregates.display_maintenance_timeliness_0_6,
        display_listing_accuracy_0_6: aggregates.display_listing_accuracy_0_6,
        display_fee_transparency_0_6: aggregates.display_fee_transparency_0_6,
        display_lease_clarity_0_6: aggregates.display_lease_clarity_0_6,
        last_updated: aggregates.last_updated,
      }
    : zeroAggregates;

  const { data: insight, error: insightError } = await supabase
    .from("distilled_insights")
    .select(
      `
      insights_text,
      last_generated_at
    `,
    )
    .eq("property_id", id)
    .eq("status", "approved")
    .maybeSingle<InsightRow>();

  if (insightError) {
    return NextResponse.json({ message: "Failed to load insights" }, { status: 500 });
  }

  const insightPublic: DistilledInsightPublic | null = insight
    ? {
        insights_text: insight.insights_text,
        last_generated_at: insight.last_generated_at,
      }
    : null;

  const payload: PropertyDetailPublic = {
    property: {
      id: property.id,
      display_name: property.display_name,
      address_line1: property.address_line1,
      address_line2: property.address_line2 ?? undefined,
      city: property.city,
      province: property.province,
      postal_code: property.postal_code,
      management_company: property.management_company,
    },
    aggregates: aggregatesPublic,
    insights: insightPublic,
  };

  return NextResponse.json(payload);
}

