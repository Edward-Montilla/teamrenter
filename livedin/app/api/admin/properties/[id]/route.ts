import { NextResponse, type NextRequest } from "next/server";
import { getAdminFromRequest } from "@/lib/admin-auth";
import type { AdminPropertyUpdateInput, AdminPropertyListItem } from "@/lib/types";

type DbRow = {
  id: string;
  display_name: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  province: string;
  postal_code: string;
  management_company: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

type DbUpdateRow = Partial<
  Pick<
    DbRow,
    | "display_name"
    | "address_line1"
    | "address_line2"
    | "city"
    | "province"
    | "postal_code"
    | "management_company"
    | "status"
  >
>;

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminFromRequest(req);
  if (!admin) {
    return NextResponse.json(
      { message: "Forbidden. Admin access required." },
      { status: 403 }
    );
  }

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ message: "Property ID required." }, { status: 400 });
  }

  const { data, error } = await admin.supabase
    .from("properties")
    .select(
      "id, display_name, address_line1, address_line2, city, province, postal_code, management_company, status, created_at, updated_at"
    )
    .eq("id", id)
    .maybeSingle<DbRow>();

  if (error) {
    return NextResponse.json(
      { message: "Failed to load property" },
      { status: 500 }
    );
  }

  if (!data) {
    return NextResponse.json({ message: "Property not found." }, { status: 404 });
  }

  const property: AdminPropertyListItem = {
    id: data.id,
    display_name: data.display_name,
    address_line1: data.address_line1,
    address_line2: data.address_line2,
    city: data.city,
    province: data.province,
    postal_code: data.postal_code,
    management_company: data.management_company,
    status: data.status === "inactive" ? "inactive" : "active",
    created_at: data.created_at,
    updated_at: data.updated_at,
  };

  return NextResponse.json(property);
}

function validateUpdateBody(
  body: unknown
): { ok: true; data: AdminPropertyUpdateInput } | { ok: false; status: number; message: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, status: 400, message: "Invalid JSON body." };
  }
  const b = body as Record<string, unknown>;

  const data: AdminPropertyUpdateInput = {};

  if (b.display_name !== undefined) {
    if (typeof b.display_name !== "string") return { ok: false, status: 400, message: "display_name must be a string." };
    data.display_name = b.display_name.trim();
    if (!data.display_name) return { ok: false, status: 400, message: "display_name cannot be empty." };
  }
  if (b.address_line1 !== undefined) {
    if (typeof b.address_line1 !== "string") return { ok: false, status: 400, message: "address_line1 must be a string." };
    data.address_line1 = b.address_line1.trim();
    if (!data.address_line1) return { ok: false, status: 400, message: "address_line1 cannot be empty." };
  }
  if (b.address_line2 !== undefined) {
    data.address_line2 =
      b.address_line2 == null ? null : typeof b.address_line2 === "string" ? b.address_line2.trim() || null : null;
    if (data.address_line2 !== null && typeof data.address_line2 !== "string")
      return { ok: false, status: 400, message: "address_line2 must be a string or null." };
  }
  if (b.city !== undefined) {
    if (typeof b.city !== "string") return { ok: false, status: 400, message: "city must be a string." };
    data.city = b.city.trim();
    if (!data.city) return { ok: false, status: 400, message: "city cannot be empty." };
  }
  if (b.province !== undefined) {
    if (typeof b.province !== "string") return { ok: false, status: 400, message: "province must be a string." };
    data.province = b.province.trim();
    if (!data.province) return { ok: false, status: 400, message: "province cannot be empty." };
  }
  if (b.postal_code !== undefined) {
    if (typeof b.postal_code !== "string") return { ok: false, status: 400, message: "postal_code must be a string." };
    data.postal_code = b.postal_code.trim();
    if (!data.postal_code) return { ok: false, status: 400, message: "postal_code cannot be empty." };
  }
  if (b.management_company !== undefined) {
    data.management_company =
      b.management_company == null
        ? null
        : typeof b.management_company === "string"
          ? b.management_company.trim() || null
          : null;
  }
  if (b.status !== undefined) {
    if (b.status !== "active" && b.status !== "inactive") {
      return { ok: false, status: 400, message: "status must be 'active' or 'inactive'." };
    }
    data.status = b.status as "active" | "inactive";
  }

  if (Object.keys(data).length === 0) {
    return { ok: false, status: 400, message: "No valid fields to update." };
  }

  return { ok: true, data };
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminFromRequest(req);
  if (!admin) {
    return NextResponse.json(
      { message: "Forbidden. Admin access required." },
      { status: 403 }
    );
  }

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ message: "Property ID required." }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body." }, { status: 400 });
  }

  const validation = validateUpdateBody(body);
  if (!validation.ok) {
    return NextResponse.json(
      { message: validation.message },
      { status: validation.status }
    );
  }
  const { data: input } = validation;

  const updatePayload: DbUpdateRow = {};
  if (input.display_name !== undefined) updatePayload.display_name = input.display_name;
  if (input.address_line1 !== undefined) updatePayload.address_line1 = input.address_line1;
  if (input.address_line2 !== undefined) updatePayload.address_line2 = input.address_line2;
  if (input.city !== undefined) updatePayload.city = input.city;
  if (input.province !== undefined) updatePayload.province = input.province;
  if (input.postal_code !== undefined) updatePayload.postal_code = input.postal_code;
  if (input.management_company !== undefined) updatePayload.management_company = input.management_company;
  if (input.status !== undefined) updatePayload.status = input.status;

  const { data: property, error } = await admin.supabase
    .from("properties")
    .update(updatePayload as never)
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) {
    if (error.code === "PGRST301" || error.message?.toLowerCase().includes("row-level security")) {
      return NextResponse.json(
        { message: "Forbidden. Admin access required." },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { message: "Failed to update property." },
      { status: 500 }
    );
  }

  if (!property) {
    return NextResponse.json({ message: "Property not found." }, { status: 404 });
  }

  await admin.supabase.from("admin_audit_log").insert({
    admin_user_id: admin.user.id,
    action_type: "update",
    target_type: "property",
    target_id: id,
    details: updatePayload,
  });

  return NextResponse.json({ id: property.id });
}
