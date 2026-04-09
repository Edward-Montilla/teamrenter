import { NextResponse, type NextRequest } from "next/server";
import { getLandlordFromRequest } from "@/lib/portal-auth";
import type { PortalModerationItem, PortalModerationResponse } from "@/lib/types";

type DraftRow = {
  id: string;
  review_id: string;
  body: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  reviewed_at: string | null;
  reviews:
    | {
        property_id: string;
        properties: { display_name: string } | null;
      }[]
    | null;
};

export async function GET(req: NextRequest) {
  const portal = await getLandlordFromRequest(req);
  if (!portal) {
    return NextResponse.json(
      { message: "Forbidden. Landlord or admin access required." },
      { status: 403 },
    );
  }

  let query = portal.supabase
    .from("review_response_drafts")
    .select(
      "id, review_id, body, status, created_at, reviewed_at, reviews(property_id, properties(display_name))",
    )
    .order("created_at", { ascending: false });

  if (portal.user.role !== "admin") {
    query = query.eq("author_user_id", portal.user.id);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json(
      { message: "Failed to load moderation queue." },
      { status: 500 },
    );
  }

  const items: PortalModerationItem[] = ((data ?? []) as unknown as DraftRow[])
    .map((row) => {
      const review = row.reviews?.[0];
      if (!review) return null;
      return {
        draft_id: row.id,
        review_id: row.review_id,
        property_id: review.property_id,
        property_display_name: review.properties?.display_name ?? "Property",
        draft_body: row.body,
        draft_status: row.status,
        drafted_at: row.created_at,
        reviewed_at: row.reviewed_at,
      } satisfies PortalModerationItem;
    })
    .filter((item): item is PortalModerationItem => item !== null);

  const response: PortalModerationResponse = { items };
  return NextResponse.json(response);
}
