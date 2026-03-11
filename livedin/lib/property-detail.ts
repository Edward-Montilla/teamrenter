import { getSupabaseServerClient } from "./supabase-server";
import type {
  DistilledInsightPublic,
  PropertyAggregatePublic,
  PropertyDetailPublic,
} from "./types";

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
  display_trustscore_0_5: PropertyAggregatePublic["display_trustscore_0_5"];
  display_management_responsiveness_0_5: PropertyAggregatePublic["display_management_responsiveness_0_5"];
  display_maintenance_timeliness_0_5: PropertyAggregatePublic["display_maintenance_timeliness_0_5"];
  display_listing_accuracy_0_5: PropertyAggregatePublic["display_listing_accuracy_0_5"];
  display_fee_transparency_0_5: PropertyAggregatePublic["display_fee_transparency_0_5"];
  display_lease_clarity_0_5: PropertyAggregatePublic["display_lease_clarity_0_5"];
  last_updated: string;
};

type InsightRow = {
  insights_text: string;
  last_generated_at: string;
};

export async function getPropertyDetail(id: string): Promise<PropertyDetailPublic | null> {
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
    throw new Error("Failed to load property");
  }

  if (!property || property.status !== "active") {
    return null;
  }

  const { data: aggregates, error: aggregatesError } = await supabase
    .from("property_aggregates")
    .select(
      `
      review_count,
      display_trustscore_0_5,
      display_management_responsiveness_0_5,
      display_maintenance_timeliness_0_5,
      display_listing_accuracy_0_5,
      display_fee_transparency_0_5,
      display_lease_clarity_0_5,
      last_updated
    `,
    )
    .eq("property_id", id)
    .maybeSingle<AggregateRow>();

  if (aggregatesError) {
    throw new Error("Failed to load property aggregates");
  }

  const zeroAggregates: PropertyAggregatePublic = {
    review_count: 0,
    display_trustscore_0_5: 0,
    display_management_responsiveness_0_5: 0,
    display_maintenance_timeliness_0_5: 0,
    display_listing_accuracy_0_5: 0,
    display_fee_transparency_0_5: 0,
    display_lease_clarity_0_5: 0,
    last_updated: new Date().toISOString(),
  };

  const aggregatesPublic: PropertyAggregatePublic = aggregates
    ? {
        review_count: aggregates.review_count,
        display_trustscore_0_5: aggregates.display_trustscore_0_5,
        display_management_responsiveness_0_5:
          aggregates.display_management_responsiveness_0_5,
        display_maintenance_timeliness_0_5:
          aggregates.display_maintenance_timeliness_0_5,
        display_listing_accuracy_0_5: aggregates.display_listing_accuracy_0_5,
        display_fee_transparency_0_5: aggregates.display_fee_transparency_0_5,
        display_lease_clarity_0_5: aggregates.display_lease_clarity_0_5,
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
    throw new Error("Failed to load insights");
  }

  const insightPublic: DistilledInsightPublic | null = insight
    ? {
        insights_text: insight.insights_text,
        last_generated_at: insight.last_generated_at,
      }
    : null;

  return {
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
}
