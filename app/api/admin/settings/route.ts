import { NextResponse, type NextRequest } from "next/server";
import {
  badInput,
  getAdminId,
  PRIVATE_HEADERS,
  readJsonBody,
  rejectOrigin,
  rejectUnauthorized,
} from "@/lib/admin/api";
import { connectToDatabase } from "@/lib/db/connect";
import { businessSettingsSchema } from "@/lib/validations/business";
import { AuditLog, BusinessSettings } from "@/models/business";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await getAdminId())) return rejectUnauthorized();
  try {
    await connectToDatabase();
    const settings = await BusinessSettings.findById("primary").lean().exec();
    return NextResponse.json(
      {
        item: settings ?? {
          _id: "primary",
          legalName: "ArclivoLabs Tech",
          logoUrl: "",
          address: "",
          phone: "",
          email: "",
          gstin: "",
          gstRegistered: false,
          invoicePrefix: "ATL",
          paymentInstructions: "",
          currency: "INR",
        },
      },
      { headers: PRIVATE_HEADERS },
    );
  } catch (error) {
    console.error("Business settings could not be loaded.", error instanceof Error ? error.name : "UnknownError");
    return NextResponse.json({ message: "Business settings could not be loaded." }, { status: 500, headers: PRIVATE_HEADERS });
  }
}

export async function PATCH(request: NextRequest) {
  const actorId = await getAdminId();
  if (!actorId) return rejectUnauthorized();
  const originError = rejectOrigin(request);
  if (originError) return originError;
  const body = await readJsonBody(request);
  if (!body.ok) return body.response;
  const parsed = businessSettingsSchema.safeParse(body.value);
  if (!parsed.success) return badInput("Check the invoicing settings and try again.");
  try {
    await connectToDatabase();
    const updated = await BusinessSettings.findOneAndUpdate(
      { _id: "primary" },
      { $set: parsed.data },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
    ).lean().exec();
    await AuditLog.create({
      actorId,
      action: "business_settings.updated",
      entityType: "business_settings",
      entityId: "primary",
      summary: "Updated invoice business settings.",
      changes: { gstRegistered: parsed.data.gstRegistered, invoicePrefix: parsed.data.invoicePrefix },
    });
    return NextResponse.json({ item: updated }, { headers: PRIVATE_HEADERS });
  } catch (error) {
    console.error("Business settings update failed.", error instanceof Error ? error.name : "UnknownError");
    return NextResponse.json({ message: "Business settings could not be saved." }, { status: 500, headers: PRIVATE_HEADERS });
  }
}
