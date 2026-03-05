import { NextResponse, type NextRequest } from "next/server";
import { getAdminFromRequest } from "@/lib/admin-auth";
import type { AdminPropertyListItem, AdminPropertyCreateInput } from "@/lib/types";

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

export async function GET(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin) {
    return NextResponse.json(
      { message: "Forbidden. Admin access required." },
      { status: 403 }
    );
  }

  const { data, error } = await admin.supabase
    .from("properties")
    .select(
      "id, display_name, address_line1, address_line2, city, province, postal_code, management_company, status, created_at, updated_at"
    )
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { message: "Failed to load properties" },
      { status: 500 }
    );
  }

  const items: AdminPropertyListItem[] = (data ?? []).map((row: DbRow) => ({
    id: row.id,
    display_name: row.display_name,
    address_line1: row.address_line1,
    address_line2: row.address_line2,
    city: row.city,
    province: row.province,
    postal_code: row.postal_code,
    management_company: row.management_company,
    status: row.status === "inactive" ? "inactive" : "active",
    created_at: row.created_at,
    updated_at: row.updated_at,
  }));

  return NextResponse.json({ items });
}

function validateCreateBody(
  body: unknown
): { ok: true; data: AdminPropertyCreateInput } | { ok: false; status: number; message: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, status: 400, message: "Invalid JSON body." };
  }
  const b = body as Record<string, unknown>;

  const display_name = typeof b.display_name === "string" ? b.display_name.trim() : "";
  if (!display_name) return { ok: false, status: 400, message: "display_name is required." };

  const address_line1 = typeof b.address_line1 === "string" ? b.address_line1.trim() : "";
  if (!address_line1) return { ok: false, status: 400, message: "address_line1 is required." };

  const city = typeof b.city === "string" ? b.city.trim() : "";
  if (!city) return { ok: false, status: 400, message: "city is required." };

  const province = typeof b.province === "string" ? b.province.trim() : "";
  if (!province) return { ok: false, status: 400, message: "province is required." };

  const postal_code = typeof b.postal_code === "string" ? b.postal_code.trim() : "";
  if (!postal_code) return { ok: false, status: 400, message: "postal_code is required." };

  const address_line2 =
    b.address_line2 == null ? null : typeof b.address_line2 === "string" ? b.address_line2.trim() || null : null;
  const management_company =
    b.management_company == null
      ? null
      : typeof b.management_company === "string"
        ? b.management_company.trim() || null
        : null;
  const status =
    b.status === "inactive" ? "inactive" : b.status === "active" ? "active" : "active";

  return {
    ok: true,
    data: {
      display_name,
      address_line1,
      address_line2,
      city,
      province,
      postal_code,
      management_company,
      status,
    },
  };
}

export async function POST(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin) {
    return NextResponse.json(
      { message: "Forbidden. Admin access required." },
      { status: 403 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body." }, { status: 400 });
  }

  const validation = validateCreateBody(body);
  if (!validation.ok) {
    return NextResponse.json(
      { message: validation.message },
      { status: validation.status }
    );
  }
  const { data: input } = validation;

  const { data: property, error } = await admin.supabase
    .from("properties")
    .insert({
      display_name: input.display_name,
      address_line1: input.address_line1,
      address_line2: input.address_line2 ?? null,
      city: input.city,
      province: input.province,
      postal_code: input.postal_code,
      management_company: input.management_company ?? null,
      status: input.status ?? "active",
      created_by: admin.user.id,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "PGRST301" || error.message?.toLowerCase().includes("row-level security")) {
      return NextResponse.json(
        { message: "Forbidden. Admin access required." },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { message: "Failed to create property." },
      { status: 500 }
    );
  }

  // Optional audit log (Slice 08)
  await admin.supabase.from("admin_audit_log").insert({
    admin_user_id: admin.user.id,
    action_type: "create",
    target_type: "property",
    target_id: property.id,
    details: { display_name: input.display_name },
  });

  return NextResponse.json({ id: property.id }, { status: 201 });
}
