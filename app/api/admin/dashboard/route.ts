import { NextResponse } from "next/server";
import { getAdminId, PRIVATE_HEADERS, rejectUnauthorized } from "@/lib/admin/api";
import { getBusinessMetrics } from "@/lib/admin/business-metrics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await getAdminId())) return rejectUnauthorized();
  try {
    const item = await getBusinessMetrics();
    return NextResponse.json({ item }, { headers: PRIVATE_HEADERS });
  } catch (error) {
    console.error(
      "Business dashboard metrics could not be loaded.",
      error instanceof Error ? error.name : "UnknownError",
    );
    return NextResponse.json(
      { message: "Business metrics could not be loaded right now." },
      { status: 500, headers: PRIVATE_HEADERS },
    );
  }
}
