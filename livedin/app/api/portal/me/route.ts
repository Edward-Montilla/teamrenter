import { NextResponse, type NextRequest } from "next/server";
import { getLandlordFromRequest } from "@/lib/portal-auth";

export async function GET(req: NextRequest) {
  const portal = await getLandlordFromRequest(req);
  if (!portal) {
    return NextResponse.json(
      { message: "Forbidden. Landlord or admin access required." },
      { status: 403 },
    );
  }
  return NextResponse.json({ id: portal.user.id, role: portal.user.role });
}
