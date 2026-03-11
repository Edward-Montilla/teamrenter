import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { ReviewCreateInput, ReviewScore } from "@/lib/types";
import { isValidReviewScore } from "@/lib/validation/review";

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

/** Create a Supabase client that acts as the user for this request (for RLS). */
function createUserClient(accessToken: string) {
  const url = getEnv("SUPABASE_URL");
  const anonKey = getEnv("SUPABASE_ANON_KEY");
  return createClient(url, anonKey, {
    global: {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  });
}

/** Validate review body; returns error message or null. */
function validateReviewBody(body: unknown): { ok: true; data: ReviewCreateInput } | { ok: false; status: 400; message: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, status: 400, message: "Invalid JSON body." };
  }
  const b = body as Record<string, unknown>;

  const property_id = typeof b.property_id === "string" ? b.property_id.trim() : null;
  if (!property_id) return { ok: false, status: 400, message: "property_id is required." };

  const metricKeys = [
    "management_responsiveness",
    "maintenance_timeliness",
    "listing_accuracy",
    "fee_transparency",
    "lease_clarity",
  ] as const;
  const metrics: Record<string, ReviewScore> = {};
  for (const key of metricKeys) {
    const v = b[key];
    if (!isValidReviewScore(v)) {
      return {
        ok: false,
        status: 400,
        message: `${key} must be between 0 and 5 in 0.5 increments.`,
      };
    }
    metrics[key] = v;
  }

  let text_input: string | null = null;
  if (b.text_input != null) {
    if (typeof b.text_input !== "string") return { ok: false, status: 400, message: "text_input must be a string." };
    if (b.text_input.length > 500) return { ok: false, status: 400, message: "text_input must be at most 500 characters." };
    text_input = b.text_input.trim() || null;
  }

  let tenancy_start: string | null = null;
  let tenancy_end: string | null = null;
  if (b.tenancy_start != null) {
    if (typeof b.tenancy_start !== "string") return { ok: false, status: 400, message: "tenancy_start must be a string." };
    tenancy_start = b.tenancy_start.trim() || null;
  }
  if (b.tenancy_end != null) {
    if (typeof b.tenancy_end !== "string") return { ok: false, status: 400, message: "tenancy_end must be a string." };
    tenancy_end = b.tenancy_end.trim() || null;
  }
  if (tenancy_start && tenancy_end) {
    const start = new Date(tenancy_start);
    const end = new Date(tenancy_end);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return { ok: false, status: 400, message: "Invalid tenancy dates." };
    }
    if (start > end) return { ok: false, status: 400, message: "tenancy_end must be on or after tenancy_start." };
  }

  const data: ReviewCreateInput = {
    property_id,
    management_responsiveness: metrics.management_responsiveness,
    maintenance_timeliness: metrics.maintenance_timeliness,
    listing_accuracy: metrics.listing_accuracy,
    fee_transparency: metrics.fee_transparency,
    lease_clarity: metrics.lease_clarity,
    text_input,
    tenancy_start,
    tenancy_end,
  };
  return { ok: true, data };
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id: propertyId } = await context.params;

  const authHeader = req.headers.get("Authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;
  if (!token) {
    return NextResponse.json(
      { message: "Unauthorized. Sign in to submit a review." },
      { status: 401 }
    );
  }

  const supabase = createUserClient(token);

  const { data: { user }, error: userError } = await supabase.auth.getUser(token);
  if (userError || !user) {
    return NextResponse.json(
      { message: "Invalid or expired session. Please sign in again." },
      { status: 401 }
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("email_verified")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile?.email_verified) {
    return NextResponse.json(
      { message: "Your email must be verified to submit a review." },
      { status: 403 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { message: "Invalid JSON body." },
      { status: 400 }
    );
  }

  const validation = validateReviewBody(body);
  if (!validation.ok) {
    return NextResponse.json(
      { message: validation.message },
      { status: validation.status }
    );
  }
  const { data: payload } = validation;

  if (payload.property_id !== propertyId) {
    return NextResponse.json(
      { message: "property_id in body must match the URL." },
      { status: 400 }
    );
  }

  const { data: review, error } = await supabase
    .from("reviews")
    .insert({
      property_id: payload.property_id,
      user_id: user.id,
      status: "pending",
      management_responsiveness: payload.management_responsiveness,
      maintenance_timeliness: payload.maintenance_timeliness,
      listing_accuracy: payload.listing_accuracy,
      fee_transparency: payload.fee_transparency,
      lease_clarity: payload.lease_clarity,
      text_input: payload.text_input,
      tenancy_start: payload.tenancy_start ?? null,
      tenancy_end: payload.tenancy_end ?? null,
    } as never)
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { message: "You have already reviewed this property." },
        { status: 409 }
      );
    }
    if (error.message?.includes("Review limit reached") || error.message?.includes("max 3 per 6 months")) {
      return NextResponse.json(
        { message: "Review limit reached. You can submit at most 3 reviews in 6 months." },
        { status: 429 }
      );
    }
    if (error.code === "PGRST301" || error.message?.toLowerCase().includes("row-level security") || error.message?.toLowerCase().includes("policy")) {
      return NextResponse.json(
        { message: "Your email must be verified to submit a review." },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { message: "Failed to save review. Please try again." },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { review_id: review.id },
    { status: 201 }
  );
}
