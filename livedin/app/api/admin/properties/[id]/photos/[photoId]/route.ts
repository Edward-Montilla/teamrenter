import { NextResponse, type NextRequest } from "next/server";
import { getAdminFromRequest } from "@/lib/admin-auth";

type DeletedPhotoRow = {
  id: string;
  property_id: string;
  r2_bucket: string;
  r2_key: string;
};

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string; photoId: string }> },
) {
  const admin = await getAdminFromRequest(req);
  if (!admin) {
    return NextResponse.json(
      { message: "Forbidden. Admin access required." },
      { status: 403 },
    );
  }

  const { id, photoId } = await context.params;
  if (!id || !photoId) {
    return NextResponse.json(
      { message: "Property ID and photo ID are required." },
      { status: 400 },
    );
  }

  const { data, error } = await admin.supabase
    .from("property_photos")
    .delete()
    .eq("property_id", id)
    .eq("id", photoId)
    .select("id, property_id, r2_bucket, r2_key")
    .maybeSingle<DeletedPhotoRow>();

  if (error) {
    return NextResponse.json(
      { message: "Failed to delete property photo metadata." },
      { status: 500 },
    );
  }

  if (!data) {
    return NextResponse.json(
      { message: "Property photo not found." },
      { status: 404 },
    );
  }

  await admin.supabase.from("admin_audit_log").insert({
    admin_user_id: admin.user.id,
    action_type: "property_photo_delete",
    target_type: "property_photo",
    target_id: data.id,
    details: {
      property_id: data.property_id,
      r2_bucket: data.r2_bucket,
      r2_key: data.r2_key,
    },
  } as never);

  return NextResponse.json({ id: data.id });
}
