import { NextResponse, type NextRequest } from "next/server";
import { getLandlordFromRequest } from "@/lib/portal-auth";
import { validateReviewResponse } from "@/lib/validation/portal";
import type { ReviewResponseDraft } from "@/lib/types";

export async function POST(
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

  const { id: reviewId } = await params;

  const { data: review } = await portal.supabase
    .from("reviews")
    .select("id, property_id")
    .eq("id", reviewId)
    .maybeSingle();

  if (!review) {
    return NextResponse.json(
      { message: "Review not found." },
      { status: 404 },
    );
  }

  if (portal.user.role !== "admin") {
    const { data: owned } = await portal.supabase
      .from("portfolio_properties")
      .select("id")
      .eq("user_id", portal.user.id)
      .eq("property_id", review.property_id)
      .maybeSingle();

    if (!owned) {
      return NextResponse.json(
        { message: "Review's property is not in your portfolio." },
        { status: 403 },
      );
    }
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body." }, { status: 400 });
  }

  const validation = validateReviewResponse(body as Record<string, unknown>);
  if (!validation.valid) {
    return NextResponse.json(
      { message: Object.values(validation.errors)[0] },
      { status: 400 },
    );
  }

  const { body: responseBody } = body as { body: string };

  const { data: draft, error } = await portal.supabase
    .from("review_response_drafts")
    .insert({
      review_id: reviewId,
      author_user_id: portal.user.id,
      body: responseBody.trim(),
      status: "pending",
    } as never)
    .select("id, review_id, author_user_id, body, status, reviewed_by, reviewed_at, created_at, updated_at")
    .single<ReviewResponseDraft>();

  if (error) {
    if (
      error.code === "PGRST301" ||
      error.message?.toLowerCase().includes("row-level security")
    ) {
      return NextResponse.json(
        { message: "You do not have permission to respond to this review." },
        { status: 403 },
      );
    }
    return NextResponse.json(
      { message: "Failed to create response draft." },
      { status: 500 },
    );
  }

  return NextResponse.json(draft, { status: 201 });
}
