import { NextResponse, type NextRequest } from "next/server";
import { getAdminFromRequest } from "@/lib/admin-auth";
import type {
  AdminInsightModerationItem,
  DistilledInsightStatus,
} from "@/lib/types";

type InsightRow = {
  property_id: string;
  insights_text: string;
  status: DistilledInsightStatus;
  screened: boolean;
  screening_flags: Record<string, unknown> | null;
  last_generated_at: string;
  screened_at: string | null;
  updated_at: string;
};

type PropertyRow = {
  id: string;
  display_name: string;
};

const INSIGHT_STATUSES: DistilledInsightStatus[] = [
  "pending",
  "approved",
  "rejected",
  "hidden",
];

export async function GET(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin) {
    return NextResponse.json(
      { message: "Forbidden. Admin access required." },
      { status: 403 },
    );
  }

  const statusParam = req.nextUrl.searchParams.get("status");
  const status =
    statusParam && INSIGHT_STATUSES.includes(statusParam as DistilledInsightStatus)
      ? (statusParam as DistilledInsightStatus)
      : null;

  let query = admin.supabase
    .from("distilled_insights")
    .select(
      "property_id, insights_text, status, screened, screening_flags, last_generated_at, screened_at, updated_at",
    )
    .order("updated_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json(
      { message: "Failed to load insights." },
      { status: 500 },
    );
  }

  const rows = (data ?? []) as InsightRow[];
  const propertyIds = [...new Set(rows.map((row) => row.property_id))];

  const { data: propertyRows, error: propertyError } = propertyIds.length
    ? await admin.supabase
        .from("properties")
        .select("id, display_name")
        .in("id", propertyIds)
    : { data: [], error: null };

  if (propertyError) {
    return NextResponse.json(
      { message: "Failed to load related properties." },
      { status: 500 },
    );
  }

  const propertyNameById = new Map(
    ((propertyRows ?? []) as PropertyRow[]).map((row) => [row.id, row.display_name]),
  );

  const items: AdminInsightModerationItem[] = rows.map((row) => ({
    property_id: row.property_id,
    property_display_name:
      propertyNameById.get(row.property_id) ?? "Unknown property",
    insights_text: row.insights_text,
    status: row.status,
    screened: row.screened,
    screening_flags: row.screening_flags,
    last_generated_at: row.last_generated_at,
    screened_at: row.screened_at,
    updated_at: row.updated_at,
  }));

  return NextResponse.json({ items });
}
