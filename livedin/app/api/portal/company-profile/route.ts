import { NextResponse, type NextRequest } from "next/server";
import { getLandlordFromRequest } from "@/lib/portal-auth";
import type { CompanyProfile } from "@/lib/types";

export async function GET(req: NextRequest) {
  const portal = await getLandlordFromRequest(req);
  if (!portal) {
    return NextResponse.json(
      { message: "Forbidden. Landlord or admin access required." },
      { status: 403 },
    );
  }

  const { data, error } = await portal.supabase
    .from("company_profiles")
    .select(
      "company_name, description, website_url, contact_email, contact_phone, logo_r2_key",
    )
    .eq("user_id", portal.user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { message: "Failed to load company profile." },
      { status: 500 },
    );
  }

  if (!data) {
    const empty: CompanyProfile = {
      company_name: "",
      description: null,
      website_url: null,
      contact_email: null,
      contact_phone: null,
      logo_r2_key: null,
    };
    return NextResponse.json(empty);
  }

  return NextResponse.json(data as CompanyProfile);
}

export async function PUT(req: NextRequest) {
  const portal = await getLandlordFromRequest(req);
  if (!portal) {
    return NextResponse.json(
      { message: "Forbidden. Landlord or admin access required." },
      { status: 403 },
    );
  }

  if (portal.user.role !== "landlord") {
    return NextResponse.json(
      { message: "Only landlords can edit a company profile." },
      { status: 403 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body." }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const company_name =
    typeof b.company_name === "string" ? b.company_name.trim() : "";
  if (!company_name) {
    return NextResponse.json(
      { message: "company_name is required." },
      { status: 400 },
    );
  }

  const payload = {
    user_id: portal.user.id,
    company_name,
    description:
      typeof b.description === "string" ? b.description.slice(0, 2000) : null,
    website_url: typeof b.website_url === "string" ? b.website_url.trim() : null,
    contact_email:
      typeof b.contact_email === "string" ? b.contact_email.trim() : null,
    contact_phone:
      typeof b.contact_phone === "string" ? b.contact_phone.trim() : null,
  };

  const { data: existing } = await portal.supabase
    .from("company_profiles")
    .select("user_id")
    .eq("user_id", portal.user.id)
    .maybeSingle();

  if (existing) {
    const { error } = await portal.supabase
      .from("company_profiles")
      .update(
        {
          company_name: payload.company_name,
          description: payload.description,
          website_url: payload.website_url,
          contact_email: payload.contact_email,
          contact_phone: payload.contact_phone,
        } as never,
      )
      .eq("user_id", portal.user.id);

    if (error) {
      return NextResponse.json(
        { message: "Failed to update profile." },
        { status: 500 },
      );
    }
  } else {
    const { error } = await portal.supabase
      .from("company_profiles")
      .insert(payload as never);

    if (error) {
      return NextResponse.json(
        { message: "Failed to create profile." },
        { status: 500 },
      );
    }
  }

  const { data: out } = await portal.supabase
    .from("company_profiles")
    .select(
      "company_name, description, website_url, contact_email, contact_phone, logo_r2_key",
    )
    .eq("user_id", portal.user.id)
    .maybeSingle();

  return NextResponse.json((out ?? payload) as CompanyProfile);
}
