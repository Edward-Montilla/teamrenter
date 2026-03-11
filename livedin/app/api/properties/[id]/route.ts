import { NextResponse, type NextRequest } from "next/server";
import { getPropertyDetail } from "@/lib/property-detail";

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    const payload = await getPropertyDetail(id);
    if (!payload) {
      return NextResponse.json({ message: "Property not found" }, { status: 404 });
    }

    return NextResponse.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load property detail";
    return NextResponse.json({ message }, { status: 500 });
  }
}

