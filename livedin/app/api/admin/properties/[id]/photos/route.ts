import { NextResponse, type NextRequest } from "next/server";
import { getAdminFromRequest, insertAdminAuditLog } from "@/lib/admin-auth";
import { getPropertyPhotoDisplayUrl } from "@/lib/property-photos";
import type {
  AdminPropertyPhotoCreateInput,
  AdminPropertyPhotoItem,
} from "@/lib/types";

type PhotoRow = {
  id: string;
  property_id: string;
  r2_bucket: string;
  r2_key: string;
  content_type: string | null;
  bytes: number | null;
  width: number | null;
  height: number | null;
  uploaded_by: string | null;
  created_at: string;
};

function parseOptionalNumber(value: unknown): number | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value == null || value === "") {
    return null;
  }

  if (typeof value !== "number" || !Number.isFinite(value)) {
    return undefined;
  }

  return value;
}

function validateBody(
  body: unknown,
):
  | { ok: true; data: AdminPropertyPhotoCreateInput }
  | { ok: false; status: number; message: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, status: 400, message: "Invalid JSON body." };
  }

  const candidate = body as Record<string, unknown>;
  const r2_bucket =
    typeof candidate.r2_bucket === "string" ? candidate.r2_bucket.trim() : "";
  const r2_key =
    typeof candidate.r2_key === "string" ? candidate.r2_key.trim() : "";

  if (!r2_bucket) {
    return { ok: false, status: 400, message: "r2_bucket is required." };
  }

  if (!r2_key) {
    return { ok: false, status: 400, message: "r2_key is required." };
  }

  const content_type =
    candidate.content_type == null
      ? null
      : typeof candidate.content_type === "string"
        ? candidate.content_type.trim() || null
        : null;
  const bytes = parseOptionalNumber(candidate.bytes);
  const width = parseOptionalNumber(candidate.width);
  const height = parseOptionalNumber(candidate.height);

  if (
    bytes === undefined ||
    width === undefined ||
    height === undefined ||
    (bytes != null && bytes < 0) ||
    (width != null && width < 0) ||
    (height != null && height < 0)
  ) {
    return {
      ok: false,
      status: 400,
      message: "Photo metadata values must be positive numbers when provided.",
    };
  }

  return {
    ok: true,
    data: {
      r2_bucket,
      r2_key,
      content_type,
      bytes,
      width,
      height,
    },
  };
}

function toPhotoItem(row: PhotoRow): AdminPropertyPhotoItem {
  return {
    ...row,
    display_url: getPropertyPhotoDisplayUrl(row),
  };
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const admin = await getAdminFromRequest(req);
  if (!admin) {
    return NextResponse.json(
      { message: "Forbidden. Admin access required." },
      { status: 403 },
    );
  }

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ message: "Property ID required." }, { status: 400 });
  }

  const { data, error } = await admin.supabase
    .from("property_photos")
    .select(
      "id, property_id, r2_bucket, r2_key, content_type, bytes, width, height, uploaded_by, created_at",
    )
    .eq("property_id", id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { message: "Failed to load property photos." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    items: ((data ?? []) as PhotoRow[]).map(toPhotoItem),
  });
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const admin = await getAdminFromRequest(req);
  if (!admin) {
    return NextResponse.json(
      { message: "Forbidden. Admin access required." },
      { status: 403 },
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

  const validation = validateBody(body);
  if (!validation.ok) {
    return NextResponse.json(
      { message: validation.message },
      { status: validation.status },
    );
  }

  const { data, error } = await admin.supabase
    .from("property_photos")
    .insert({
      property_id: id,
      r2_bucket: validation.data.r2_bucket,
      r2_key: validation.data.r2_key,
      content_type: validation.data.content_type ?? null,
      bytes: validation.data.bytes ?? null,
      width: validation.data.width ?? null,
      height: validation.data.height ?? null,
      uploaded_by: admin.user.id,
    } as never)
    .select(
      "id, property_id, r2_bucket, r2_key, content_type, bytes, width, height, uploaded_by, created_at",
    )
    .maybeSingle<PhotoRow>();

  if (error) {
    return NextResponse.json(
      { message: "Failed to save property photo metadata." },
      { status: 500 },
    );
  }

  if (!data) {
    return NextResponse.json(
      { message: "Property photo metadata could not be created." },
      { status: 500 },
    );
  }

  await insertAdminAuditLog(admin, {
    admin_user_id: admin.user.id,
    action_type: "property_photo_create",
    target_type: "property_photo",
    target_id: data.id,
    details: {
      property_id: id,
      r2_bucket: data.r2_bucket,
      r2_key: data.r2_key,
    },
  });

  return NextResponse.json(toPhotoItem(data), { status: 201 });
}
