import { Types } from "mongoose";
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
import { dealInputSchema } from "@/lib/validations/business";
import { Deal, ManagedService } from "@/models/business";
import { Enquiry } from "@/models/enquiry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function serialize(record: Record<string, unknown> & { _id: Types.ObjectId }) {
  return {
    ...record,
    _id: record._id.toString(),
    leadId: record.leadId ? String(record.leadId) : "",
  };
}

export async function GET(request: NextRequest) {
  if (!(await getAdminId())) return rejectUnauthorized();
  try {
    await connectToDatabase();
    const rawStatus = request.nextUrl.searchParams.get("status");
    const filter = rawStatus
      ? { status: rawStatus }
      : {};
    const deals = await Deal.find(filter)
      .sort({ createdAt: -1 })
      .limit(250)
      .lean()
      .exec();
    return NextResponse.json(
      { items: deals.map((deal) => serialize(deal as never)) },
      { headers: PRIVATE_HEADERS },
    );
  } catch (error) {
    console.error("Deals could not be loaded.", error instanceof Error ? error.name : "UnknownError");
    return NextResponse.json({ message: "Deals could not be loaded right now." }, { status: 500, headers: PRIVATE_HEADERS });
  }
}

export async function POST(request: NextRequest) {
  const actorId = await getAdminId();
  if (!actorId) return rejectUnauthorized();
  const originError = rejectOrigin(request);
  if (originError) return originError;
  const body = await readJsonBody(request);
  if (!body.ok) return body.response;
  const parsed = dealInputSchema.safeParse(body.value);
  if (!parsed.success) return badInput("Check the deal details and try again.");
  try {
    await connectToDatabase();
    const service = await ManagedService.findById(parsed.data.serviceId).lean().exec();
    if (!service) return badInput("The selected service is unavailable.");
    const lead = parsed.data.leadId
      ? await Enquiry.findById(parsed.data.leadId).lean().exec()
      : null;
    if (parsed.data.leadId && !lead) {
      return NextResponse.json({ message: "The linked lead was not found." }, { status: 404, headers: PRIVATE_HEADERS });
    }

    const data = parsed.data;
    const deal = await Deal.create({
      leadId: lead?._id,
      clientName: lead?.fullName ?? data.clientName,
      businessName: lead?.companyName ?? data.businessName,
      email: lead?.email ?? data.email,
      phone: lead?.phone ?? data.phone,
      title: data.title,
      serviceId: data.serviceId,
      serviceName: service.name,
      amountMinor: data.amountMinor,
      expectedCloseDate: data.expectedCloseDate
        ? new Date(`${data.expectedCloseDate}T23:59:59.999Z`)
        : undefined,
      status: data.status,
      requirements: lead?.projectDescription ?? data.requirements,
      internalNotes: data.internalNotes,
      wonAt: data.status === "Won" ? new Date() : undefined,
      lostAt: data.status === "Lost" ? new Date() : undefined,
    });
    return NextResponse.json(
      { item: serialize(deal as never) },
      { status: 201, headers: PRIVATE_HEADERS },
    );
  } catch (error) {
    console.error("Deal could not be created.", error instanceof Error ? error.name : "UnknownError");
    return NextResponse.json({ message: "The deal could not be saved right now." }, { status: 500, headers: PRIVATE_HEADERS });
  }
}
